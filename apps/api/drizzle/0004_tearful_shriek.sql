CREATE TABLE "communities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text NOT NULL,
	"locality" varchar(160) NOT NULL,
	"home_location" geography(Point,4326) NOT NULL,
	"bicycle_types" text[] NOT NULL,
	"visibility" varchar(20) NOT NULL,
	"join_mode" varchar(20) NOT NULL,
	"verification_status" varchar(30) DEFAULT 'unverified' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_memberships" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" varchar(20) NOT NULL,
	"status" varchar(20) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "community_moderation_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"membership_id" uuid NOT NULL,
	"reviewer_id" uuid NOT NULL,
	"decision" varchar(20) NOT NULL,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ride_event_participations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"status" varchar(20) NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ride_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"community_id" uuid NOT NULL,
	"title" varchar(180) NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"meeting_location" geography(Point,4326) NOT NULL,
	"meeting_area" varchar(200) NOT NULL,
	"route_id" uuid,
	"difficulty" varchar(30) NOT NULL,
	"bicycle_types" text[] NOT NULL,
	"capacity" integer,
	"requirements" text NOT NULL,
	"visibility" varchar(20) NOT NULL,
	"status" varchar(20) NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "ride_events_capacity_positive_check" CHECK ("ride_events"."capacity" IS NULL OR "ride_events"."capacity" > 0)
);
--> statement-breakpoint
ALTER TABLE "communities" ADD CONSTRAINT "communities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_memberships" ADD CONSTRAINT "community_memberships_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_moderation_audits" ADD CONSTRAINT "community_moderation_audits_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_moderation_audits" ADD CONSTRAINT "community_moderation_audits_membership_id_community_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."community_memberships"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "community_moderation_audits" ADD CONSTRAINT "community_moderation_audits_reviewer_id_users_id_fk" FOREIGN KEY ("reviewer_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_event_participations" ADD CONSTRAINT "ride_event_participations_event_id_ride_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "public"."ride_events"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_event_participations" ADD CONSTRAINT "ride_event_participations_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_events" ADD CONSTRAINT "ride_events_community_id_communities_id_fk" FOREIGN KEY ("community_id") REFERENCES "public"."communities"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_events" ADD CONSTRAINT "ride_events_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ride_events" ADD CONSTRAINT "ride_events_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "communities_slug_unique" ON "communities" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "communities_home_location_gist_idx" ON "communities" USING gist ("home_location");--> statement-breakpoint
CREATE INDEX "communities_discovery_idx" ON "communities" USING btree ("visibility","verification_status");--> statement-breakpoint
CREATE UNIQUE INDEX "community_memberships_community_user_unique" ON "community_memberships" USING btree ("community_id","user_id");--> statement-breakpoint
CREATE INDEX "community_memberships_queue_idx" ON "community_memberships" USING btree ("community_id","status","created_at");--> statement-breakpoint
CREATE INDEX "community_memberships_user_idx" ON "community_memberships" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "community_moderation_audits_community_idx" ON "community_moderation_audits" USING btree ("community_id","created_at");--> statement-breakpoint
CREATE INDEX "community_moderation_audits_reviewer_idx" ON "community_moderation_audits" USING btree ("reviewer_id","created_at");--> statement-breakpoint
CREATE UNIQUE INDEX "ride_event_participations_event_user_unique" ON "ride_event_participations" USING btree ("event_id","user_id");--> statement-breakpoint
CREATE INDEX "ride_event_participations_event_status_idx" ON "ride_event_participations" USING btree ("event_id","status");--> statement-breakpoint
CREATE INDEX "ride_event_participations_user_idx" ON "ride_event_participations" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "ride_events_meeting_location_gist_idx" ON "ride_events" USING gist ("meeting_location");--> statement-breakpoint
CREATE INDEX "ride_events_discovery_idx" ON "ride_events" USING btree ("status","visibility","starts_at");--> statement-breakpoint
CREATE INDEX "ride_events_community_idx" ON "ride_events" USING btree ("community_id","starts_at");
