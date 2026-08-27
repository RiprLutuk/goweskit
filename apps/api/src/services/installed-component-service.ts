import {
  getStandardValueLabel,
  isAllowedStandardValue,
} from '@goweskit/bike-domain';
import type {
  CreateInstalledComponentRequest,
  InstalledComponent,
  InstalledComponentStandardInput,
  UpdateInstalledComponentRequest,
  Bike,
  User,
} from '@goweskit/contracts';

import { AppError } from '../errors.js';
import type {
  InstalledComponentRepository,
  StoredInstalledComponent,
} from '../repositories/installed-component-repository.js';

export interface InstalledComponentBikeOwnership {
  getBike(user: User, bikeId: string): Promise<Bike>;
}

function validateStandards(
  standards: InstalledComponentStandardInput[] | undefined,
): void {
  for (const standard of standards ?? []) {
    if (
      standard.knowledge === 'known' &&
      !isAllowedStandardValue(standard.standardCode, standard.value)
    ) {
      throw new AppError(
        'INVALID_STANDARD_VALUE',
        'This value is not valid for the installed component standard.',
        400,
        {
          standardCode: standard.standardCode,
          value: standard.value,
        },
      );
    }
  }
}

function mapComponent(component: StoredInstalledComponent): InstalledComponent {
  return {
    id: component.id,
    bikeId: component.userBikeId,
    componentCategoryId: component.componentCategoryId,
    customName: component.customName,
    brand: component.brand,
    model: component.model,
    serialNumber: component.serialNumber,
    notes: component.notes,
    installedAt: component.installedAt,
    standards: component.standards.map((standard) =>
      standard.knowledge === 'unknown'
        ? {
            standardCode: standard.standardCode,
            knowledge: 'unknown' as const,
            value: null,
            valueLabel: null,
          }
        : {
            standardCode: standard.standardCode,
            knowledge: 'known' as const,
            value: standard.value,
            valueLabel: getStandardValueLabel(
              standard.standardCode,
              standard.value,
            ),
          },
    ),
    createdAt: component.createdAt.toISOString(),
    updatedAt: component.updatedAt.toISOString(),
  };
}

export class InstalledComponentService {
  public constructor(
    private readonly repository: InstalledComponentRepository,
    private readonly bikeOwnership: InstalledComponentBikeOwnership,
  ) {}

  public async list(user: User, bikeId: string): Promise<InstalledComponent[]> {
    await this.bikeOwnership.getBike(user, bikeId);
    return (await this.repository.listForBike(bikeId)).map(mapComponent);
  }

  public async create(
    user: User,
    bikeId: string,
    input: CreateInstalledComponentRequest,
  ): Promise<InstalledComponent> {
    await this.bikeOwnership.getBike(user, bikeId);
    await this.assertCategory(input.componentCategoryId);
    validateStandards(input.standards);
    return mapComponent(await this.repository.create(bikeId, input));
  }

  public async update(
    user: User,
    bikeId: string,
    installId: string,
    input: UpdateInstalledComponentRequest,
  ): Promise<InstalledComponent> {
    await this.bikeOwnership.getBike(user, bikeId);
    await this.getInstalledComponent(bikeId, installId);
    if (input.componentCategoryId !== undefined) {
      await this.assertCategory(input.componentCategoryId);
    }
    validateStandards(input.standards);
    const updated = await this.repository.update(installId, input);
    if (updated === null) throw this.notFound();
    return mapComponent(updated);
  }

  public async delete(
    user: User,
    bikeId: string,
    installId: string,
  ): Promise<void> {
    await this.bikeOwnership.getBike(user, bikeId);
    await this.getInstalledComponent(bikeId, installId);
    await this.repository.delete(installId);
  }

  private async assertCategory(id: string): Promise<void> {
    if (!(await this.repository.componentCategoryExists(id))) {
      throw new AppError(
        'COMPONENT_CATEGORY_NOT_FOUND',
        'Component category not found.',
        404,
      );
    }
  }

  private async getInstalledComponent(
    bikeId: string,
    installId: string,
  ): Promise<StoredInstalledComponent> {
    const component = await this.repository.findForBike(bikeId, installId);
    if (component === null) throw this.notFound();
    return component;
  }

  private notFound(): AppError {
    return new AppError(
      'INSTALLED_COMPONENT_NOT_FOUND',
      'Installed component not found.',
      404,
    );
  }
}
