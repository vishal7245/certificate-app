export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { parse } from 'csv-parse/sync';
import { uploadToS3 } from '@/app/lib/s3';
import { createCanvas, loadImage, registerFont, CanvasRenderingContext2D } from 'canvas';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import fetch from 'node-fetch';
import os from 'os';

interface FileLike {
  arrayBuffer: () => Promise<ArrayBuffer>;
  text: () => Promise<string>;
  name?: string;
  size?: number;
  type?: string;
}

function isFileLike(value: any): value is FileLike {
  return (
    value &&
    typeof value.arrayBuffer === 'function' &&
    typeof value.text === 'function' &&
    (typeof value.name === 'string' || typeof value.name === 'undefined')
  );
}

async function downloadFont(fontUrl: string): Promise<string> {
  try {
    const tempDir = path.join(os.tmpdir(), 'temp_fonts');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }

    const extension = path.extname(fontUrl.split('?')[0]) || '.ttf';
    const fontFilename = `font-${Date.now()}${extension}`;
    const fontPath = path.join(tempDir, fontFilename);

    const response = await fetch(fontUrl);
    if (!response.ok) {
      throw new Error(`Failed to download font: ${fontUrl}`);
    }

    const fontBuffer = await response.buffer();
    fs.writeFileSync(fontPath, fontBuffer);

    return fontPath;
  } catch (error) {
    console.error(`Error downloading font: ${fontUrl}`, error);
    throw error;
  }
}

async function loadCustomFont(ctx: CanvasRenderingContext2D, fontUrl: string, customfontFamily: string): Promise<string | null> {
  try {
    const fontPath = await downloadFont(fontUrl);
    if (!fontPath) {
      console.error(`Failed to download font from: ${fontUrl}`);
      return null;
    }

    const fontFamily = customfontFamily;
    registerFont(fontPath, { family: fontFamily });

    return fontFamily;
  } catch (error) {
    console.error(`Error loading custom font: ${fontUrl}`, error);
    return null;
  }
}

const JWT_SECRET = process.env.JWT_SECRET!;

function getUserIdFromRequest(request: Request): string | null {
  const token = request.headers
    .get('cookie')
    ?.split('; ')
    .find((c) => c.startsWith('token='))
    ?.split('=')[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const csvFile = formData.get('csv');
  const templateId = formData.get('templateId') as string;

  if (!csvFile) {
    return NextResponse.json({ error: 'No CSV file provided' }, { status: 400 });
  }

  if (!isFileLike(csvFile)) {
    return NextResponse.json({ error: 'Invalid CSV file' }, { status: 400 });
  }

  const csvText = await csvFile.text();
  const records = parse(csvText, { columns: true });

  const template = await prisma.template.findUnique({ where: { id: templateId } });
  if (!template || template.creatorId !== userId) {
    return NextResponse.json({ error: 'Unauthorized access to template' }, { status: 403 });
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const certificates = await Promise.all(
    records.map(async (record: Record<string, string>) => {
      const image = await loadImage(template.imageUrl);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');

      ctx.drawImage(image, 0, 0);

      await Promise.all(
        (template.placeholders as any[])?.map(async (placeholder: any) => {
          const value = record[placeholder.name];
          if (value) {
            let fontFamily = placeholder.style.fontFamily;
            console.log(`Place 1: ${fontFamily}`)
            if (placeholder.style.customFontUrl) {
              const customFontLoaded = await loadCustomFont(ctx, placeholder.style.customFontUrl, placeholder.style.customfontFamily);
              if (customFontLoaded) {
                fontFamily = customFontLoaded;
                console.log(`Place 2: ${fontFamily}`)
              } else {
                console.warn(`Falling back to default font for placeholder: ${placeholder.name}`);
              }
            }

            ctx.textBaseline = 'middle';
            ctx.font = `${placeholder.style.fontWeight} ${placeholder.style.fontSize}px ${fontFamily}`;
            ctx.fillStyle = placeholder.style.fontColor;
            ctx.textAlign = placeholder.style.textAlign;

            ctx.fillText(value, placeholder.position.x, placeholder.position.y);
          }
        })
      );

      const buffer = canvas.toBuffer('image/png');
      const key = `certificates/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
      const certificateUrl = await uploadToS3(buffer, key);

      const certificate = await prisma.certificate.create({
        data: {
          templateId,
          uniqueIdentifier: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          data: record,
          generatedImageUrl: certificateUrl,
          creatorId: userId,
        },
      });

      const email = record['Email'];
      if (email) {
        try {
          const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: 'Your Certificate',
            text: 'Please find your certificate attached.',
            html: '<p>Please find your certificate attached.</p>',
            attachments: [
              {
                filename: 'certificate.png',
                content: buffer,
                contentType: 'image/png',
              },
            ],
          };

          await transporter.sendMail(mailOptions);
        } catch (emailError) {
          console.error(`Failed to send email to ${email}:`, emailError);
        }
      }

      return certificate;
    })
  );

  return NextResponse.json(certificates);
}
