export const runtime = 'nodejs';

import { NextResponse } from "next/server";
import { uploadToS3 } from "@/app/lib/s3";

interface FileLike {
  arrayBuffer: () => Promise<ArrayBuffer>;
  name?: string;
}

function isFileLike(value: any): value is FileLike {
  return (
    value &&
    typeof value.arrayBuffer === "function" &&
    (typeof value.name === "string" || typeof value.name === "undefined")
  );
}

export async function POST(request: Request) {
    try {
      const formData = await request.formData();
      const font = formData.get('font');
  
      if (!font || !isFileLike(font)) {
        return NextResponse.json({ error: 'No font file received' }, { status: 400 });
      }
  
      const arrayBuffer = await font.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const key = `fonts/${Date.now()}-${font.name}`;
      
      const fontUrl = await uploadToS3(buffer, key, font.type || 'application/octet-stream');
      
      return NextResponse.json({ fontUrl });
    } catch (error) {
      console.error('Error uploading font:', error);
      return NextResponse.json({ error: 'Font upload failed' }, { status: 500 });
    }
  }