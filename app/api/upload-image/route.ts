// /api/upload-image/route.ts

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
    console.log("Received request to /api/upload-image");

    // Parse the form data from the request
    const formData = await request.formData();
    console.log("Form data parsed");
    const image = formData.get("image");
    console.log("Image retrieved from form data:", image);

    if (!image) {
      console.error("No file received:", image);
      return NextResponse.json({ error: "No file received" }, { status: 400 });
    }

    if (!isFileLike(image)) {
      console.error("Invalid file received:", image);
      return NextResponse.json({ error: "Invalid file type" }, { status: 400 });
    }

    // Convert the Blob to a Buffer
    console.log("Converting image to arrayBuffer");
    const arrayBuffer = await image.arrayBuffer();
    console.log("ArrayBuffer obtained");
    const buffer = Buffer.from(arrayBuffer);
    console.log("Buffer created from ArrayBuffer");
    const key = `templates/${Date.now()}-${image.name || "image"}`;
    console.log("Key for S3 upload:", key);

    // Upload the file to S3
    console.log("Uploading to S3");
    const imageUrl = await uploadToS3(buffer, key);
    console.log("Image uploaded to S3, URL:", imageUrl);

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
