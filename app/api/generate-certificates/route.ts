import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { parse } from 'csv-parse/sync';
import { uploadToS3 } from '@/app/lib/s3';
import { createCanvas, loadImage } from 'canvas';
import nodemailer from 'nodemailer';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const csvFile = formData.get('csv') as File;
    const templateId = formData.get('templateId') as string;

    const csvText = await csvFile.text();
    const records = parse(csvText, { columns: true });

    const template = await prisma.template.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Configure the transporter using environment variables
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

        (template.placeholders as any[])?.forEach((placeholder: any) => {
          const value = record[placeholder.name];
          if (value) {
            ctx.font = '30px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(
              value,
              placeholder.position.x,
              placeholder.position.y
            );
          }
        });

        // Upload generated certificate to S3
        const buffer = canvas.toBuffer('image/png');
        const key = `certificates/${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}.png`;
        const certificateUrl = await uploadToS3(buffer, key);

        // Create certificate record
        const certificate = await prisma.certificate.create({
          data: {
            templateId,
            uniqueIdentifier: `CERT-${Date.now()}-${Math.random()
              .toString(36)
              .substr(2, 9)}`,
            data: record,
            generatedImageUrl: certificateUrl,
          },
        });

        // Send email if Email field is present
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
  } catch (error) {
    console.error('Error generating certificates:', error);
    return NextResponse.json(
      { error: 'Failed to generate certificates' },
      { status: 500 }
    );
  }
}
