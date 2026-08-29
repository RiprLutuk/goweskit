import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const rootEnvPath = resolve(import.meta.dirname, '../../../../.env');
if (existsSync(rootEnvPath)) process.loadEnvFile(rootEnvPath);

import { sql } from 'drizzle-orm';

import { hashPassword } from '../auth/password.js';
import { readConfig } from '../config.js';
import { createDatabase, type Database } from './client.js';
import {
  bicycleTypes,
  bikeComponentInstalls,
  bikeSpecs,
  communityMemberships,
  communityModerationAudits,
  componentCategories,
  exploreModerationAudits,
  maintenanceEvents,
  placeReviews,
  rideEventParticipations,
  routeReports,
  safetyAudits,
  safetySessions,
  standardDefinitions,
  trustedContacts,
  userBikes,
  userSavedItems,
  users,
} from './schema.js';
import {
  BICYCLE_TYPE_SEEDS,
  COMPONENT_CATEGORY_SEEDS,
  DEMO_ACCOUNT,
  DEMO_BIKE_SEEDS,
  DEMO_COMMUNITY_MEMBERSHIP_SEEDS,
  DEMO_COMMUNITY_MODERATION_AUDIT_SEEDS,
  DEMO_COMMUNITY_SEEDS,
  DEMO_COMMUNITY_USERS,
  DEMO_EVENT_PARTICIPATION_SEEDS,
  DEMO_EXPLORE_MODERATION_AUDIT_SEEDS,
  DEMO_HAZARD_REPORT_SEEDS,
  DEMO_INSTALLED_COMPONENT_SEEDS,
  DEMO_MAINTENANCE_EVENT_SEEDS,
  DEMO_PLACE_REVIEW_SEEDS,
  DEMO_PLACE_SEEDS,
  DEMO_ROUTE_SEEDS,
  DEMO_SAVED_ITEM_SEEDS,
  DEMO_RIDE_EVENT_SEEDS,
  DEMO_ROUTE_REPORT_SEEDS,
  DEMO_SAFETY_AUDIT_SEEDS,
  DEMO_SAFETY_LOCATION_SEEDS,
  DEMO_SAFETY_SESSION_SEEDS,
  DEMO_TRUSTED_CONTACT_SEEDS,
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
  demoSavedItems: number;
  demoCommunities: number;
  demoCommunityMemberships: number;
  demoRideEvents: number;
  demoEventParticipations: number;
  demoModerationAudits: number;
  demoTrustedContacts: number;
  demoSafetySessions: number;
  demoSafetyLocations: number;
  demoSafetyAudits: number;
  demoPlaceReviews: number;
  demoRouteReports: number;
  demoHazardReports: number;
  demoExploreModerationAudits: number;
}

function textArraySql(values: readonly string[]) {
  return sql`ARRAY[${sql.join(
    values.map((value) => sql`${value}`),
    sql`, `,
  )}]::text[]`;
}

function minutesFrom(now: Date, offsetMinutes: number): Date {
  return new Date(now.getTime() + offsetMinutes * 60_000);
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
          "distance_meters", "elevation_gain_meters", "elevation_profile",
          "difficulty", "surface",
          "bicycle_types", "beginner_friendly", "verification_status",
          "last_confirmed_at"
        ) VALUES (
          ${seed.id}, ${seed.routeType}, ${seed.name}, ${seed.description},
          ST_GeogFromText(${lineString}), ${seed.distanceMeters},
          ${seed.elevationGainMeters},
          ${JSON.stringify(seed.elevationProfile)}::jsonb,
          ${seed.difficulty}, ${seed.surface},
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
          "elevation_profile" = EXCLUDED."elevation_profile",
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

    for (const contactSeed of DEMO_TRUSTED_CONTACT_SEEDS) {
      await transaction
        .insert(trustedContacts)
        .values({
          ...contactSeed,
          userId: demoUser.id,
        })
        .onConflictDoUpdate({
          target: trustedContacts.id,
          set: {
            userId: demoUser.id,
            name: contactSeed.name,
            phone: contactSeed.phone,
            email: contactSeed.email,
            note: contactSeed.note,
            updatedAt: new Date(),
          },
        });
    }

    const communityUserIds = new Map<string, string>([['demo', demoUser.id]]);
    for (const communityUser of DEMO_COMMUNITY_USERS) {
      const [storedUser] = await transaction
        .insert(users)
        .values({
          id: communityUser.id,
          displayName: communityUser.displayName,
          email: communityUser.email,
          passwordHash: demoPasswordHash,
        })
        .onConflictDoUpdate({
          target: users.email,
          set: {
            displayName: communityUser.displayName,
            passwordHash: demoPasswordHash,
            updatedAt: new Date(),
          },
        })
        .returning({ id: users.id });
      if (storedUser === undefined) {
        throw new Error(`Community demo user failed for ${communityUser.key}.`);
      }
      communityUserIds.set(communityUser.key, storedUser.id);
    }

    const demoModeratorId = communityUserIds.get('demo');
    if (demoModeratorId === undefined) {
      throw new Error('Missing demo Explore moderator.');
    }

    for (const reviewSeed of DEMO_PLACE_REVIEW_SEEDS) {
      const reporterUserId = communityUserIds.get(reviewSeed.reporterKey);
      if (reporterUserId === undefined)
        throw new Error('Missing place review reporter.');
      const moderated = reviewSeed.moderationStatus !== 'pending';
      await transaction
        .insert(placeReviews)
        .values({
          id: reviewSeed.id,
          reporterUserId,
          placeId: reviewSeed.placeId,
          rating: reviewSeed.rating,
          notes: reviewSeed.notes,
          moderationStatus: reviewSeed.moderationStatus,
          moderatedBy: moderated ? demoModeratorId : null,
          moderatedAt: moderated ? new Date(reviewSeed.createdAt) : null,
          createdAt: new Date(reviewSeed.createdAt),
        })
        .onConflictDoUpdate({
          target: placeReviews.id,
          set: {
            reporterUserId,
            placeId: reviewSeed.placeId,
            rating: reviewSeed.rating,
            notes: reviewSeed.notes,
            moderationStatus: reviewSeed.moderationStatus,
            moderatedBy: moderated ? demoModeratorId : null,
            moderatedAt: moderated ? new Date(reviewSeed.createdAt) : null,
            createdAt: new Date(reviewSeed.createdAt),
          },
        });
    }

    for (const reportSeed of DEMO_ROUTE_REPORT_SEEDS) {
      const reporterUserId = communityUserIds.get(reportSeed.reporterKey);
      if (reporterUserId === undefined)
        throw new Error('Missing route report reporter.');
      const moderated = reportSeed.moderationStatus !== 'pending';
      await transaction
        .insert(routeReports)
        .values({
          id: reportSeed.id,
          reporterUserId,
          routeId: reportSeed.routeId,
          reportType: reportSeed.reportType,
          notes: reportSeed.notes,
          observedAt:
            reportSeed.observedAt === null
              ? null
              : new Date(reportSeed.observedAt),
          moderationStatus: reportSeed.moderationStatus,
          moderatedBy: moderated ? demoModeratorId : null,
          moderatedAt: moderated ? new Date(reportSeed.createdAt) : null,
          createdAt: new Date(reportSeed.createdAt),
        })
        .onConflictDoUpdate({
          target: routeReports.id,
          set: {
            reporterUserId,
            routeId: reportSeed.routeId,
            reportType: reportSeed.reportType,
            notes: reportSeed.notes,
            observedAt:
              reportSeed.observedAt === null
                ? null
                : new Date(reportSeed.observedAt),
            moderationStatus: reportSeed.moderationStatus,
            moderatedBy: moderated ? demoModeratorId : null,
            moderatedAt: moderated ? new Date(reportSeed.createdAt) : null,
            createdAt: new Date(reportSeed.createdAt),
          },
        });
    }

    for (const hazardSeed of DEMO_HAZARD_REPORT_SEEDS) {
      const reporterUserId = communityUserIds.get(hazardSeed.reporterKey);
      if (reporterUserId === undefined)
        throw new Error('Missing hazard report reporter.');
      const moderated = hazardSeed.moderationStatus !== 'pending';
      await transaction.execute(sql`
        INSERT INTO hazard_reports (
          id, reporter_user_id, route_id, hazard_type, severity, location,
          notes, observed_at, moderation_status, moderated_by, moderated_at,
          created_at
        ) VALUES (
          ${hazardSeed.id}, ${reporterUserId}, ${hazardSeed.routeId},
          ${hazardSeed.hazardType}, ${hazardSeed.severity},
          ST_SetSRID(ST_MakePoint(
            ${hazardSeed.coordinate.longitude},
            ${hazardSeed.coordinate.latitude}
          ), 4326)::geography,
          ${hazardSeed.notes},
          ${hazardSeed.observedAt === null ? null : new Date(hazardSeed.observedAt)},
          ${hazardSeed.moderationStatus},
          ${moderated ? demoModeratorId : null},
          ${moderated ? new Date(hazardSeed.createdAt) : null},
          ${new Date(hazardSeed.createdAt)}
        )
        ON CONFLICT (id) DO UPDATE SET
          reporter_user_id = EXCLUDED.reporter_user_id,
          route_id = EXCLUDED.route_id,
          hazard_type = EXCLUDED.hazard_type,
          severity = EXCLUDED.severity,
          location = EXCLUDED.location,
          notes = EXCLUDED.notes,
          observed_at = EXCLUDED.observed_at,
          moderation_status = EXCLUDED.moderation_status,
          moderated_by = EXCLUDED.moderated_by,
          moderated_at = EXCLUDED.moderated_at,
          created_at = EXCLUDED.created_at
      `);
    }

    for (const auditSeed of DEMO_EXPLORE_MODERATION_AUDIT_SEEDS) {
      const moderatorUserId = communityUserIds.get(auditSeed.moderatorKey);
      if (moderatorUserId === undefined)
        throw new Error('Missing Explore audit moderator.');
      await transaction
        .insert(exploreModerationAudits)
        .values({
          id: auditSeed.id,
          contributionKind: auditSeed.contributionKind,
          contributionId: auditSeed.contributionId,
          moderatorUserId,
          previousStatus: 'pending',
          targetStatus: auditSeed.targetStatus,
          reason: auditSeed.reason,
          occurredAt: new Date(auditSeed.occurredAt),
        })
        .onConflictDoUpdate({
          target: exploreModerationAudits.id,
          set: {
            contributionKind: auditSeed.contributionKind,
            contributionId: auditSeed.contributionId,
            moderatorUserId,
            previousStatus: 'pending',
            targetStatus: auditSeed.targetStatus,
            reason: auditSeed.reason,
            occurredAt: new Date(auditSeed.occurredAt),
          },
        });
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
          photoUrl: bikeSeed.photoUrl,
          avatarPreset: bikeSeed.avatarPreset,
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
            photoUrl: bikeSeed.photoUrl,
            avatarPreset: bikeSeed.avatarPreset,
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

    for (const savedItemSeed of DEMO_SAVED_ITEM_SEEDS) {
      await transaction
        .insert(userSavedItems)
        .values({
          id: savedItemSeed.id,
          userId: demoUser.id,
          placeId:
            savedItemSeed.itemKind === 'place' ? savedItemSeed.itemId : null,
          routeId:
            savedItemSeed.itemKind === 'route' ? savedItemSeed.itemId : null,
          savedAt: new Date(savedItemSeed.savedAt),
        })
        .onConflictDoUpdate({
          target: userSavedItems.id,
          set: {
            userId: demoUser.id,
            placeId:
              savedItemSeed.itemKind === 'place' ? savedItemSeed.itemId : null,
            routeId:
              savedItemSeed.itemKind === 'route' ? savedItemSeed.itemId : null,
            savedAt: new Date(savedItemSeed.savedAt),
          },
        });
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

    for (const communitySeed of DEMO_COMMUNITY_SEEDS) {
      const createdBy = communityUserIds.get(communitySeed.createdByKey);
      if (createdBy === undefined)
        throw new Error('Missing community creator.');
      await transaction.execute(sql`
        INSERT INTO communities (
          id, slug, name, description, locality, home_location,
          bicycle_types, visibility, join_mode, verification_status, created_by
        ) VALUES (
          ${communitySeed.id}, ${communitySeed.slug}, ${communitySeed.name},
          ${communitySeed.description}, ${communitySeed.locality},
          ST_SetSRID(ST_MakePoint(
            ${communitySeed.coordinate.longitude},
            ${communitySeed.coordinate.latitude}
          ), 4326)::geography,
          ${textArraySql(communitySeed.bicycleTypes)},
          ${communitySeed.visibility}, ${communitySeed.joinMode},
          ${communitySeed.verificationStatus}, ${createdBy}
        )
        ON CONFLICT (id) DO UPDATE SET
          slug = EXCLUDED.slug, name = EXCLUDED.name,
          description = EXCLUDED.description, locality = EXCLUDED.locality,
          home_location = EXCLUDED.home_location,
          bicycle_types = EXCLUDED.bicycle_types,
          visibility = EXCLUDED.visibility, join_mode = EXCLUDED.join_mode,
          verification_status = EXCLUDED.verification_status,
          created_by = EXCLUDED.created_by, updated_at = NOW()
      `);
    }

    for (const membershipSeed of DEMO_COMMUNITY_MEMBERSHIP_SEEDS) {
      const userId = communityUserIds.get(membershipSeed.userKey);
      if (userId === undefined)
        throw new Error('Missing membership demo user.');
      await transaction
        .insert(communityMemberships)
        .values({
          id: membershipSeed.id,
          communityId: membershipSeed.communityId,
          userId,
          role: membershipSeed.role,
          status: membershipSeed.status,
        })
        .onConflictDoUpdate({
          target: communityMemberships.id,
          set: {
            communityId: membershipSeed.communityId,
            userId,
            role: membershipSeed.role,
            status: membershipSeed.status,
            updatedAt: new Date(),
          },
        });
    }

    for (const eventSeed of DEMO_RIDE_EVENT_SEEDS) {
      const createdBy = communityUserIds.get(eventSeed.createdByKey);
      if (createdBy === undefined) throw new Error('Missing event creator.');
      await transaction.execute(sql`
        INSERT INTO ride_events (
          id, community_id, title, description, starts_at,
          meeting_location, meeting_area,
          route_id, difficulty, bicycle_types, capacity, requirements,
          visibility, status, created_by
        ) VALUES (
          ${eventSeed.id}, ${eventSeed.communityId}, ${eventSeed.title},
          ${eventSeed.description}, ${new Date(eventSeed.startsAt)},
          ST_SetSRID(ST_MakePoint(
            ${eventSeed.coordinate.longitude},
            ${eventSeed.coordinate.latitude}
          ), 4326)::geography,
          ${eventSeed.meetingArea}, ${eventSeed.routeId},
          ${eventSeed.difficulty}, ${textArraySql(eventSeed.bicycleTypes)},
          ${eventSeed.capacity}, ${eventSeed.requirements},
          ${eventSeed.visibility}, ${eventSeed.status}, ${createdBy}
        )
        ON CONFLICT (id) DO UPDATE SET
          community_id = EXCLUDED.community_id, title = EXCLUDED.title,
          description = EXCLUDED.description,
          starts_at = EXCLUDED.starts_at,
          meeting_location = EXCLUDED.meeting_location,
          meeting_area = EXCLUDED.meeting_area, route_id = EXCLUDED.route_id,
          difficulty = EXCLUDED.difficulty,
          bicycle_types = EXCLUDED.bicycle_types, capacity = EXCLUDED.capacity,
          requirements = EXCLUDED.requirements, visibility = EXCLUDED.visibility,
          status = EXCLUDED.status, created_by = EXCLUDED.created_by,
          updated_at = NOW()
      `);
    }

    for (const participationSeed of DEMO_EVENT_PARTICIPATION_SEEDS) {
      const userId = communityUserIds.get(participationSeed.userKey);
      if (userId === undefined) throw new Error('Missing participation user.');
      await transaction
        .insert(rideEventParticipations)
        .values({
          id: participationSeed.id,
          eventId: participationSeed.eventId,
          userId,
          status: participationSeed.status,
        })
        .onConflictDoUpdate({
          target: rideEventParticipations.id,
          set: {
            eventId: participationSeed.eventId,
            userId,
            status: participationSeed.status,
            updatedAt: new Date(),
          },
        });
    }

    for (const auditSeed of DEMO_COMMUNITY_MODERATION_AUDIT_SEEDS) {
      const reviewerId = communityUserIds.get(auditSeed.reviewerKey);
      if (reviewerId === undefined) throw new Error('Missing audit reviewer.');
      await transaction
        .insert(communityModerationAudits)
        .values({
          id: auditSeed.id,
          communityId: auditSeed.communityId,
          membershipId: auditSeed.membershipId,
          reviewerId,
          decision: auditSeed.decision,
          note: auditSeed.note,
        })
        .onConflictDoUpdate({
          target: communityModerationAudits.id,
          set: {
            communityId: auditSeed.communityId,
            membershipId: auditSeed.membershipId,
            reviewerId,
            decision: auditSeed.decision,
            note: auditSeed.note,
          },
        });
    }

    const safetySeedNow = new Date();
    for (const sessionSeed of DEMO_SAFETY_SESSION_SEEDS) {
      const startedAt = minutesFrom(
        safetySeedNow,
        sessionSeed.startedOffsetMinutes,
      );
      const expectedEndAt =
        sessionSeed.expectedEndOffsetMinutes === null
          ? null
          : minutesFrom(safetySeedNow, sessionSeed.expectedEndOffsetMinutes);
      const endedAt =
        sessionSeed.endedOffsetMinutes === null
          ? null
          : minutesFrom(safetySeedNow, sessionSeed.endedOffsetMinutes);
      const shareExpiresAt = minutesFrom(
        safetySeedNow,
        sessionSeed.shareExpiresOffsetMinutes,
      );
      const sosTriggeredAt =
        sessionSeed.sosOffsetMinutes === null
          ? null
          : minutesFrom(safetySeedNow, sessionSeed.sosOffsetMinutes);
      await transaction
        .insert(safetySessions)
        .values({
          id: sessionSeed.id,
          userId: demoUser.id,
          riderDisplayName: DEMO_ACCOUNT.displayName,
          trustedContactId: sessionSeed.trustedContactId,
          status: sessionSeed.status,
          startedAt,
          expectedEndAt,
          endedAt,
          shareTokenHash: sessionSeed.shareTokenHash,
          shareExpiresAt,
          sosTriggeredAt,
          note: sessionSeed.note,
        })
        .onConflictDoUpdate({
          target: safetySessions.id,
          set: {
            userId: demoUser.id,
            riderDisplayName: DEMO_ACCOUNT.displayName,
            trustedContactId: sessionSeed.trustedContactId,
            status: sessionSeed.status,
            startedAt,
            expectedEndAt,
            endedAt,
            shareTokenHash: sessionSeed.shareTokenHash,
            shareExpiresAt,
            sosTriggeredAt,
            note: sessionSeed.note,
          },
        });
    }

    for (const locationSeed of DEMO_SAFETY_LOCATION_SEEDS) {
      const recordedAt = minutesFrom(
        safetySeedNow,
        locationSeed.recordedOffsetMinutes,
      );
      await transaction.execute(sql`
        INSERT INTO safety_locations (
          id, session_id, location, accuracy_meters, battery_percent, recorded_at
        ) VALUES (
          ${locationSeed.id}, ${locationSeed.sessionId},
          ST_SetSRID(ST_MakePoint(
            ${locationSeed.coordinate.longitude},
            ${locationSeed.coordinate.latitude}
          ), 4326)::geography,
          ${locationSeed.accuracyMeters}, ${locationSeed.batteryPercent},
          ${recordedAt}
        )
        ON CONFLICT (id) DO UPDATE SET
          session_id = EXCLUDED.session_id,
          location = EXCLUDED.location,
          accuracy_meters = EXCLUDED.accuracy_meters,
          battery_percent = EXCLUDED.battery_percent,
          recorded_at = EXCLUDED.recorded_at
      `);
    }

    for (const auditSeed of DEMO_SAFETY_AUDIT_SEEDS) {
      await transaction
        .insert(safetyAudits)
        .values({
          id: auditSeed.id,
          action: auditSeed.action,
          sessionId: auditSeed.sessionId,
          actorUserId: demoUser.id,
          occurredAt: minutesFrom(
            safetySeedNow,
            auditSeed.occurredOffsetMinutes,
          ),
          metadata: auditSeed.metadata,
        })
        .onConflictDoUpdate({
          target: safetyAudits.id,
          set: {
            action: auditSeed.action,
            sessionId: auditSeed.sessionId,
            actorUserId: demoUser.id,
            occurredAt: minutesFrom(
              safetySeedNow,
              auditSeed.occurredOffsetMinutes,
            ),
            metadata: auditSeed.metadata,
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
      demoSavedItems: DEMO_SAVED_ITEM_SEEDS.length,
      demoCommunities: DEMO_COMMUNITY_SEEDS.length,
      demoCommunityMemberships: DEMO_COMMUNITY_MEMBERSHIP_SEEDS.length,
      demoRideEvents: DEMO_RIDE_EVENT_SEEDS.length,
      demoEventParticipations: DEMO_EVENT_PARTICIPATION_SEEDS.length,
      demoModerationAudits: DEMO_COMMUNITY_MODERATION_AUDIT_SEEDS.length,
      demoTrustedContacts: DEMO_TRUSTED_CONTACT_SEEDS.length,
      demoSafetySessions: DEMO_SAFETY_SESSION_SEEDS.length,
      demoSafetyLocations: DEMO_SAFETY_LOCATION_SEEDS.length,
      demoSafetyAudits: DEMO_SAFETY_AUDIT_SEEDS.length,
      demoPlaceReviews: DEMO_PLACE_REVIEW_SEEDS.length,
      demoRouteReports: DEMO_ROUTE_REPORT_SEEDS.length,
      demoHazardReports: DEMO_HAZARD_REPORT_SEEDS.length,
      demoExploreModerationAudits: DEMO_EXPLORE_MODERATION_AUDIT_SEEDS.length,
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
