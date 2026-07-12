import { S3Client, ListObjectsV2Command, GetObjectCommand, HeadObjectCommand, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import config from '../config.js';

export const s3 = new S3Client({
  endpoint: config.s3.endpoint,
  region: config.s3.region,
  credentials: {
    accessKeyId: config.s3.accessKeyId,
    secretAccessKey: config.s3.secretAccessKey,
  },
  forcePathStyle: config.s3.forcePathStyle,
});

export async function listS3Objects(prefix = '', maxKeys = 1000) {
  const cmd = new ListObjectsV2Command({
    Bucket: config.s3.bucket,
    Prefix: prefix,
    MaxKeys: maxKeys,
  });
  const res = await s3.send(cmd);
  return res.Contents || [];
}

export async function getS3Object(key) {
  const cmd = new GetObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  });
  return s3.send(cmd);
}

export async function headS3Object(key) {
  const cmd = new HeadObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  });
  return s3.send(cmd);
}

export async function putS3Object(key, body, contentType) {
  console.log(`[S3] PutObject key=${key} size=${body.length} type=${contentType}`);
  const cmd = new PutObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
    Body: body,
    ContentType: contentType,
    ContentLength: body.length,
  });
  return s3.send(cmd);
}

export async function deleteS3Object(key) {
  const cmd = new DeleteObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  });
  return s3.send(cmd);
}

export async function getPresignedUrl(key, expiresIn = 3600) {
  const cmd = new GetObjectCommand({
    Bucket: config.s3.bucket,
    Key: key,
  });
  return getSignedUrl(s3, cmd, { expiresIn });
}
