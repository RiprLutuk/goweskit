import type {
  Bike,
  CreateInstalledComponentRequest,
  InstalledComponentStandardInput,
  UpdateInstalledComponentRequest,
  User,
} from '@goweskit/contracts';
import { describe, expect, it } from 'vitest';

import type {
  InstalledComponentRepository,
  StoredInstalledComponent,
} from '../repositories/installed-component-repository.js';
import {
  InstalledComponentService,
  type InstalledComponentBikeOwnership,
} from './installed-component-service.js';

const user: User = {
  id: '10000000-0000-4000-8000-000000000010',
  displayName: 'Rider',
  email: 'rider@example.com',
  createdAt: '2026-08-01T00:00:00.000Z',
};
const bikeId = '10000000-0000-4000-8000-000000000001';
const categoryId = '10000000-0000-4000-8000-000000000020';
const installId = '10000000-0000-4000-8000-000000000030';

class MemoryRepository implements InstalledComponentRepository {
  public component: StoredInstalledComponent | null = null;
  public createCalls = 0;
  public categoryExists = true;

  public componentCategoryExists(): Promise<boolean> {
    return Promise.resolve(this.categoryExists);
  }

  public listForBike(
    requestedBikeId: string,
  ): Promise<StoredInstalledComponent[]> {
    return Promise.resolve(
      this.component?.userBikeId === requestedBikeId ? [this.component] : [],
    );
  }

  public findForBike(
    requestedBikeId: string,
    requestedInstallId: string,
  ): Promise<StoredInstalledComponent | null> {
    return Promise.resolve(
      this.component?.userBikeId === requestedBikeId &&
        this.component.id === requestedInstallId
        ? this.component
        : null,
    );
  }

  public create(
    requestedBikeId: string,
    input: CreateInstalledComponentRequest,
  ): Promise<StoredInstalledComponent> {
    this.createCalls += 1;
    const now = new Date('2026-08-27T00:00:00.000Z');
    this.component = {
      id: installId,
      userBikeId: requestedBikeId,
      componentCategoryId: input.componentCategoryId,
      customName: input.customName,
      brand: input.brand ?? null,
      model: input.model ?? null,
      serialNumber: input.serialNumber ?? null,
      notes: input.notes ?? null,
      installedAt: input.installedAt ?? null,
      standards: input.standards ?? [],
      createdAt: now,
      updatedAt: now,
    };
    return Promise.resolve(this.component);
  }

  public update(
    _requestedInstallId: string,
    input: UpdateInstalledComponentRequest,
  ): Promise<StoredInstalledComponent | null> {
    if (this.component === null) return Promise.resolve(null);
    this.component = {
      ...this.component,
      componentCategoryId:
        input.componentCategoryId ?? this.component.componentCategoryId,
      customName: input.customName ?? this.component.customName,
      brand: input.brand === undefined ? this.component.brand : input.brand,
      model: input.model === undefined ? this.component.model : input.model,
      serialNumber:
        input.serialNumber === undefined
          ? this.component.serialNumber
          : input.serialNumber,
      notes: input.notes === undefined ? this.component.notes : input.notes,
      installedAt:
        input.installedAt === undefined
          ? this.component.installedAt
          : input.installedAt,
      standards: input.standards ?? this.component.standards,
      updatedAt: new Date('2026-08-28T00:00:00.000Z'),
    };
    return Promise.resolve(this.component);
  }

  public delete(): Promise<void> {
    this.component = null;
    return Promise.resolve();
  }
}

const ownership: InstalledComponentBikeOwnership = {
  getBike: () => Promise.resolve({} as Bike),
};

function validInput(
  standards?: InstalledComponentStandardInput[],
): CreateInstalledComponentRequest {
  return {
    componentCategoryId: categoryId,
    customName: 'Rear wheel currently installed',
    brand: 'Nusantara Parts',
    model: 'Trail Boost',
    standards,
  };
}

describe('InstalledComponentService', () => {
  it('stores and explains known and explicitly unknown standards', async () => {
    const repository = new MemoryRepository();
    const service = new InstalledComponentService(repository, ownership);

    const component = await service.create(
      user,
      bikeId,
      validInput([
        {
          standardCode: 'rear_axle',
          knowledge: 'known',
          value: '12x148',
        },
        { standardCode: 'freehub', knowledge: 'unknown' },
      ]),
    );

    expect(component.standards).toEqual([
      {
        standardCode: 'rear_axle',
        knowledge: 'known',
        value: '12x148',
        valueLabel: '12 × 148 mm Boost thru-axle',
      },
      {
        standardCode: 'freehub',
        knowledge: 'unknown',
        value: null,
        valueLabel: null,
      },
    ]);
  });

  it('rejects invented standards before writing', async () => {
    const repository = new MemoryRepository();
    const service = new InstalledComponentService(repository, ownership);

    await expect(
      service.create(
        user,
        bikeId,
        validInput([
          {
            standardCode: 'rear_axle',
            knowledge: 'known',
            value: 'brand-says-boost',
          },
        ]),
      ),
    ).rejects.toMatchObject({ code: 'INVALID_STANDARD_VALUE' });
    expect(repository.createCalls).toBe(0);
  });

  it('rejects missing categories and components outside the bike scope', async () => {
    const repository = new MemoryRepository();
    repository.categoryExists = false;
    const service = new InstalledComponentService(repository, ownership);

    await expect(
      service.create(user, bikeId, validInput()),
    ).rejects.toMatchObject({ code: 'COMPONENT_CATEGORY_NOT_FOUND' });

    repository.categoryExists = true;
    await service.create(user, bikeId, validInput());
    await expect(
      service.update(user, '10000000-0000-4000-8000-000000000099', installId, {
        customName: 'Should stay private',
      }),
    ).rejects.toMatchObject({ code: 'INSTALLED_COMPONENT_NOT_FOUND' });
  });

  it('updates metadata and deletes an owned installed component', async () => {
    const repository = new MemoryRepository();
    const service = new InstalledComponentService(repository, ownership);
    await service.create(user, bikeId, validInput());

    const updated = await service.update(user, bikeId, installId, {
      customName: 'Rear wheel after service',
      notes: null,
    });
    expect(updated.customName).toBe('Rear wheel after service');
    expect(updated.notes).toBeNull();

    await service.delete(user, bikeId, installId);
    expect(await service.list(user, bikeId)).toEqual([]);
  });
});
