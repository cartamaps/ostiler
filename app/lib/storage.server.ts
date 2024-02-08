import {
  PutObjectCommand,
  GetObjectCommand,
  S3Client,
  S3ClientConfig,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export class StorageAdapter {
  client: S3Client;
  bucket: string;

  constructor(config: S3ClientConfig, bucket: string) {
    this.client = new S3Client(config);
    this.bucket = bucket;
  }

  async signedPut(path: string) {
    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });
    return await getSignedUrl(this.client, command, { expiresIn: 3600 });
  }

  async signedGet(path: string) {
    const command = new GetObjectCommand({
      Bucket: this.bucket,
      Key: path,
    });
    return await getSignedUrl(this.client, command, { expiresIn: 3600 });
  }

  async getObject(path: string) {
    return await this.client.send(
      new GetObjectCommand({ Bucket: this.bucket, Key: path })
    );
  }

  async putObject({
    path,
    content,
    metadata = {},
  }: {
    path: string;
    content: string | Uint8Array | Buffer;
    metadata?: Record<string, string>;
  }) {
    try {
      return await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: path,
          Body: content,
          Metadata: metadata,
        })
      );
    } catch (error) {}
  }
}
