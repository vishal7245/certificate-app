import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { uploadToS3 } from '@/app/lib/s3';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

function getUserIdFromRequest(request: Request): string | null {
  const token = request.headers.get('cookie')?.split('; ').find((c) => c.startsWith('token='))?.split('=')[1];
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return decoded.userId;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const templates = await prisma.template.findMany({
    where: { creatorId: userId },
    select: { id: true, name: true, imageUrl: true, placeholders: true },
  });

  return NextResponse.json(templates);
}

export async function POST(request: Request) {
  const userId = getUserIdFromRequest(request);
  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const image = formData.get('image') as File;
  const templateData = JSON.parse(formData.get('template') as string);

  const key = `templates/${Date.now()}-${image.name}`;
  const imageUrl = await uploadToS3(image, key);

  const template = await prisma.template.create({
    data: {
      name: templateData.name || 'Untitled Template',
      imageUrl,
      placeholders: templateData.placeholders,
      creatorId: userId,
    },
  });

  return NextResponse.json(template);
}
