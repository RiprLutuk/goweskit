import type { CreateBikeRequest, User } from '@goweskit/contracts';
import { describe, expect, it } from 'vitest';

import type {
  GarageRepository,
  StoredBike,
  StoredBikeSpec,
  StoredSpecInput,
} from '../repositories/garage-repository.js';
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

  public updateBike(): Promise<StoredBike | null> {
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
});
