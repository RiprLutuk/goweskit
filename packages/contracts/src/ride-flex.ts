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
    .enum(['balanced', 'athlete', 'humor', 'gravel', 'gearhead'])
    .optional()
    .default('balanced'),
  heartRateBpm: z.number().min(30).max(250).optional(),
  cadenceRpm: z.number().min(10).max(220).optional(),
  powerWatts: z.number().min(0).max(2500).optional(),
  photoBase64: z.string().optional(),
  photoMimeType: z.string().optional(),
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
    gravel: z.string().optional(),
  }),
  photoVisualInsight: z.string().optional(),
  recommendedTheme: z
    .enum(['alpine', 'gravel', 'sunset', 'crit', 'cafe', 'topo'])
    .optional(),
  trainingInsight: z.string().optional(),
  mechanicTip: z.string(),
  suggestedHashtags: z.array(z.string()),
  generatedAt: z.string(),
});

export type GenerateRideStoryResponse = z.infer<
  typeof GenerateRideStoryResponseSchema
>;
