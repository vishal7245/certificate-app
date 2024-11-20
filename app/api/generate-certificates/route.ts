export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { parse } from 'csv-parse/sync';
import { uploadToS3 } from '@/app/lib/s3';
import { createCanvas, loadImage } from 'canvas';
import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

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

function replaceVariables(text: string, data: Record<string, string>): string {
  return text.replace(/<([^>]+)>/g, (match, variable) => {
    const cleanVariable = variable.trim();
    return data[cleanVariable] || match;
  });
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
      // Load the template image
      const image = await loadImage(template.imageUrl);
      const canvas = createCanvas(image.width, image.height);
      const ctx = canvas.getContext('2d');

      // Draw the template image
      ctx.drawImage(image, 0, 0);

      // Add placeholders
      (template.placeholders as any[])?.forEach((placeholder: any) => {
        const value = record[placeholder.name];
        if (value) {
          const canvasFontSize = placeholder.style.fontSize;
          
          ctx.textBaseline = 'middle'; // Add this line before drawing text
          ctx.font = `${placeholder.style.fontWeight} ${canvasFontSize}px ${placeholder.style.fontFamily}`;
          ctx.fillStyle = placeholder.style.fontColor;
          ctx.textAlign = placeholder.style.textAlign as CanvasTextAlign;
          
          let x = placeholder.position.x;
          if (placeholder.style.textAlign === 'right') {
            // For right alignment, x is already at the right edge
            ctx.textAlign = 'right';
          } else if (placeholder.style.textAlign === 'center') {
            ctx.textAlign = 'center';
          } else {
            // For left alignment, x is already at the left edge
            ctx.textAlign = 'left';
          }
          
          ctx.fillText(value, x, placeholder.position.y);
        }
      });

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

      const emailConfig = await prisma.emailConfig.findUnique({ where: { userId } });
      const emailSubject = replaceVariables(emailConfig?.defaultSubject || 'Your Certificate', record);
      const emailMessage = replaceVariables(emailConfig?.defaultMessage || 'Please find your certificate attached.', record);
      const emailHeading = replaceVariables(emailConfig?.emailHeading || 'Congratulations on receiving your certificate!', record);

      const htmlContent = `
      <div style="background-color: #f0f4f8; padding: 100px 0;">
        <div style="font-family: Arial, sans-serif; line-height: 1.6; max-width: 600px; margin: 0 auto; border: 1px solid #d0d7de; border-radius: 10px; padding: 20px; background-color: #ffffff;">
          <div style="text-align: center; margin-bottom: 20px;">
            <img src="${emailConfig?.logoUrl}" alt="Certifier Logo" style="height: 50px;" />
          </div>
          <h1 style="font-size: 24px; text-align: center; margin: 0 0 20px 0; color: #004085;">
            ${emailHeading}
          </h1>
          <p style="font-size: 16px; color: #555; text-align: center;">
            ${emailMessage}
          </p>
          <div style="text-align: center; margin-top: 30px;">
            <a href="${certificate.generatedImageUrl}" style="background-color: #007BFF; color: #fff; padding: 10px 20px; font-size: 16px; text-decoration: none; border-radius: 5px;">
              Download Certificate
            </a>
          </div>
          <footer style="margin-top: 30px; text-align: center; font-size: 14px; color: #777;">
            <p>
              Having trouble with your certificate? Contact us at
              <a href="mailto:${emailConfig?.supportEmail}" style="color: #007BFF; text-decoration: none;">
                ${emailConfig?.supportEmail}
              </a>
            </p>
          </footer>
        </div>
      </div>
    `;

      const email = record['Email'];
      if (email) {
        try {
          const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: email,
            subject: emailSubject,
            text: emailMessage,
            html: htmlContent,
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