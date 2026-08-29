import type {
  SaveItemRequest,
  SaveItemResponse,
  User,
} from '@goweskit/contracts';

import { AppError } from '../errors.js';
import type { SavedItemRepository } from '../repositories/saved-item-repository.js';

export class SavedItemService {
  public constructor(private readonly repository: SavedItemRepository) {}

  public async save(
    user: User,
    input: SaveItemRequest,
  ): Promise<SaveItemResponse> {
    if (!(await this.repository.itemExists(input.itemKind, input.itemId))) {
      throw new AppError(
        input.itemKind === 'place' ? 'PLACE_NOT_FOUND' : 'ROUTE_NOT_FOUND',
        input.itemKind === 'place' ? 'Place not found.' : 'Route not found.',
        404,
      );
    }
    const savedAt = await this.repository.save(
      user.id,
      input.itemKind,
      input.itemId,
    );
    return { saved: true, savedAt: savedAt.toISOString() };
  }
}
