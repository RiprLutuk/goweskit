import 'dotenv/config';

import { sql } from 'drizzle-orm';

import { hashPassword } from '../auth/password.js';
import { readConfig } from '../config.js';
import { createDatabase, type Database } from './client.js';
import {
  bicycleTypes,
  bikeComponentInstalls,
  bikeSpecs,
  componentCategories,
  maintenanceEvents,
  standardDefinitions,
  userBikes,
  users,
} from './schema.js';
import {
  BICYCLE_TYPE_SEEDS,
  COMPONENT_CATEGORY_SEEDS,
  DEMO_ACCOUNT,
  DEMO_BIKE_SEEDS,
  DEMO_INSTALLED_COMPONENT_SEEDS,
  DEMO_MAINTENANCE_EVENT_SEEDS,
  DEMO_PLACE_SEEDS,
  DEMO_ROUTE_SEEDS,
  STANDARD_DEFINITION_SEEDS,
} from './seed-data.js';

interface SeedSummary {
  bicycleTypes: number;
  componentCategories: number;
  standardDefinitions: number;
  demoBikes: number;
  demoBikeSpecs: number;
  demoInstalledComponents: number;
  demoMaintenanceEvents: number;
  demoPlaces: number;
  demoRoutes: number;
}

function textArraySql(values: readonly string[]) {
  return sql`ARRAY[${sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  )}]::text[]`;
}

export async function seedDatabase(database: Database): Promise<SeedSummary> {
  const demoPasswordHash = await hashPassword(DEMO_ACCOUNT.password);

  return database.transaction(async (transaction) => {
    const bicycleTypeIds = new Map<string, string>();
    const componentCategoryIds = new Map<string, string>();

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
      const [row] = await transaction
        .insert(componentCategories)
        .values(seed)
        .onConflictDoUpdate({
          target: componentCategories.slug,
          set: { name: seed.name, description: seed.description },
        })
        .returning({
          id: componentCategories.id,
          slug: componentCategories.slug,
        });
      if (row === undefined) {
        throw new Error(`Component category seed failed for ${seed.slug}.`);
      }
      componentCategoryIds.set(row.slug, row.id);
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

    for (const seed of DEMO_PLACE_SEEDS) {
      await transaction.execute(sql`
        INSERT INTO "places" (
          "id", "type", "name", "description", "location", "address",
          "bicycle_types", "beginner_friendly", "verification_status",
          "last_confirmed_at"
        ) VALUES (
          ${seed.id}, ${seed.type}, ${seed.name}, ${seed.description},
          ST_SetSRID(
            ST_MakePoint(
              ${seed.coordinate.longitude},
              ${seed.coordinate.latitude}
            ),
            4326
          )::geography,
          ${seed.address}, ${textArraySql(seed.bicycleTypes)},
          ${seed.beginnerFriendly}, ${seed.verificationStatus},
          ${new Date(seed.lastConfirmedAt)}
        )
        ON CONFLICT ("id") DO UPDATE SET
          "type" = EXCLUDED."type",
          "name" = EXCLUDED."name",
          "description" = EXCLUDED."description",
          "location" = EXCLUDED."location",
          "address" = EXCLUDED."address",
          "bicycle_types" = EXCLUDED."bicycle_types",
          "beginner_friendly" = EXCLUDED."beginner_friendly",
          "verification_status" = EXCLUDED."verification_status",
          "last_confirmed_at" = EXCLUDED."last_confirmed_at"
      `);
    }

    for (const seed of DEMO_ROUTE_SEEDS) {
      const lineString = `LINESTRING(${seed.coordinates
        .map(
          ([longitude, latitude]) => `${String(longitude)} ${String(latitude)}`,
        )
        .join(', ')})`;
      await transaction.execute(sql`
        INSERT INTO "routes" (
          "id", "route_type", "name", "description", "geometry",
          "distance_meters", "elevation_gain_meters", "difficulty", "surface",
          "bicycle_types", "beginner_friendly", "verification_status",
          "last_confirmed_at"
        ) VALUES (
          ${seed.id}, ${seed.routeType}, ${seed.name}, ${seed.description},
          ST_GeogFromText(${lineString}), ${seed.distanceMeters},
          ${seed.elevationGainMeters}, ${seed.difficulty}, ${seed.surface},
          ${textArraySql(seed.bicycleTypes)}, ${seed.beginnerFriendly},
          ${seed.verificationStatus}, ${new Date(seed.lastConfirmedAt)}
        )
        ON CONFLICT ("id") DO UPDATE SET
          "route_type" = EXCLUDED."route_type",
          "name" = EXCLUDED."name",
          "description" = EXCLUDED."description",
          "geometry" = EXCLUDED."geometry",
          "distance_meters" = EXCLUDED."distance_meters",
          "elevation_gain_meters" = EXCLUDED."elevation_gain_meters",
          "difficulty" = EXCLUDED."difficulty",
          "surface" = EXCLUDED."surface",
          "bicycle_types" = EXCLUDED."bicycle_types",
          "beginner_friendly" = EXCLUDED."beginner_friendly",
          "verification_status" = EXCLUDED."verification_status",
          "last_confirmed_at" = EXCLUDED."last_confirmed_at"
      `);
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

    for (const eventSeed of DEMO_MAINTENANCE_EVENT_SEEDS) {
      await transaction
        .insert(maintenanceEvents)
        .values({
          id: eventSeed.id,
          userId: demoUser.id,
          userBikeId: eventSeed.bikeId,
          type: eventSeed.type,
          performedAt: eventSeed.performedAt,
          notes: eventSeed.notes,
          nextDueDate: eventSeed.nextDueDate,
        })
        .onConflictDoUpdate({
          target: maintenanceEvents.id,
          set: {
            userId: demoUser.id,
            userBikeId: eventSeed.bikeId,
            type: eventSeed.type,
            performedAt: eventSeed.performedAt,
            notes: eventSeed.notes,
            nextDueDate: eventSeed.nextDueDate,
          },
        });
    }

    for (const componentSeed of DEMO_INSTALLED_COMPONENT_SEEDS) {
      const componentCategoryId = componentCategoryIds.get(
        componentSeed.categorySlug,
      );
      if (componentCategoryId === undefined) {
        throw new Error(
          `Missing component category ${componentSeed.categorySlug} for demo install.`,
        );
      }
      await transaction
        .insert(bikeComponentInstalls)
        .values({
          id: componentSeed.id,
          userBikeId: componentSeed.bikeId,
          componentCategoryId,
          customName: componentSeed.customName,
          brand: componentSeed.brand,
          model: componentSeed.model,
          serialNumber: componentSeed.serialNumber,
          notes: componentSeed.notes,
          installedAt: componentSeed.installedAt,
          standards: [...componentSeed.standards],
        })
        .onConflictDoUpdate({
          target: bikeComponentInstalls.id,
          set: {
            userBikeId: componentSeed.bikeId,
            componentCategoryId,
            customName: componentSeed.customName,
            brand: componentSeed.brand,
            model: componentSeed.model,
            serialNumber: componentSeed.serialNumber,
            notes: componentSeed.notes,
            installedAt: componentSeed.installedAt,
            standards: [...componentSeed.standards],
            updatedAt: new Date(),
          },
        });
    }

    return {
      bicycleTypes: BICYCLE_TYPE_SEEDS.length,
      componentCategories: COMPONENT_CATEGORY_SEEDS.length,
      standardDefinitions: STANDARD_DEFINITION_SEEDS.length,
      demoBikes: DEMO_BIKE_SEEDS.length,
      demoBikeSpecs: specCount,
      demoInstalledComponents: DEMO_INSTALLED_COMPONENT_SEEDS.length,
      demoMaintenanceEvents: DEMO_MAINTENANCE_EVENT_SEEDS.length,
      demoPlaces: DEMO_PLACE_SEEDS.length,
      demoRoutes: DEMO_ROUTE_SEEDS.length,
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
