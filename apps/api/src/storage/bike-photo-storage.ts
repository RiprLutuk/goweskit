import { randomUUID } from 'node:crypto';

import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

export const BIKE_PHOTO_MAX_BYTES = 700_000;

const PHOTO_TYPES = {
  'image/gif': {
    extension: 'gif',
    matches: (bytes: Uint8Array) => {
      const signature = Buffer.from(bytes.subarray(0, 6)).toString('ascii');
      return signature === 'GIF87a' || signature === 'GIF89a';
    },
  },
  'image/jpeg': {
    extension: 'jpg',
    matches: (bytes: Uint8Array) =>
      bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff,
  },
  'image/png': {
    extension: 'png',
    matches: (bytes: Uint8Array) =>
      Buffer.from(bytes.subarray(0, 8)).equals(
        Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      ),
  },
  'image/webp': {
    extension: 'webp',
    matches: (bytes: Uint8Array) =>
      Buffer.from(bytes.subarray(0, 4)).toString('ascii') === 'RIFF' &&
      Buffer.from(bytes.subarray(8, 12)).toString('ascii') === 'WEBP',
  },
} as const;

export type BikePhotoContentType = keyof typeof PHOTO_TYPES;

export interface DecodedBikePhoto {
  body: Uint8Array;
  contentType: BikePhotoContentType;
  extension: string;
}

export interface StoredBikePhoto {
  storageKey: string;
  url: string;
}

export interface BikePhotoStorage {
  upload(photo: DecodedBikePhoto, storageKey: string): Promise<StoredBikePhoto>;
  delete(storageKey: string): Promise<void>;
}

export interface R2BikePhotoStorageConfig {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucketName: string;
  publicBaseUrl: string;
}

export interface R2CommandClient {
  send(command: PutObjectCommand | DeleteObjectCommand): Promise<unknown>;
}

export function decodeBikePhotoDataUrl(source: string): DecodedBikePhoto {
  const match =
    /^data:(image\/(?:png|jpeg|webp|gif));base64,([A-Za-z0-9+/]+={0,2})$/u.exec(
      source,
    );
  if (match === null) throw new Error('Bike photo must be a base64 image.');

  const contentType = match[1] as BikePhotoContentType;
  const body = Buffer.from(match[2] ?? '', 'base64');
  if (body.length === 0 || body.length > BIKE_PHOTO_MAX_BYTES) {
    throw new Error('Bike photo size is invalid.');
  }
  const photoType = PHOTO_TYPES[contentType];
  if (!photoType.matches(body)) {
    throw new Error('Bike photo bytes do not match the declared image type.');
  }
  return { body, contentType, extension: photoType.extension };
}

export class R2BikePhotoStorage implements BikePhotoStorage {
  private readonly client: R2CommandClient;

  public constructor(
    private readonly config: R2BikePhotoStorageConfig,
    client?: R2CommandClient,
  ) {
    const s3Client =
      client ??
      new S3Client({
        region: 'auto',
        endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
        credentials: {
          accessKeyId: config.accessKeyId,
          secretAccessKey: config.secretAccessKey,
        },
      });
    this.client = s3Client;
  }

  public async upload(
    photo: DecodedBikePhoto,
    storageKey: string,
  ): Promise<StoredBikePhoto> {
    await this.client.send(
      new PutObjectCommand({
        Bucket: this.config.bucketName,
        Key: storageKey,
        Body: photo.body,
        ContentLength: photo.body.byteLength,
        ContentType: photo.contentType,
        CacheControl: 'public, max-age=31536000, immutable',
      }),
    );
    return {
      storageKey,
      url: `${this.config.publicBaseUrl}/${storageKey}?v=${randomUUID()}`,
    };
  }

  public async delete(storageKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.config.bucketName,
        Key: storageKey,
      }),
    );
  }
}

export function bikePhotoStorageKey(
  prefix: string,
  userId: string,
  bikeId: string,
): string {
  return `${prefix}/${userId}/${bikeId}`;
}
