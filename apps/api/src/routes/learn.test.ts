import {
  apiErrorResponseSchema,
  glossaryListResponseSchema,
  learnSearchResponseSchema,
  type BicycleType,
  type ComponentCategory,
} from '@goweskit/contracts';
import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';
import { afterEach, describe, expect, it } from 'vitest';

import { AppError } from '../errors.js';
import type { CatalogRepository } from '../repositories/catalog-repository.js';
import { CatalogService } from '../services/catalog-service.js';
import { registerLearnRoutes } from './learn.js';

const bicycleType: BicycleType = {
  id: '10000000-0000-4000-8000-000000000001',
  slug: 'mtb_hardtail',
  name: 'MTB Hardtail',
  summary: 'A trail bike with front suspension.',
  typicalUse: 'Trail riding and mixed surfaces.',
  beginnerNotes: 'Confirm Boost spacing before changing wheels.',
};

const component: ComponentCategory = {
  id: '20000000-0000-4000-8000-000000000001',
  slug: 'hub',
  name: 'Hub',
  description: 'The wheel centre that contains bearings and axle interfaces.',
};

class SearchCatalogRepository implements CatalogRepository {
  public listBicycleTypes(): Promise<BicycleType[]> {
    return Promise.resolve([bicycleType]);
  }

  public findBicycleTypeBySlug(slug: string): Promise<BicycleType | null> {
    return Promise.resolve(slug === bicycleType.slug ? bicycleType : null);
  }

  public listComponentCategories(): Promise<ComponentCategory[]> {
    return Promise.resolve([component]);
  }

  public findComponentCategoryBySlug(
    slug: string,
  ): Promise<ComponentCategory | null> {
    return Promise.resolve(slug === component.slug ? component : null);
  }
}

const openApps: FastifyInstance[] = [];

function buildLearnApp(): FastifyInstance {
  const app = Fastify({ logger: false });
  app.setErrorHandler((error, request, reply) => {
    const appError =
      error instanceof AppError
        ? error
        : new AppError('INTERNAL_ERROR', 'Something went wrong.', 500);
    return reply.status(appError.statusCode).send({
      error: {
        code: appError.code,
        message: appError.message,
        details: appError.details,
      },
      requestId: request.id,
    });
  });
  registerLearnRoutes(app, new CatalogService(new SearchCatalogRepository()));
  openApps.push(app);
  return app;
}

afterEach(async () => {
  await Promise.all(openApps.splice(0).map((app) => app.close()));
});

describe('Learn glossary and search routes', () => {
  it('returns curated glossary content', async () => {
    const response = await buildLearnApp().inject({
      method: 'GET',
      url: '/api/v1/learn/glossary',
    });
    const body = glossaryListResponseSchema.parse(response.json());

    expect(response.statusCode).toBe(200);
    expect(body.terms.find(({ slug }) => slug === 'boost')).toBeDefined();
  });

  it('returns a deterministic bounded search response', async () => {
    const app = buildLearnApp();
    const first = await app.inject({
      method: 'GET',
      url: '/api/v1/learn/search?q=boost',
    });
    const second = await app.inject({
      method: 'GET',
      url: '/api/v1/learn/search?q=boost',
    });
    expect(first.statusCode, first.body).toBe(200);
    const body = learnSearchResponseSchema.parse(first.json());
    expect(second.json()).toEqual(first.json());
    expect(body.results[0]).toMatchObject({
      kind: 'glossary',
      slug: 'boost',
    });
  });

  it('returns INVALID_REQUEST for short or unexpected query input', async () => {
    for (const url of [
      '/api/v1/learn/search?q=a',
      '/api/v1/learn/search?q=boost&unexpected=true',
    ]) {
      const response = await buildLearnApp().inject({ method: 'GET', url });
      const body = apiErrorResponseSchema.parse(response.json());

      expect(response.statusCode).toBe(400);
      expect(body.error.code).toBe('INVALID_REQUEST');
      expect(body.requestId).toEqual(expect.any(String));
    }
  });
});
