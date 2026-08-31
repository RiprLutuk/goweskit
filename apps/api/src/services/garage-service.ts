import { randomUUID } from 'node:crypto';

import {
  getBikeSpecDefinition,
  getStandardValueLabel,
  isAllowedStandardValue,
  type BikeSpecCode,
} from '@goweskit/bike-domain';
import type {
  Bike,
  BikeSpec,
  BikeSpecInput,
  BikeVisual,
  CreateBikeRequest,
  UpdateBikeRequest,
  UpdateBikePhotoRequest,
  User,
} from '@goweskit/contracts';

import { AppError } from '../errors.js';
import type {
  GarageRepository,
  StoredBike,
  StoredBikeSpec,
  StoredSpecInput,
} from '../repositories/garage-repository.js';
import {
  bikePhotoStorageKey,
  decodeBikePhotoDataUrl,
  type BikePhotoStorage,
  type StoredBikePhoto,
} from '../storage/bike-photo-storage.js';

function mapSpec(spec: StoredBikeSpec): BikeSpec {
  const definition = getBikeSpecDefinition(spec.standardCode);
  const value = spec.valueJson?.value ?? null;
  return {
    standardCode: spec.standardCode,
    label: definition?.label ?? spec.standardCode,
    knowledge: spec.confidence === 'unknown' ? 'unknown' : 'known',
    value,
    valueLabel:
      value === null ? null : getStandardValueLabel(spec.standardCode, value),
    confidence: spec.confidence,
    source: spec.source,
    updatedAt: spec.updatedAt.toISOString(),
  };
}

function mapBike(bike: StoredBike): Bike {
  return {
    id: bike.id,
    nickname: bike.nickname,
    bicycleType: bike.bicycleType,
    brand: bike.brand,
    model: bike.model,
    modelYear: bike.modelYear,
    photoUrl: bike.photoUrl,
    avatarPreset: bike.avatarPreset,
    notes: bike.notes,
    specs: bike.specs.map(mapSpec),
    createdAt: bike.createdAt.toISOString(),
    updatedAt: bike.updatedAt.toISOString(),
  };
}

function normalizeSpec(
  standardCode: BikeSpecCode,
  input: BikeSpecInput,
  source: StoredSpecInput['source'],
): StoredSpecInput {
  if (input.knowledge === 'unknown') {
    return { standardCode, valueJson: null, confidence: 'unknown', source };
  }

  if (!isAllowedStandardValue(standardCode, input.value)) {
    throw new AppError(
      'INVALID_STANDARD_VALUE',
      'This value is not valid for the specification.',
      400,
      {
        standardCode,
        value: input.value,
      },
    );
  }

  return {
    standardCode,
    valueJson: { value: input.value },
    confidence: 'user_entered',
    source,
  };
}

export class GarageService {
  public constructor(
    private readonly repository: GarageRepository,
    private readonly photoStorage?: BikePhotoStorage,
    private readonly photoKeyPrefix = 'goweskit/bike-photos',
  ) {}

  public async createBike(user: User, input: CreateBikeRequest): Promise<Bike> {
    await this.assertBicycleType(input.bicycleTypeId);
    const seen = new Set<BikeSpecCode>();
    const specs = (input.specs ?? []).map(
      ({ standardCode, input: specInput }) => {
        if (seen.has(standardCode)) {
          throw new AppError(
            'INVALID_REQUEST',
            'Each specification can only be submitted once.',
            400,
            {
              standardCode,
            },
          );
        }
        seen.add(standardCode);
        return normalizeSpec(standardCode, specInput, 'garage_onboarding');
      },
    );
    const storedPhoto = await this.uploadPhotoIfManaged(
      user.id,
      randomUUID(),
      input.photoUrl,
    );
    const createInput =
      storedPhoto === null ? input : { ...input, photoUrl: storedPhoto.url };
    try {
      return mapBike(
        await this.repository.createBike(
          user.id,
          createInput,
          specs,
          storedPhoto?.storageKey ?? null,
        ),
      );
    } catch (error: unknown) {
      if (storedPhoto !== null) {
        await this.photoStorage
          ?.delete(storedPhoto.storageKey)
          .catch(() => undefined);
      }
      throw error;
    }
  }

  public async listBikes(user: User): Promise<Bike[]> {
    return (await this.repository.listBikes(user.id)).map(mapBike);
  }

  public async getBike(user: User, bikeId: string): Promise<Bike> {
    return mapBike(await this.getOwnedBike(user, bikeId));
  }

  public async getPublicPassport(bikeId: string): Promise<{
    id: string;
    nickname: string;
    bicycleType: string;
    brand?: string | null;
    model?: string | null;
    modelYear?: number | null;
    photoUrl?: string | null;
    avatarPreset?: string | null;
    notes?: string | null;
    specs: BikeSpec[];
    registeredAt: string;
    ownershipStatus: 'verified_owner' | 'legitimate' | 'reported_stolen';
    passportUid: string;
  }> {
    const stored = await this.repository.findBikeById(bikeId);
    if (stored === null) throw this.notFound();

    const passportUid = `GWK-${stored.id.replace(/-/g, '').slice(0, 6).toUpperCase()}`;

    return {
      id: stored.id,
      nickname: stored.nickname,
      bicycleType: stored.bicycleType.name,
      brand: stored.brand,
      model: stored.model,
      modelYear: stored.modelYear,
      photoUrl: stored.photoUrl,
      avatarPreset: stored.avatarPreset,
      notes: stored.notes,
      specs: stored.specs.map(mapSpec),
      registeredAt: stored.createdAt.toISOString(),
      ownershipStatus: 'verified_owner',
      passportUid,
    };
  }

  public async updateBike(
    user: User,
    bikeId: string,
    input: UpdateBikeRequest,
  ): Promise<Bike> {
    const bike = await this.getOwnedBike(user, bikeId);
    if (input.bicycleTypeId !== undefined)
      await this.assertBicycleType(input.bicycleTypeId);
    return mapBike(await this.updateOwnedBike(user, bike, input));
  }

  public async updateBikeVisual(
    user: User,
    bikeId: string,
    input: UpdateBikePhotoRequest,
  ): Promise<BikeVisual> {
    const bike = await this.getOwnedBike(user, bikeId);
    const updated = await this.updateOwnedBike(user, bike, input);
    return {
      id: updated.id,
      photoUrl: updated.photoUrl,
      avatarPreset: updated.avatarPreset,
    };
  }

  public async deleteBike(user: User, bikeId: string): Promise<void> {
    const bike = await this.getOwnedBike(user, bikeId);
    if (bike.photoStorageKey !== null) {
      await this.deleteManagedPhoto(bike.photoStorageKey);
    }
    await this.repository.deleteBike(bikeId);
  }

  public async putSpec(
    user: User,
    bikeId: string,
    standardCode: BikeSpecCode,
    input: BikeSpecInput,
  ): Promise<BikeSpec> {
    await this.getOwnedBike(user, bikeId);
    return mapSpec(
      await this.repository.upsertSpec(
        bikeId,
        normalizeSpec(standardCode, input, 'garage_edit'),
      ),
    );
  }

  private async getOwnedBike(user: User, bikeId: string): Promise<StoredBike> {
    const bike = await this.repository.findBikeById(bikeId);
    if (bike?.userId !== user.id) throw this.notFound();
    return bike;
  }

  private async updateOwnedBike(
    user: User,
    bike: StoredBike,
    input: UpdateBikeRequest | UpdateBikePhotoRequest,
  ): Promise<StoredBike> {
    if (input.photoUrl === undefined || input.photoUrl === bike.photoUrl) {
      return this.requireUpdatedBike(
        await this.repository.updateBike(bike.id, input),
      );
    }

    const storedPhoto = await this.uploadPhotoIfManaged(
      user.id,
      bike.id,
      input.photoUrl,
      bike.photoStorageKey,
    );
    if (storedPhoto !== null) {
      try {
        return this.requireUpdatedBike(
          await this.repository.updateBike(bike.id, {
            ...input,
            photoUrl: storedPhoto.url,
            photoStorageKey: storedPhoto.storageKey,
          }),
        );
      } catch (error: unknown) {
        if (bike.photoStorageKey === null) {
          await this.photoStorage
            ?.delete(storedPhoto.storageKey)
            .catch(() => undefined);
        }
        throw error;
      }
    }

    const updated = this.requireUpdatedBike(
      await this.repository.updateBike(bike.id, input),
    );
    if (bike.photoStorageKey === null) return updated;

    await this.deleteManagedPhoto(bike.photoStorageKey);
    return this.requireUpdatedBike(
      await this.repository.updateBike(bike.id, { photoStorageKey: null }),
    );
  }

  private async uploadPhotoIfManaged(
    userId: string,
    bikeId: string,
    photoUrl: string | null | undefined,
    existingStorageKey?: string | null,
  ): Promise<StoredBikePhoto | null> {
    if (!photoUrl?.startsWith('data:')) {
      return null;
    }

    let photo;
    try {
      photo = decodeBikePhotoDataUrl(photoUrl);
    } catch {
      throw new AppError(
        'BIKE_PHOTO_UPLOAD_FAILED',
        'Bike photo data is invalid.',
        400,
      );
    }

    const storage = this.requirePhotoStorage();
    const storageKey =
      existingStorageKey ??
      bikePhotoStorageKey(this.photoKeyPrefix, userId, bikeId);
    try {
      return await storage.upload(photo, storageKey);
    } catch {
      throw new AppError(
        'BIKE_PHOTO_UPLOAD_FAILED',
        'Bike photo could not be uploaded.',
        502,
      );
    }
  }

  private async deleteManagedPhoto(storageKey: string): Promise<void> {
    try {
      await this.requirePhotoStorage().delete(storageKey);
    } catch (error: unknown) {
      if (error instanceof AppError) throw error;
      throw new AppError(
        'BIKE_PHOTO_DELETE_FAILED',
        'Bike photo could not be deleted.',
        502,
      );
    }
  }

  private requirePhotoStorage(): BikePhotoStorage {
    if (this.photoStorage === undefined) {
      throw new AppError(
        'BIKE_PHOTO_STORAGE_UNAVAILABLE',
        'Bike photo storage is unavailable.',
        503,
      );
    }
    return this.photoStorage;
  }

  private requireUpdatedBike(bike: StoredBike | null): StoredBike {
    if (bike === null) throw this.notFound();
    return bike;
  }

  private async assertBicycleType(id: string): Promise<void> {
    if (!(await this.repository.bicycleTypeExists(id))) {
      throw new AppError(
        'BICYCLE_TYPE_NOT_FOUND',
        'Bicycle type not found.',
        404,
      );
    }
  }

  private notFound(): AppError {
    return new AppError('BIKE_NOT_FOUND', 'Bike not found.', 404);
  }
}
