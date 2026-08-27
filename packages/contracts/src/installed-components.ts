import { BIKE_SPEC_CODES } from '@goweskit/bike-domain';
import { z } from 'zod';

const componentStandardCodeSchema = z.enum(BIKE_SPEC_CODES);

export const installedComponentStandardInputSchema = z.discriminatedUnion(
  'knowledge',
  [
    z
      .object({
        standardCode: componentStandardCodeSchema,
        knowledge: z.literal('known'),
        value: z.string().min(1).max(100),
      })
      .strict(),
    z
      .object({
        standardCode: componentStandardCodeSchema,
        knowledge: z.literal('unknown'),
      })
      .strict(),
  ],
);
export type InstalledComponentStandardInput = z.infer<
  typeof installedComponentStandardInputSchema
>;

const componentStandardsInputSchema = z
  .array(installedComponentStandardInputSchema)
  .max(BIKE_SPEC_CODES.length)
  .superRefine((standards, context) => {
    const seen = new Set<string>();
    for (const standard of standards) {
      if (seen.has(standard.standardCode)) {
        context.addIssue({
          code: 'custom',
          message: 'Each installed-component standard can appear only once.',
        });
      }
      seen.add(standard.standardCode);
    }
  });

const optionalTrimmedText = (maximum: number) =>
  z.string().trim().min(1).max(maximum).nullable().optional();

const installedComponentMutationFields = {
  componentCategoryId: z.uuid(),
  customName: z.string().trim().min(1).max(120),
  brand: optionalTrimmedText(100),
  model: optionalTrimmedText(120),
  serialNumber: optionalTrimmedText(160),
  notes: optionalTrimmedText(2000),
  installedAt: z.iso.date().nullable().optional(),
  standards: componentStandardsInputSchema.optional(),
};

export const createInstalledComponentRequestSchema = z
  .object(installedComponentMutationFields)
  .strict();
export type CreateInstalledComponentRequest = z.infer<
  typeof createInstalledComponentRequestSchema
>;

export const updateInstalledComponentRequestSchema = z
  .object(installedComponentMutationFields)
  .partial()
  .strict()
  .refine(
    (input) => Object.keys(input).length > 0,
    'At least one installed-component field is required.',
  );
export type UpdateInstalledComponentRequest = z.infer<
  typeof updateInstalledComponentRequestSchema
>;

export const installedComponentStandardSchema = z.discriminatedUnion(
  'knowledge',
  [
    z
      .object({
        standardCode: componentStandardCodeSchema,
        knowledge: z.literal('known'),
        value: z.string(),
        valueLabel: z.string(),
      })
      .strict(),
    z
      .object({
        standardCode: componentStandardCodeSchema,
        knowledge: z.literal('unknown'),
        value: z.null(),
        valueLabel: z.null(),
      })
      .strict(),
  ],
);
export type InstalledComponentStandard = z.infer<
  typeof installedComponentStandardSchema
>;

export const installedComponentSchema = z
  .object({
    id: z.uuid(),
    bikeId: z.uuid(),
    componentCategoryId: z.uuid(),
    customName: z.string(),
    brand: z.string().nullable(),
    model: z.string().nullable(),
    serialNumber: z.string().nullable(),
    notes: z.string().nullable(),
    installedAt: z.iso.date().nullable(),
    standards: z.array(installedComponentStandardSchema),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  })
  .strict();
export type InstalledComponent = z.infer<typeof installedComponentSchema>;

export const installedComponentListResponseSchema = z
  .object({ components: z.array(installedComponentSchema) })
  .strict();
export type InstalledComponentListResponse = z.infer<
  typeof installedComponentListResponseSchema
>;

export const installedComponentResponseSchema = z
  .object({ component: installedComponentSchema })
  .strict();
export type InstalledComponentResponse = z.infer<
  typeof installedComponentResponseSchema
>;
