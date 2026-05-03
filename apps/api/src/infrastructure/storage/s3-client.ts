import { S3Client, PutObjectCommand, GetObjectCommand, CreateBucketCommand, HeadBucketCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { env } from "@/config/env.js";

export function createS3Client(): S3Client {
  return new S3Client({
    region: env.awsRegion,
    endpoint: env.s3Endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId: env.s3AccessKey, secretAccessKey: env.s3SecretKey },
  });
}

export function createPublicS3Client(): S3Client {
  return new S3Client({
    region: env.awsRegion,
    endpoint: env.s3PublicEndpoint,
    forcePathStyle: true,
    credentials: { accessKeyId: env.s3AccessKey, secretAccessKey: env.s3SecretKey },
  });
}

export async function ensureBucket(s3: S3Client, bucket: string): Promise<void> {
  try {
    await s3.send(new HeadBucketCommand({ Bucket: bucket }));
    return;
  } catch {
    await s3.send(new CreateBucketCommand({ Bucket: bucket }));
  }
}

export async function presignPut(bucket: string, key: string, contentType: string): Promise<string> {
  const publicS3 = createPublicS3Client();
  const cmd = new PutObjectCommand({ Bucket: bucket, Key: key, ContentType: contentType });
  return getSignedUrl(publicS3, cmd, { expiresIn: 600 });
}

export async function getObjectBytes(s3: S3Client, bucket: string, key: string): Promise<Uint8Array> {
  const r = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const stream = r.Body as ReadableStream<Uint8Array> | undefined;
  if (!stream) return new Uint8Array();
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  let len = 0;
  for (const c of chunks) len += c.byteLength;
  const out = new Uint8Array(len);
  let off = 0;
  for (const c of chunks) {
    out.set(c, off);
    off += c.byteLength;
  }
  return out;
}
