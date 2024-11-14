import { NextResponse } from "next/server";
import { uploadToS3 } from "@/app/lib/s3";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("image");

    if (!file || !(file instanceof Blob)) {
      console.error("Invalid file received:", file);
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }

    // Convert Blob to Buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    const key = `templates/${Date.now()}-${file.name}`;

    // Upload to S3 and get URL
    const imageUrl = await uploadToS3(buffer, key);

    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Error uploading image:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
