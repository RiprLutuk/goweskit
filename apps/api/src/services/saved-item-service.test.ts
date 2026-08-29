import type { User } from '@goweskit/contracts';
import { describe, expect, it } from 'vitest';

import type { SavedItemRepository } from '../repositories/saved-item-repository.js';
import { SavedItemService } from './saved-item-service.js';

const user: User = {
  id: '10000000-0000-4000-8000-000000000001',
  displayName: 'Demo Rider',
  email: 'demo@example.com',
  createdAt: '2026-08-01T00:00:00.000Z',
};
const itemId = '20000000-0000-4000-8000-000000000001';

class MemorySavedItemRepository implements SavedItemRepository {
  public exists = true;
  public writes = 0;
  private readonly savedAt = new Date('2026-08-28T21:40:00.000Z');

  public itemExists(): Promise<boolean> {
    return Promise.resolve(this.exists);
  }

  public save(): Promise<Date> {
    this.writes += 1;
    return Promise.resolve(this.savedAt);
  }
}

describe('SavedItemService', () => {
  it('returns a stable saved timestamp for an existing place', async () => {
    const repository = new MemorySavedItemRepository();
    const response = await new SavedItemService(repository).save(user, {
      itemKind: 'place',
      itemId,
    });

    expect(response).toEqual({
      saved: true,
      savedAt: '2026-08-28T21:40:00.000Z',
    });
    expect(repository.writes).toBe(1);
  });

  it('returns a kind-specific 404 before writing a missing item', async () => {
    const repository = new MemorySavedItemRepository();
    repository.exists = false;
    await expect(
      new SavedItemService(repository).save(user, {
        itemKind: 'route',
        itemId,
      }),
    ).rejects.toMatchObject({ code: 'ROUTE_NOT_FOUND', statusCode: 404 });
    expect(repository.writes).toBe(0);
  });
});
