import { describe, expect, it } from 'vitest';

import {
  bikeVisualResponseSchema,
  updateBikePhotoRequestSchema,
} from './garage.js';

describe('Garage visual contracts', () => {
  it('accepts bounded HTTPS or safe raster data image sources', () => {
    expect(
      updateBikePhotoRequestSchema.parse({
        photoUrl: 'https://cdn.example.com/bikes/trail-buddy.webp',
        avatarPreset: 'hardtail_lime',
      }).avatarPreset,
    ).toBe('hardtail_lime');
    expect(
      updateBikePhotoRequestSchema.safeParse({
        photoUrl: 'data:image/png;base64,iVBORw0KGgo=',
      }).success,
    ).toBe(true);
    expect(
      updateBikePhotoRequestSchema.safeParse({
        photoUrl: 'data:image/svg+xml;base64,PHN2Zz4=',
      }).success,
    ).toBe(false);
    expect(
      updateBikePhotoRequestSchema.safeParse({ photoUrl: 'http://example.com' })
        .success,
    ).toBe(false);
  });

  it('requires a visual patch and supports clearing stored values', () => {
    expect(updateBikePhotoRequestSchema.safeParse({}).success).toBe(false);
    expect(
      bikeVisualResponseSchema.parse({
        bike: {
          id: '10000000-0000-4000-8000-000000000001',
          photoUrl: null,
          avatarPreset: null,
        },
      }).bike.photoUrl,
    ).toBeNull();
  });
});
