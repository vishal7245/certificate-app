import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME!;


export async function uploadToS3(
  file: Buffer | File,
  key: string
): Promise<string> {
  let buffer: Buffer;
  let contentType = "application/octet-stream"; // Default content type

  // Handle file type
  if (file instanceof File) {
    buffer = Buffer.from(await file.arrayBuffer());
    contentType = file.type || "application/octet-stream";
  } else {
    buffer = file;
  }

  // Upload the file to S3
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3Client.send(command);

  // Return the pre-signed URL for the uploaded file
  const getCommand = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return await getSignedUrl(s3Client, getCommand, { expiresIn: 604800 }); // Expires in 7 days
}
