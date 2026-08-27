import { BIKE_SPEC_CODES } from '@goweskit/bike-domain';
import { describe, expect, it } from 'vitest';

import {
  createInstalledComponentRequestSchema,
  installedComponentSchema,
  updateInstalledComponentRequestSchema,
} from './installed-components.js';

const validCreate = {
  componentCategoryId: '019c9c80-2896-7593-bd02-509894b90006',
  customName: 'Current rear wheel',
  brand: 'Example Components',
  model: 'Trail 29',
  serialNumber: 'SERIAL-ONLY-METADATA',
  notes: 'Original wheel supplied with the bike.',
  installedAt: '2026-08-20',
  standards: [
    {
      standardCode: 'rear_axle',
      knowledge: 'known',
      value: '12x148',
    },
    { standardCode: 'freehub', knowledge: 'unknown' },
  ],
} as const;

describe('installed-component contracts', () => {
  it('accepts a custom component with explicit known and unknown standards', () => {
    const parsed = createInstalledComponentRequestSchema.parse(validCreate);
    expect(parsed.customName).toBe('Current rear wheel');
    expect(parsed.standards).toEqual(validCreate.standards);
  });

  it('allows metadata to be omitted without inventing component standards', () => {
    const parsed = createInstalledComponentRequestSchema.parse({
      componentCategoryId: validCreate.componentCategoryId,
      customName: 'Mystery fork',
    });
    expect(parsed.brand).toBeUndefined();
    expect(parsed.model).toBeUndefined();
    expect(parsed.standards).toBeUndefined();
  });

  it('rejects duplicate and invented standard codes', () => {
    expect(
      createInstalledComponentRequestSchema.safeParse({
        ...validCreate,
        standards: [
          { standardCode: 'rear_axle', knowledge: 'unknown' },
          { standardCode: 'rear_axle', knowledge: 'unknown' },
        ],
      }).success,
    ).toBe(false);
    expect(
      createInstalledComponentRequestSchema.safeParse({
        ...validCreate,
        standards: [{ standardCode: 'brand_standard', knowledge: 'unknown' }],
      }).success,
    ).toBe(false);
  });

  it('keeps unknown standards value-free and all mutations strict', () => {
    expect(
      createInstalledComponentRequestSchema.safeParse({
        ...validCreate,
        standards: [
          {
            standardCode: 'rear_axle',
            knowledge: 'unknown',
            value: '12x148',
          },
        ],
      }).success,
    ).toBe(false);
    expect(
      createInstalledComponentRequestSchema.safeParse({
        ...validCreate,
        compatibilityStatus: 'compatible',
      }).success,
    ).toBe(false);
    expect(
      updateInstalledComponentRequestSchema.safeParse({
        brand: 'Metadata only',
        inferredStandard: 'never',
      }).success,
    ).toBe(false);
  });

  it('requires a category, custom name, valid optional values, and an update field', () => {
    for (const input of [
      { ...validCreate, componentCategoryId: 'not-a-uuid' },
      { ...validCreate, customName: '   ' },
      { ...validCreate, brand: '' },
      { ...validCreate, serialNumber: '' },
      { ...validCreate, installedAt: '27-08-2026' },
    ]) {
      expect(
        createInstalledComponentRequestSchema.safeParse(input).success,
      ).toBe(false);
    }
    expect(updateInstalledComponentRequestSchema.safeParse({}).success).toBe(
      false,
    );
    expect(
      updateInstalledComponentRequestSchema.safeParse({ notes: null }).success,
    ).toBe(true);
  });

  it('bounds the standards collection to the shared vocabulary size', () => {
    expect(
      createInstalledComponentRequestSchema.safeParse({
        ...validCreate,
        standards: [...validCreate.standards, ...validCreate.standards],
      }).success,
    ).toBe(false);
    expect(BIKE_SPEC_CODES.length).toBeGreaterThan(0);
  });

  it('enforces known/unknown invariants on stored responses', () => {
    const base = {
      id: '019c9c80-2896-7593-bd02-509894b90007',
      bikeId: '019c9c80-2896-7593-bd02-509894b90002',
      componentCategoryId: validCreate.componentCategoryId,
      customName: validCreate.customName,
      brand: validCreate.brand,
      model: validCreate.model,
      serialNumber: validCreate.serialNumber,
      notes: validCreate.notes,
      installedAt: validCreate.installedAt,
      createdAt: '2026-08-27T00:00:00.000Z',
      updatedAt: '2026-08-27T00:00:00.000Z',
    };
    expect(
      installedComponentSchema.safeParse({
        ...base,
        standards: [
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
        ],
      }).success,
    ).toBe(true);
    expect(
      installedComponentSchema.safeParse({
        ...base,
        standards: [
          {
            standardCode: 'freehub',
            knowledge: 'unknown',
            value: 'hg',
            valueLabel: 'Shimano HG',
          },
        ],
      }).success,
    ).toBe(false);
  });
});
