// api/upload-image/route.ts
import { NextResponse } from "next/server";
import { uploadToS3 } from "@/app/lib/s3";

export async function POST(request: Request) {
  try {
    // Parse the form data from the request
    const formData = await request.formData();
    const image = formData.get("image");

    if (!(image instanceof File)) {
      console.error("Invalid file received:", image);
      return NextResponse.json({ error: "Invalid file" }, { status: 400 });
    }

    // Convert the Blob to a Buffer
    const arrayBuffer = await image.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const key = `templates/${Date.now()}-${(image as any).name || "image"}`; // Use a default name if not available

    // Upload the file to S3
    const imageUrl = await uploadToS3(buffer, key);

    // Return the URL of the uploaded file
    return NextResponse.json({ imageUrl });
  } catch (error) {
    console.error("Error uploading image:", error);
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}

  