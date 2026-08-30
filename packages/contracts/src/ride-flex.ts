import { z } from 'zod';

export const RideEffortRatingSchema = z.enum([
  'recovery',
  'easy',
  'moderate',
  'hard',
  'epic',
  'legendary',
]);
export type RideEffortRating = z.infer<typeof RideEffortRatingSchema>;

export const GenerateRideStoryRequestSchema = z.object({
  distanceKm: z.number().min(0).max(1000),
  elevationGainMeters: z.number().min(0).max(10000).default(0),
  durationMinutes: z.number().min(1).max(2880),
  bikeName: z.string().max(80).optional(),
  routeName: z.string().max(120).optional(),
  weatherTempC: z.number().min(-20).max(60).optional(),
  cyclistPersona: z
    .enum(['balanced', 'athlete', 'humor', 'gearhead'])
    .optional()
    .default('balanced'),
});

export type GenerateRideStoryRequest = z.infer<
  typeof GenerateRideStoryRequestSchema
>;

export const GenerateRideStoryResponseSchema = z.object({
  title: z.string(),
  highlight: z.string(),
  effortRating: RideEffortRatingSchema,
  estimatedCaloriesKcal: z.number(),
  foodEquivalency: z.string(),
  averageSpeedKmh: z.number(),
  climbGradeScore: z.string(),
  captions: z.object({
    athlete: z.string(),
    humor: z.string(),
    technical: z.string(),
  }),
  mechanicTip: z.string(),
  suggestedHashtags: z.array(z.string()),
  generatedAt: z.string(),
});

export type GenerateRideStoryResponse = z.infer<
  typeof GenerateRideStoryResponseSchema
>;
