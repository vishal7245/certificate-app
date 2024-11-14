// api/templates/route.ts
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
    const templateData = await request.json();

    const template = await prisma.template.create({
      data: {
        name: templateData.name || "Untitled Template",
        imageUrl: templateData.imageUrl,
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
