import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { uploadToS3 } from '@/app/lib/s3';



export async function GET() {
  try {
    // Fetch all templates from the database
    const templates = await prisma.template.findMany({
      select: {
        id: true,
        name: true,
        imageUrl: true,
        placeholders: true,
      },
    });
    return NextResponse.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const image = formData.get('image') as File;
    const templateData = JSON.parse(formData.get('template') as string);

    // Upload image to S3
    const key = `templates/${Date.now()}-${image.name}`;
    const imageUrl = await uploadToS3(image, key);

    // Save template to database
    const template = await prisma.template.create({
      data: {
        name: templateData.name || 'Untitled Template',
        imageUrl,
        placeholders: templateData.placeholders,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error('Error creating template:', error);
    return NextResponse.json(
      { error: 'Failed to create template' },
      { status: 500 }
    );
  }
}