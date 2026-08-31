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

export const componentDetailSchema = componentCategorySchema.extend({
  beginnerSummary: z.string().min(1),
  identificationSteps: z.array(z.string().min(1)).min(1).max(4),
  upgradeChecks: z.array(z.string().min(1)).min(1).max(5),
  unknownGuidance: z.string().min(1),
});

export type ComponentDetail = z.infer<typeof componentDetailSchema>;

export const anatomyHotspotSchema = z.object({
  component: componentCategorySchema,
  xPercent: z.number().min(0).max(100),
  yPercent: z.number().min(0).max(100),
  beginnerLabel: z.string().min(1),
  beginnerSummary: z.string().min(1),
});

export type AnatomyHotspot = z.infer<typeof anatomyHotspotSchema>;

export const bicycleAnatomySchema = z.object({
  bicycleType: bicycleTypeSchema,
  overview: z.string().min(1),
  hotspots: z.array(anatomyHotspotSchema).min(1),
});

export type BicycleAnatomy = z.infer<typeof bicycleAnatomySchema>;

export const bicycleAnatomyResponseSchema = z.object({
  anatomy: bicycleAnatomySchema.nullable(),
});

export type BicycleAnatomyResponse = z.infer<
  typeof bicycleAnatomyResponseSchema
>;

export const LEARN_SEARCH_MIN_QUERY_LENGTH = 2;
export const LEARN_SEARCH_MAX_QUERY_LENGTH = 60;
export const LEARN_SEARCH_MAX_RESULTS = 20;

export const glossaryTermSchema = z.object({
  slug: z.string().trim().min(1).max(80),
  term: z.string().trim().min(1).max(120),
  plainDefinition: z.string().trim().min(1).max(800),
  technicalDefinition: z.string().trim().min(1).max(1200),
  aliases: z.array(z.string().trim().min(1).max(120)).max(8),
  relatedComponentSlugs: z.array(z.string().trim().min(1).max(80)).max(8),
});

export type GlossaryTerm = z.infer<typeof glossaryTermSchema>;

export const createGlossaryTermSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(1)
    .max(80)
    .regex(
      /^[a-z0-9_-]+$/u,
      'Slug must contain only lowercase letters, numbers, hyphens, and underscores.',
    ),
  term: z.string().trim().min(1).max(120),
  plainDefinition: z.string().trim().min(1).max(800),
  technicalDefinition: z.string().trim().min(1).max(1200),
  aliases: z.array(z.string().trim().min(1).max(120)).max(8).default([]),
  relatedComponentSlugs: z
    .array(z.string().trim().min(1).max(80))
    .max(8)
    .default([]),
});

export type CreateGlossaryTermRequest = z.infer<
  typeof createGlossaryTermSchema
>;

export const updateGlossaryTermSchema = createGlossaryTermSchema
  .partial()
  .omit({ slug: true });

export type UpdateGlossaryTermRequest = z.infer<
  typeof updateGlossaryTermSchema
>;

export const glossaryListResponseSchema = z.object({
  terms: z.array(glossaryTermSchema).max(100),
});

export type GlossaryListResponse = z.infer<typeof glossaryListResponseSchema>;

export const learnSearchQuerySchema = z
  .object({
    q: z
      .string()
      .trim()
      .min(LEARN_SEARCH_MIN_QUERY_LENGTH)
      .max(LEARN_SEARCH_MAX_QUERY_LENGTH),
  })
  .strict();

export type LearnSearchQuery = z.infer<typeof learnSearchQuerySchema>;

export const LEARN_SEARCH_RESULT_KINDS = [
  'bicycle_type',
  'component',
  'glossary',
] as const;
export const learnSearchResultKindSchema = z.enum(LEARN_SEARCH_RESULT_KINDS);

export const learnSearchResultSchema = z.object({
  kind: learnSearchResultKindSchema,
  slug: z.string().trim().min(1).max(80),
  title: z.string().trim().min(1).max(160),
  summary: z.string().trim().min(1).max(1200),
});

export type LearnSearchResult = z.infer<typeof learnSearchResultSchema>;

export const learnSearchResponseSchema = z.object({
  query: z
    .string()
    .min(LEARN_SEARCH_MIN_QUERY_LENGTH)
    .max(LEARN_SEARCH_MAX_QUERY_LENGTH),
  results: z.array(learnSearchResultSchema).max(LEARN_SEARCH_MAX_RESULTS),
});

export type LearnSearchResponse = z.infer<typeof learnSearchResponseSchema>;
