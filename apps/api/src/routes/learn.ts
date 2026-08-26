import type {
  BicycleType,
  BicycleTypeListResponse,
  ComponentCategory,
  ComponentCategoryListResponse,
} from '@goweskit/contracts';
import type { FastifyInstance } from 'fastify';
import { z } from 'zod';

import { parseInput } from '../http/validation.js';
import type { CatalogService } from '../services/catalog-service.js';

const slugParamsSchema = z.object({ slug: z.string().min(1).max(80) });

export function registerLearnRoutes(
  app: FastifyInstance,
  catalogService: CatalogService,
): void {
  app.get<{ Reply: BicycleTypeListResponse }>(
    '/api/v1/learn/bicycle-types',
    async () => ({
      bicycleTypes: await catalogService.listBicycleTypes(),
    }),
  );

  app.get<{ Reply: BicycleType }>(
    '/api/v1/learn/bicycle-types/:slug',
    async (request) => {
      const { slug } = parseInput(slugParamsSchema, request.params);
      return catalogService.getBicycleType(slug);
    },
  );

  app.get<{ Reply: ComponentCategoryListResponse }>(
    '/api/v1/learn/components',
    async () => ({
      componentCategories: await catalogService.listComponentCategories(),
    }),
  );

  app.get<{ Reply: ComponentCategory }>(
    '/api/v1/learn/components/:slug',
    async (request) => {
      const { slug } = parseInput(slugParamsSchema, request.params);
      return catalogService.getComponentCategory(slug);
    },
  );
}
