// api/upload-image/route.ts
import { NextResponse } from "next/server";
import { uploadToS3 } from "@/app/lib/s3";

export async function POST(request: Request) {
    try {
      const formData = await request.formData();
      const image = formData.get("image");
  
      if (!image || !(image instanceof Blob)) {
        console.error("Invalid file received:", image);
        return NextResponse.json({ error: "Invalid file" }, { status: 400 });
      }
      
  
      const buffer = Buffer.from(await image.arrayBuffer());
      const key = `templates/${Date.now()}-${(image as File).name}`;
      const imageUrl = await uploadToS3(buffer, key);
  
      return NextResponse.json({ imageUrl });
    } catch (error) {
      console.error("Error uploading image:", error);
      return NextResponse.json({ error: "Failed to upload image" }, { status: 500 });
    }
  }
  