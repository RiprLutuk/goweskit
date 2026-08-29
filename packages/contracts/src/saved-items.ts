import { z } from 'zod';

export const SAVED_ITEM_KINDS = ['place', 'route'] as const;
export const savedItemKindSchema = z.enum(SAVED_ITEM_KINDS);
export type SavedItemKind = z.infer<typeof savedItemKindSchema>;

export const saveItemRequestSchema = z
  .object({
    itemKind: savedItemKindSchema,
    itemId: z.uuid(),
  })
  .strict();
export type SaveItemRequest = z.infer<typeof saveItemRequestSchema>;

export const saveItemResponseSchema = z
  .object({
    saved: z.literal(true),
    savedAt: z.iso.datetime(),
  })
  .strict();
export type SaveItemResponse = z.infer<typeof saveItemResponseSchema>;
