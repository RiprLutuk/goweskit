import { BIKE_SPEC_CODES } from '@goweskit/bike-domain';
import { z } from 'zod';

export const bikeSpecCodeSchema = z.enum(BIKE_SPEC_CODES);

export const BIKE_PHOTO_DATA_URL_MAX_LENGTH = 900_000;

export const bikePhotoSourceSchema = z
  .string()
  .trim()
  .max(BIKE_PHOTO_DATA_URL_MAX_LENGTH)
  .refine(
    (value) =>
      /^https:\/\/[^\s]+$/u.test(value) ||
      /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/u.test(
        value,
      ),
    'Photo must be an HTTPS URL or a base64 PNG, JPEG, WebP, or GIF data URL.',
  );

export const bikeAvatarPresetSchema = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .regex(/^[a-z0-9]+(?:_[a-z0-9]+)*$/u, 'Invalid bike avatar preset key.');

export const bikeSpecInputSchema = z.discriminatedUnion('knowledge', [
  z.object({
    knowledge: z.literal('known'),
    value: z.string().min(1).max(100),
  }),
  z.object({
    knowledge: z.literal('unknown'),
  }),
]);

export type BikeSpecInput = z.infer<typeof bikeSpecInputSchema>;

export const bikeSpecMutationSchema = z.object({
  standardCode: bikeSpecCodeSchema,
  input: bikeSpecInputSchema,
});

export type BikeSpecMutation = z.infer<typeof bikeSpecMutationSchema>;

export const bikeSpecSchema = z.object({
  standardCode: bikeSpecCodeSchema,
  label: z.string(),
  knowledge: z.enum(['known', 'unknown']),
  value: z.string().nullable(),
  valueLabel: z.string().nullable(),
  confidence: z.enum(['confirmed', 'user_entered', 'inferred', 'unknown']),
  source: z.string(),
  updatedAt: z.iso.datetime(),
});

export type BikeSpec = z.infer<typeof bikeSpecSchema>;

const bikeDetailsInputSchema = z.object({
  nickname: z.string().trim().min(1).max(80),
  bicycleTypeId: z.uuid(),
  brand: z.string().trim().max(100).nullable().optional(),
  model: z.string().trim().max(100).nullable().optional(),
  modelYear: z.number().int().min(1900).max(2100).nullable().optional(),
  photoUrl: bikePhotoSourceSchema.nullable().optional(),
  avatarPreset: bikeAvatarPresetSchema.nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export const createBikeRequestSchema = bikeDetailsInputSchema.extend({
  specs: z.array(bikeSpecMutationSchema).max(BIKE_SPEC_CODES.length).optional(),
});

export type CreateBikeRequest = z.infer<typeof createBikeRequestSchema>;

export const updateBikeRequestSchema = bikeDetailsInputSchema
  .partial()
  .refine(
    (value) => Object.keys(value).length > 0,
    'At least one field is required.',
  );

export type UpdateBikeRequest = z.infer<typeof updateBikeRequestSchema>;

export const bikeSchema = z.object({
  id: z.uuid(),
  nickname: z.string(),
  bicycleType: z.object({
    id: z.uuid(),
    slug: z.string(),
    name: z.string(),
  }),
  brand: z.string().nullable(),
  model: z.string().nullable(),
  modelYear: z.number().int().nullable(),
  photoUrl: bikePhotoSourceSchema.nullable().default(null),
  avatarPreset: bikeAvatarPresetSchema.nullable().default(null),
  notes: z.string().nullable(),
  specs: z.array(bikeSpecSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});

export type Bike = z.infer<typeof bikeSchema>;

export const bikeResponseSchema = z.object({ bike: bikeSchema });
export type BikeResponse = z.infer<typeof bikeResponseSchema>;

export const bikeListResponseSchema = z.object({ bikes: z.array(bikeSchema) });
export type BikeListResponse = z.infer<typeof bikeListResponseSchema>;

export const bikeSpecListResponseSchema = z.object({
  specs: z.array(bikeSpecSchema),
});
export type BikeSpecListResponse = z.infer<typeof bikeSpecListResponseSchema>;

export const bikeSpecResponseSchema = z.object({ spec: bikeSpecSchema });
export type BikeSpecResponse = z.infer<typeof bikeSpecResponseSchema>;

export const updateBikePhotoRequestSchema = z
  .object({
    photoUrl: bikePhotoSourceSchema.nullable().optional(),
    avatarPreset: bikeAvatarPresetSchema.nullable().optional(),
  })
  .strict()
  .refine(
    (value) => value.photoUrl !== undefined || value.avatarPreset !== undefined,
    'At least one bike visual field is required.',
  );
export type UpdateBikePhotoRequest = z.infer<
  typeof updateBikePhotoRequestSchema
>;

export const bikeVisualSchema = z
  .object({
    id: z.uuid(),
    photoUrl: bikePhotoSourceSchema.nullable(),
    avatarPreset: bikeAvatarPresetSchema.nullable(),
  })
  .strict();
export type BikeVisual = z.infer<typeof bikeVisualSchema>;

export const bikeVisualResponseSchema = z.object({
  bike: bikeVisualSchema,
});

export type BikeVisualResponse = z.infer<typeof bikeVisualResponseSchema>;

export const publicBikePassportSchema = z.object({
  id: z.uuid(),
  nickname: z.string(),
  bicycleType: z.string(),
  brand: z.string().nullable().optional(),
  model: z.string().nullable().optional(),
  modelYear: z.number().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  avatarPreset: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  specs: z.array(bikeSpecSchema),
  registeredAt: z.string(),
  ownershipStatus: z.enum(['verified_owner', 'legitimate', 'reported_stolen']),
  passportUid: z.string(),
});

export type PublicBikePassport = z.infer<typeof publicBikePassportSchema>;

export const publicBikePassportResponseSchema = z.object({
  bike: publicBikePassportSchema,
});

export type PublicBikePassportResponse = z.infer<
  typeof publicBikePassportResponseSchema
>;
