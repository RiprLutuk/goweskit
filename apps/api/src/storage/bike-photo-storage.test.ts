import { DeleteObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3';
import { describe, expect, it } from 'vitest';

import {
  bikePhotoStorageKey,
  decodeBikePhotoDataUrl,
  R2BikePhotoStorage,
  type R2CommandClient,
} from './bike-photo-storage.js';

class RecordingR2Client implements R2CommandClient {
  public commands: (PutObjectCommand | DeleteObjectCommand)[] = [];

  public send(
    command: PutObjectCommand | DeleteObjectCommand,
  ): Promise<unknown> {
    this.commands.push(command);
    return Promise.resolve({});
  }
}

const config = {
  accountId: 'account-id',
  accessKeyId: 'access-key',
  secretAccessKey: 'secret-key',
  bucketName: 'goweskit-media',
  publicBaseUrl: 'https://pub.example.r2.dev',
};

describe('R2BikePhotoStorage', () => {
  it('validates image magic bytes instead of trusting the data URL label', () => {
    const photo = decodeBikePhotoDataUrl('data:image/png;base64,iVBORw0KGgo=');
    expect(photo).toMatchObject({
      contentType: 'image/png',
      extension: 'png',
    });
    expect(() =>
      decodeBikePhotoDataUrl('data:image/png;base64,aGVsbG8='),
    ).toThrow('do not match');
  });

  it('uploads private bytes and returns a cache-busted public URL', async () => {
    const client = new RecordingR2Client();
    const storage = new R2BikePhotoStorage(config, client);
    const photo = decodeBikePhotoDataUrl('data:image/png;base64,iVBORw0KGgo=');
    const result = await storage.upload(photo, 'bikes/user/bike');

    expect(result).toMatchObject({ storageKey: 'bikes/user/bike' });
    expect(result.url).toMatch(
      /^https:\/\/pub\.example\.r2\.dev\/bikes\/user\/bike\?v=/u,
    );
    expect(client.commands[0]).toBeInstanceOf(PutObjectCommand);
    expect((client.commands[0] as PutObjectCommand).input).toMatchObject({
      Bucket: 'goweskit-media',
      Key: 'bikes/user/bike',
      ContentType: 'image/png',
    });
  });

  it('deletes the exact managed object key', async () => {
    const client = new RecordingR2Client();
    const storage = new R2BikePhotoStorage(config, client);
    await storage.delete('bikes/user/bike');

    expect(client.commands[0]).toBeInstanceOf(DeleteObjectCommand);
    expect((client.commands[0] as DeleteObjectCommand).input).toEqual({
      Bucket: 'goweskit-media',
      Key: 'bikes/user/bike',
    });
  });

  it('builds scoped keys from controlled segments', () => {
    expect(bikePhotoStorageKey('goweskit/bikes', 'user-id', 'bike-id')).toBe(
      'goweskit/bikes/user-id/bike-id',
    );
  });
});
