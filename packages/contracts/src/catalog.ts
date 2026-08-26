import { z } from 'zod';

export const bicycleTypeSchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  summary: z.string(),
  typicalUse: z.string(),
  beginnerNotes: z.string(),
});

export type BicycleType = z.infer<typeof bicycleTypeSchema>;

export const bicycleTypeListResponseSchema = z.object({
  bicycleTypes: z.array(bicycleTypeSchema),
});

export type BicycleTypeListResponse = z.infer<
  typeof bicycleTypeListResponseSchema
>;

export const componentCategorySchema = z.object({
  id: z.uuid(),
  slug: z.string(),
  name: z.string(),
  description: z.string(),
});

export type ComponentCategory = z.infer<typeof componentCategorySchema>;

export const componentCategoryListResponseSchema = z.object({
  componentCategories: z.array(componentCategorySchema),
});

export type ComponentCategoryListResponse = z.infer<
  typeof componentCategoryListResponseSchema
>;
