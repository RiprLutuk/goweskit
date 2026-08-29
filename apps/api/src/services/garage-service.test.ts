import type {
  CreateBikeRequest,
  UpdateBikeRequest,
  User,
} from '@goweskit/contracts';
import { describe, expect, it } from 'vitest';

import type {
  GarageRepository,
  StoredBike,
  StoredBikeSpec,
  StoredSpecInput,
} from '../repositories/garage-repository.js';
import type {
  BikePhotoStorage,
  DecodedBikePhoto,
  StoredBikePhoto,
} from '../storage/bike-photo-storage.js';
import { GarageService } from './garage-service.js';

const BICYCLE_TYPE_ID = '019c9c80-2896-7593-bd02-509894b90001';
const BIKE_ID = '019c9c80-2896-7593-bd02-509894b90002';

const owner: User = {
  id: '019c9c80-2896-7593-bd02-509894b90003',
  displayName: 'Ayu',
  email: 'ayu@example.com',
  createdAt: '2026-08-27T00:00:00.000Z',
};

class MemoryGarageRepository implements GarageRepository {
  public bike: StoredBike | null = null;
  public capturedSpecs: StoredSpecInput[] = [];

  public bicycleTypeExists(id: string): Promise<boolean> {
    return Promise.resolve(id === BICYCLE_TYPE_ID);
  }

  public createBike(
    userId: string,
    input: CreateBikeRequest,
    specs: StoredSpecInput[],
    photoStorageKey: string | null,
  ): Promise<StoredBike> {
    this.capturedSpecs = specs;
    const now = new Date('2026-08-27T00:00:00.000Z');
    this.bike = {
      id: BIKE_ID,
      userId,
      nickname: input.nickname,
      bicycleType: {
        id: BICYCLE_TYPE_ID,
        slug: 'mtb_hardtail',
        name: 'MTB Hardtail',
      },
      brand: input.brand ?? null,
      model: input.model ?? null,
      modelYear: input.modelYear ?? null,
      photoUrl: input.photoUrl ?? null,
      photoStorageKey,
      avatarPreset: input.avatarPreset ?? null,
      notes: input.notes ?? null,
      specs: specs.map((spec) => ({ ...spec, updatedAt: now })),
      createdAt: now,
      updatedAt: now,
    };
    return Promise.resolve(this.bike);
  }

  public listBikes(userId: string): Promise<StoredBike[]> {
    return Promise.resolve(this.bike?.userId === userId ? [this.bike] : []);
  }

  public findBikeById(id: string): Promise<StoredBike | null> {
    return Promise.resolve(this.bike?.id === id ? this.bike : null);
  }

  public updateBike(
    id: string,
    input: UpdateBikeRequest & { photoStorageKey?: string | null },
  ): Promise<StoredBike | null> {
    if (this.bike?.id !== id) return Promise.resolve(null);
    if (input.photoUrl !== undefined) this.bike.photoUrl = input.photoUrl;
    if (input.photoStorageKey !== undefined)
      this.bike.photoStorageKey = input.photoStorageKey;
    if (input.avatarPreset !== undefined)
      this.bike.avatarPreset = input.avatarPreset;
    return Promise.resolve(this.bike);
  }

  public deleteBike(): Promise<void> {
    this.bike = null;
    return Promise.resolve();
  }

  public upsertSpec(
    bikeId: string,
    spec: StoredSpecInput,
  ): Promise<StoredBikeSpec> {
    if (this.bike?.id !== bikeId) throw new Error('Bike missing');
    const stored = { ...spec, updatedAt: new Date('2026-08-27T00:00:00.000Z') };
    this.bike.specs = [
      ...this.bike.specs.filter(
        (current) => current.standardCode !== spec.standardCode,
      ),
      stored,
    ];
    return Promise.resolve(stored);
  }
}

class MemoryBikePhotoStorage implements BikePhotoStorage {
  public uploads: { photo: DecodedBikePhoto; storageKey: string }[] = [];
  public deletes: string[] = [];

  public upload(
    photo: DecodedBikePhoto,
    storageKey: string,
  ): Promise<StoredBikePhoto> {
    this.uploads.push({ photo, storageKey });
    return Promise.resolve({
      storageKey,
      url: `https://pub.example.r2.dev/${storageKey}?v=test`,
    });
  }

  public delete(storageKey: string): Promise<void> {
    this.deletes.push(storageKey);
    return Promise.resolve();
  }
}

describe('GarageService', () => {
  it('stores known and explicitly unknown specs without guessing', async () => {
    const repository = new MemoryGarageRepository();
    const service = new GarageService(repository);

    const bike = await service.createBike(owner, {
      nickname: 'Trail Buddy',
      bicycleTypeId: BICYCLE_TYPE_ID,
      specs: [
        {
          standardCode: 'wheel_size',
          input: { knowledge: 'known', value: 'iso_622' },
        },
        {
          standardCode: 'rear_axle',
          input: { knowledge: 'unknown' },
        },
      ],
    });

    expect(repository.capturedSpecs).toEqual([
      {
        standardCode: 'wheel_size',
        valueJson: { value: 'iso_622' },
        confidence: 'user_entered',
        source: 'garage_onboarding',
      },
      {
        standardCode: 'rear_axle',
        valueJson: null,
        confidence: 'unknown',
        source: 'garage_onboarding',
      },
    ]);
    expect(bike.specs.map(({ knowledge }) => knowledge)).toEqual([
      'known',
      'unknown',
    ]);
  });

  it('rejects values outside the normalized vocabulary', async () => {
    const service = new GarageService(new MemoryGarageRepository());
    await expect(
      service.createBike(owner, {
        nickname: 'Mystery Bike',
        bicycleTypeId: BICYCLE_TYPE_ID,
        specs: [
          {
            standardCode: 'rear_axle',
            input: { knowledge: 'known', value: 'brand-says-boost' },
          },
        ],
      }),
    ).rejects.toMatchObject({ code: 'INVALID_STANDARD_VALUE' });
  });

  it('does not reveal another user’s bike', async () => {
    const repository = new MemoryGarageRepository();
    const service = new GarageService(repository);
    await service.createBike(owner, {
      nickname: 'Private Bike',
      bicycleTypeId: BICYCLE_TYPE_ID,
    });

    await expect(
      service.getBike(
        { ...owner, id: '019c9c80-2896-7593-bd02-509894b90004' },
        BIKE_ID,
      ),
    ).rejects.toMatchObject({ code: 'BIKE_NOT_FOUND' });
  });

  it('updates only an owned bike visual and supports clearing it', async () => {
    const repository = new MemoryGarageRepository();
    const service = new GarageService(repository);
    await service.createBike(owner, {
      nickname: 'Private Bike',
      bicycleTypeId: BICYCLE_TYPE_ID,
    });

    await expect(
      service.updateBikeVisual(
        { ...owner, id: '019c9c80-2896-7593-bd02-509894b90004' },
        BIKE_ID,
        { avatarPreset: 'hardtail_lime' },
      ),
    ).rejects.toMatchObject({ code: 'BIKE_NOT_FOUND', statusCode: 404 });

    expect(
      await service.updateBikeVisual(owner, BIKE_ID, {
        photoUrl: 'https://cdn.example.com/bike.webp',
        avatarPreset: 'hardtail_lime',
      }),
    ).toEqual({
      id: BIKE_ID,
      photoUrl: 'https://cdn.example.com/bike.webp',
      avatarPreset: 'hardtail_lime',
    });
    expect(
      await service.updateBikeVisual(owner, BIKE_ID, { photoUrl: null }),
    ).toMatchObject({ photoUrl: null, avatarPreset: 'hardtail_lime' });
  });

  it('uploads base64 image bytes to managed storage and deletes on clear', async () => {
    const repository = new MemoryGarageRepository();
    const storage = new MemoryBikePhotoStorage();
    const service = new GarageService(repository, storage, 'test/bikes');
    await service.createBike(owner, {
      nickname: 'R2 Bike',
      bicycleTypeId: BICYCLE_TYPE_ID,
    });

    const visual = await service.updateBikeVisual(owner, BIKE_ID, {
      photoUrl: 'data:image/png;base64,iVBORw0KGgo=',
    });

    expect(visual.photoUrl).toMatch(
      /^https:\/\/pub\.example\.r2\.dev\/test\/bikes\//u,
    );
    expect(repository.bike?.photoStorageKey).toMatch(
      /^test\/bikes\/019c9c80-2896-7593-bd02-509894b90003\//u,
    );
    expect(storage.uploads[0]?.photo).toMatchObject({
      contentType: 'image/png',
      extension: 'png',
    });

    await service.updateBikeVisual(owner, BIKE_ID, { photoUrl: null });
    expect(storage.deletes).toEqual([storage.uploads[0]?.storageKey]);
    expect(repository.bike).toMatchObject({
      photoUrl: null,
      photoStorageKey: null,
    });
  });
});
