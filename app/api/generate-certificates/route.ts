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
import { createHash } from 'crypto';
import os from 'os';

const fontCache: Map<string, Promise<string>> = new Map();


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

function cleanupTempFonts() {
  const tempDir = path.join(__dirname, 'temp_fonts');
  if (fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
}

async function verifyFontLoaded(ctx: CanvasRenderingContext2D, fontFamily: string): Promise<boolean> {
  // Test if font is actually loaded by comparing metrics with a fallback font
  const testText = 'test';
  const fallbackMetrics = ctx.measureText(testText);
  
  ctx.font = `20px "${fontFamily}"`;
  const customFontMetrics = ctx.measureText(testText);
  
  // If metrics are different, the custom font is loaded
  return fallbackMetrics.width !== customFontMetrics.width;
}

async function getFontPath(fontUrl: string): Promise<string> {
  if (fontCache.has(fontUrl)) {
    console.log(`Font is already being downloaded or cached: ${fontUrl}`);
    return fontCache.get(fontUrl)!;
  }

  const fontDownloadPromise = (async () => {
    try {
      // Use the OS temporary directory
      const tempDir = path.join(os.tmpdir(), 'temp_fonts');
      if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
      }

      // Create a unique filename based on a hash of the font URL
      const hash = createHash('md5').update(fontUrl).digest('hex');
      const extension = path.extname(fontUrl.split('?')[0]) || '.ttf'; // Default to .ttf if no extension
      const fontFilename = `${hash}${extension}`;
      const fontPath = path.join(tempDir, fontFilename);

      // Check if the font file already exists
      if (!fs.existsSync(fontPath)) {
        const response = await fetch(fontUrl);
        if (!response.ok) {
          throw new Error(`Failed to download font: ${fontUrl}`);
        }

        const fontBuffer = await response.buffer();
        fs.writeFileSync(fontPath, fontBuffer);
        console.log(`Font downloaded and saved: ${fontPath}`);
      } else {
        console.log(`Font already exists: ${fontPath}`);
      }

      return fontPath;
    } catch (error) {
      // Remove the failed Promise from the cache
      fontCache.delete(fontUrl);
      throw error;
    }
  })();

  fontCache.set(fontUrl, fontDownloadPromise);

  return fontDownloadPromise;
}

async function loadCustomFont(ctx: CanvasRenderingContext2D, fontFamily: string, fontUrl: string): Promise<boolean> {
  try {
    const fontPath = await getFontPath(fontUrl);
    if (!fontPath) {
      console.error(`Failed to get font path for: ${fontUrl}`);
      return false;
    }

    // Register the font with node-canvas
    registerFont(fontPath, { family: fontFamily });
    console.log(`Registered font: ${fontFamily} from ${fontPath}`);

    // Verify the font is actually loaded
    const fontLoaded = await verifyFontLoaded(ctx, fontFamily);
    if (!fontLoaded) {
      console.error(`Font verification failed for: ${fontFamily}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Font loading error for ${fontUrl}:`, error);
    return false;
  }
}

async function registerCustomFonts(placeholders: any[]) {
  const customFonts = new Map(); // Map from fontFamily to fontUrl

  // Collect custom fonts
  for (const placeholder of placeholders) {
    if (placeholder.style.customFontUrl) {
      // Generate a unique font family name
      const fontFamily = `customFont-${placeholder.name}_${Date.now()}`;
      customFonts.set(fontFamily, placeholder.style.customFontUrl);
      // Update the placeholder's font family to the unique name
      placeholder.style.fontFamily = fontFamily;
    }
  }

  // Load and register all custom fonts
  await Promise.all(
    Array.from(customFonts.entries()).map(async ([fontFamily, fontUrl]) => {
      const fontPath = await getFontPath(fontUrl);
      registerFont(fontPath, { family: fontFamily });
      console.log(`Registered font: ${fontFamily} from ${fontPath}`);
    })
  );
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

      if (Array.isArray(template.placeholders)) {
        await registerCustomFonts(template.placeholders);
      }
      
      // Load the template image
      const image = await loadImage(template.imageUrl);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');

      // Draw the template image
      ctx.drawImage(image, 0, 0);

      // Add placeholders
      await Promise.all(
        (template.placeholders as any[])?.map(async (placeholder: any) => {
          const value = record[placeholder.name];
          if (value) {
            let fontFamily = placeholder.style.fontFamily || 'Arial';

            // Apply text styles with logging
            ctx.textBaseline = 'middle';
            const fontString = `${placeholder.style.fontWeight} ${placeholder.style.fontSize}px ${fontFamily}`;
            ctx.font = fontString;
            console.log(`Applied font string: ${fontString}`);

            ctx.fillStyle = placeholder.style.fontColor;
            ctx.textAlign = placeholder.style.textAlign as CanvasTextAlign;

            // Draw the text
            ctx.fillText(value, placeholder.position.x, placeholder.position.y);
          }
        })
      );
      
      


      // Add signatures
      if (template.signatures) {
        await Promise.all((template.signatures as any[]).map(async (signature: any) => {
          if (signature.imageUrl) {
            try {
              const signatureImage = await loadImage(signature.imageUrl);
              
              // Calculate scale factors to maintain aspect ratio within bounds
              const scaleWidth = signature.style.Width / signatureImage.width;
              const scaleHeight = signature.style.Height / signatureImage.height;
              const scale = Math.min(scaleWidth, scaleHeight);
              
              // Calculate scaled dimensions
              const scaledWidth = signatureImage.width * scale;
              const scaledHeight = signatureImage.height * scale;

              // Adjust position to account for the offset
              // Subtract half the width and height to move the top-left corner to the center point
              const adjustedX = signature.position.x - (scaledWidth / 2);
              const adjustedY = signature.position.y - (scaledHeight / 2);

              // Draw the signature at the corrected position
              ctx.drawImage(
                signatureImage,
                adjustedX,
                adjustedY,
                scaledWidth,
                scaledHeight
              );
            } catch (error) {
              console.error(`Failed to load signature image: ${signature.imageUrl}`, error);
            }
          }
        }));
      }

      // Convert canvas to buffer and upload
      const buffer = canvas.toBuffer('image/png');
      const key = `certificates/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.png`;
      const certificateUrl = await uploadToS3(buffer, key);

      // Save certificate
      const certificate = await prisma.certificate.create({
        data: {
          templateId,
          uniqueIdentifier: `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          data: record,
          generatedImageUrl: certificateUrl,
          creatorId: userId,
        },
      });

      // Send email
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

  cleanupTempFonts();
  return NextResponse.json(certificates);
}