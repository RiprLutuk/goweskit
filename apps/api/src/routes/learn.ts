import { learnSearchQuerySchema } from '@goweskit/contracts';
import type {
  BicycleAnatomyResponse,
  BicycleType,
  BicycleTypeListResponse,
  ComponentCategoryListResponse,
  ComponentDetail,
  GlossaryListResponse,
  LearnSearchResponse,
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

  app.get<{ Reply: BicycleAnatomyResponse }>(
    '/api/v1/learn/bicycle-types/:slug/anatomy',
    async (request) => {
      const { slug } = parseInput(slugParamsSchema, request.params);
      return { anatomy: await catalogService.getBicycleTypeAnatomy(slug) };
    },
  );

  app.get<{ Reply: ComponentCategoryListResponse }>(
    '/api/v1/learn/components',
    async () => ({
      componentCategories: await catalogService.listComponentCategories(),
    }),
  );

  app.get<{ Reply: ComponentDetail }>(
    '/api/v1/learn/components/:slug',
    async (request) => {
      const { slug } = parseInput(slugParamsSchema, request.params);
      return catalogService.getComponentCategory(slug);
    },
  );

  app.get<{ Reply: GlossaryListResponse }>('/api/v1/learn/glossary', () => ({
    terms: catalogService.listGlossary(),
  }));

  app.get<{ Reply: LearnSearchResponse }>(
    '/api/v1/learn/search',
    async (request) => {
      const { q } = parseInput(learnSearchQuerySchema, request.query);
      return catalogService.search(q);
    },
  );
}
