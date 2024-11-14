import { NextResponse } from 'next/server';
import prisma from '@/app/lib/db';
import { uploadToS3 } from '@/app/lib/s3';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET!;

function getUserIdFromRequest(request: Request): string | null {
  const token = request.headers
    .get("cookie")
    ?.split("; ")
    .find((c) => c.startsWith("token="))
    ?.split("=")[1];
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
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const image = formData.get("image");

    if (!image || !(image instanceof File)) {
      return NextResponse.json({ error: "Invalid image file" }, { status: 400 });
    }

    // Convert Blob to Buffer
    const buffer = Buffer.from(await image.arrayBuffer());
    const key = `templates/${Date.now()}-${(image as File).name}`;
    const imageUrl = await uploadToS3(buffer, key);

    const templateData = JSON.parse(formData.get("template") as string);

    const template = await prisma.template.create({
      data: {
        name: templateData.name || "Untitled Template",
        imageUrl,
        placeholders: templateData.placeholders,
        creatorId: userId,
      },
    });

    return NextResponse.json(template);
  } catch (error) {
    console.error("Error in POST /api/templates:", error);
    return NextResponse.json({ error: "Failed to create template" }, { status: 500 });
  }
}