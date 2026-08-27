import 'dotenv/config';

import { hashPassword } from '../auth/password.js';
import { readConfig } from '../config.js';
import { createDatabase, type Database } from './client.js';
import {
  bicycleTypes,
  bikeSpecs,
  componentCategories,
  standardDefinitions,
  userBikes,
  users,
} from './schema.js';
import {
  BICYCLE_TYPE_SEEDS,
  COMPONENT_CATEGORY_SEEDS,
  DEMO_ACCOUNT,
  DEMO_BIKE_SEEDS,
  STANDARD_DEFINITION_SEEDS,
} from './seed-data.js';

interface SeedSummary {
  bicycleTypes: number;
  componentCategories: number;
  standardDefinitions: number;
  demoBikes: number;
  demoBikeSpecs: number;
}

export async function seedDatabase(database: Database): Promise<SeedSummary> {
  const demoPasswordHash = await hashPassword(DEMO_ACCOUNT.password);

  return database.transaction(async (transaction) => {
    const bicycleTypeIds = new Map<string, string>();

    for (const seed of BICYCLE_TYPE_SEEDS) {
      const [row] = await transaction
        .insert(bicycleTypes)
        .values(seed)
        .onConflictDoUpdate({
          target: bicycleTypes.slug,
          set: {
            name: seed.name,
            summary: seed.summary,
            typicalUse: seed.typicalUse,
            beginnerNotes: seed.beginnerNotes,
          },
        })
        .returning({ id: bicycleTypes.id, slug: bicycleTypes.slug });

      if (row === undefined) {
        throw new Error(`Bicycle type seed failed for ${seed.slug}.`);
      }
      bicycleTypeIds.set(row.slug, row.id);
    }

    for (const seed of COMPONENT_CATEGORY_SEEDS) {
      await transaction
        .insert(componentCategories)
        .values(seed)
        .onConflictDoUpdate({
          target: componentCategories.slug,
          set: { name: seed.name, description: seed.description },
        });
    }

    for (const seed of STANDARD_DEFINITION_SEEDS) {
      await transaction
        .insert(standardDefinitions)
        .values(seed)
        .onConflictDoUpdate({
          target: standardDefinitions.code,
          set: {
            category: seed.category,
            label: seed.label,
            description: seed.description,
            guidance: seed.guidance,
            sourceUrl: seed.sourceUrl,
            reviewStatus: seed.reviewStatus,
            version: seed.version,
          },
        });
    }

    const [demoUser] = await transaction
      .insert(users)
      .values({
        displayName: DEMO_ACCOUNT.displayName,
        email: DEMO_ACCOUNT.email,
        passwordHash: demoPasswordHash,
      })
      .onConflictDoUpdate({
        target: users.email,
        set: {
          displayName: DEMO_ACCOUNT.displayName,
          passwordHash: demoPasswordHash,
          updatedAt: new Date(),
        },
      })
      .returning({ id: users.id });

    if (demoUser === undefined) {
      throw new Error('Demo user seed failed.');
    }

    let specCount = 0;
    for (const bikeSeed of DEMO_BIKE_SEEDS) {
      const bicycleTypeId = bicycleTypeIds.get(bikeSeed.bicycleTypeSlug);
      if (bicycleTypeId === undefined) {
        throw new Error(
          `Missing bicycle type ${bikeSeed.bicycleTypeSlug} for demo bike.`,
        );
      }

      await transaction
        .insert(userBikes)
        .values({
          id: bikeSeed.id,
          userId: demoUser.id,
          nickname: bikeSeed.nickname,
          bicycleTypeId,
          brand: bikeSeed.brand,
          model: bikeSeed.model,
          modelYear: bikeSeed.modelYear,
          notes: bikeSeed.notes,
        })
        .onConflictDoUpdate({
          target: userBikes.id,
          set: {
            userId: demoUser.id,
            nickname: bikeSeed.nickname,
            bicycleTypeId,
            brand: bikeSeed.brand,
            model: bikeSeed.model,
            modelYear: bikeSeed.modelYear,
            notes: bikeSeed.notes,
            updatedAt: new Date(),
          },
        });

      for (const spec of bikeSeed.specs) {
        const isKnown = spec.knowledge === 'known';
        await transaction
          .insert(bikeSpecs)
          .values({
            userBikeId: bikeSeed.id,
            standardCode: spec.standardCode,
            valueJson: isKnown ? { value: spec.value } : null,
            confidence: isKnown ? 'confirmed' : 'unknown',
            source: 'demo_seed',
          })
          .onConflictDoUpdate({
            target: [bikeSpecs.userBikeId, bikeSpecs.standardCode],
            set: {
              valueJson: isKnown ? { value: spec.value } : null,
              confidence: isKnown ? 'confirmed' : 'unknown',
              source: 'demo_seed',
              updatedAt: new Date(),
            },
          });
        specCount += 1;
      }
    }

    return {
      bicycleTypes: BICYCLE_TYPE_SEEDS.length,
      componentCategories: COMPONENT_CATEGORY_SEEDS.length,
      standardDefinitions: STANDARD_DEFINITION_SEEDS.length,
      demoBikes: DEMO_BIKE_SEEDS.length,
      demoBikeSpecs: specCount,
    };
  });
}

if (process.env.NODE_ENV === 'production') {
  throw new Error('The demo data seeder is disabled in production.');
}

const config = readConfig();
const databaseClient = createDatabase(config.databaseUrl);

try {
  const summary = await seedDatabase(databaseClient.database);
  console.info('GowesKit demo data seeded.', {
    ...summary,
    demoEmail: DEMO_ACCOUNT.email,
    demoPassword: DEMO_ACCOUNT.password,
  });
} catch (error: unknown) {
  console.error('GowesKit demo data seed failed.', error);
  process.exitCode = 1;
} finally {
  await databaseClient.close();
}
