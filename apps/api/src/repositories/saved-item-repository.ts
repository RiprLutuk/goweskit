import type { SavedItemKind } from '@goweskit/contracts';
import { and, eq } from 'drizzle-orm';

import type { Database } from '../db/client.js';
import { places, routes, userSavedItems } from '../db/schema.js';

export interface SavedItemRepository {
  itemExists(kind: SavedItemKind, itemId: string): Promise<boolean>;
  save(userId: string, kind: SavedItemKind, itemId: string): Promise<Date>;
}

export class DrizzleSavedItemRepository implements SavedItemRepository {
  public constructor(private readonly database: Database) {}

  public async itemExists(
    kind: SavedItemKind,
    itemId: string,
  ): Promise<boolean> {
    const table = kind === 'place' ? places : routes;
    const [item] = await this.database
      .select({ id: table.id })
      .from(table)
      .where(eq(table.id, itemId))
      .limit(1);
    return item !== undefined;
  }

  public async save(
    userId: string,
    itemKind: SavedItemKind,
    itemId: string,
  ): Promise<Date> {
    const [inserted] = await this.database
      .insert(userSavedItems)
      .values({
        userId,
        placeId: itemKind === 'place' ? itemId : null,
        routeId: itemKind === 'route' ? itemId : null,
      })
      .onConflictDoNothing()
      .returning({ savedAt: userSavedItems.savedAt });
    if (inserted !== undefined) return inserted.savedAt;

    const [existing] = await this.database
      .select({ savedAt: userSavedItems.savedAt })
      .from(userSavedItems)
      .where(
        and(
          eq(userSavedItems.userId, userId),
          itemKind === 'place'
            ? eq(userSavedItems.placeId, itemId)
            : eq(userSavedItems.routeId, itemId),
        ),
      )
      .limit(1);
    if (existing === undefined) {
      throw new Error('Saved item conflict row could not be read.');
    }
    return existing.savedAt;
  }
}
