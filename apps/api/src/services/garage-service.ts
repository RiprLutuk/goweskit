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
  CreateBikeRequest,
  UpdateBikeRequest,
  User,
} from '@goweskit/contracts';

import { AppError } from '../errors.js';
import type {
  GarageRepository,
  StoredBike,
  StoredBikeSpec,
  StoredSpecInput,
} from '../repositories/garage-repository.js';

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
  public constructor(private readonly repository: GarageRepository) {}

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
    return mapBike(await this.repository.createBike(user.id, input, specs));
  }

  public async listBikes(user: User): Promise<Bike[]> {
    return (await this.repository.listBikes(user.id)).map(mapBike);
  }

  public async getBike(user: User, bikeId: string): Promise<Bike> {
    return mapBike(await this.getOwnedBike(user, bikeId));
  }

  public async updateBike(
    user: User,
    bikeId: string,
    input: UpdateBikeRequest,
  ): Promise<Bike> {
    await this.getOwnedBike(user, bikeId);
    if (input.bicycleTypeId !== undefined)
      await this.assertBicycleType(input.bicycleTypeId);
    const updated = await this.repository.updateBike(bikeId, input);
    if (updated === null) throw this.notFound();
    return mapBike(updated);
  }

  public async deleteBike(user: User, bikeId: string): Promise<void> {
    await this.getOwnedBike(user, bikeId);
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
