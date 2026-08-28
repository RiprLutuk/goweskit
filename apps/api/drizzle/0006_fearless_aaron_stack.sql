CREATE TABLE "explore_moderation_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"contribution_kind" varchar(30) NOT NULL,
	"contribution_id" uuid NOT NULL,
	"moderator_user_id" uuid NOT NULL,
	"previous_status" varchar(20) NOT NULL,
	"target_status" varchar(20) NOT NULL,
	"reason" varchar(500),
	"occurred_at" timestamp with time zone NOT NULL,
	CONSTRAINT "explore_moderation_audits_transition_check" CHECK ("explore_moderation_audits"."previous_status" = 'pending' AND "explore_moderation_audits"."target_status" IN ('approved', 'rejected'))
);
--> statement-breakpoint
CREATE TABLE "hazard_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_user_id" uuid NOT NULL,
	"route_id" uuid,
	"hazard_type" varchar(30) NOT NULL,
	"severity" varchar(20) NOT NULL,
	"location" geography(Point,4326) NOT NULL,
	"notes" text NOT NULL,
	"observed_at" timestamp with time zone,
	"moderation_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"moderated_by" uuid,
	"moderated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "hazard_reports_type_check" CHECK ("hazard_reports"."hazard_type" IN ('road_damage', 'trail_obstruction', 'traffic', 'construction', 'flooding', 'animal', 'other')),
	CONSTRAINT "hazard_reports_severity_check" CHECK ("hazard_reports"."severity" IN ('info', 'caution', 'danger')),
	CONSTRAINT "hazard_reports_moderation_status_check" CHECK ("hazard_reports"."moderation_status" IN ('pending', 'approved', 'rejected'))
);
--> statement-breakpoint
CREATE TABLE "place_reviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_user_id" uuid NOT NULL,
	"place_id" uuid NOT NULL,
	"rating" integer NOT NULL,
	"notes" text NOT NULL,
	"moderation_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"moderated_by" uuid,
	"moderated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "place_reviews_rating_check" CHECK ("place_reviews"."rating" BETWEEN 1 AND 5),
	CONSTRAINT "place_reviews_moderation_status_check" CHECK ("place_reviews"."moderation_status" IN ('pending', 'approved', 'rejected'))
);
--> statement-breakpoint
CREATE TABLE "route_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reporter_user_id" uuid NOT NULL,
	"route_id" uuid NOT NULL,
	"report_type" varchar(30) NOT NULL,
	"notes" text NOT NULL,
	"observed_at" timestamp with time zone,
	"moderation_status" varchar(20) DEFAULT 'pending' NOT NULL,
	"moderated_by" uuid,
	"moderated_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "route_reports_type_check" CHECK ("route_reports"."report_type" IN ('condition', 'closure', 'incorrect_route', 'difficulty', 'other')),
	CONSTRAINT "route_reports_moderation_status_check" CHECK ("route_reports"."moderation_status" IN ('pending', 'approved', 'rejected'))
);
--> statement-breakpoint
ALTER TABLE "explore_moderation_audits" ADD CONSTRAINT "explore_moderation_audits_moderator_user_id_users_id_fk" FOREIGN KEY ("moderator_user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hazard_reports" ADD CONSTRAINT "hazard_reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hazard_reports" ADD CONSTRAINT "hazard_reports_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "hazard_reports" ADD CONSTRAINT "hazard_reports_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_reviews" ADD CONSTRAINT "place_reviews_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_reviews" ADD CONSTRAINT "place_reviews_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "place_reviews" ADD CONSTRAINT "place_reviews_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_reports" ADD CONSTRAINT "route_reports_reporter_user_id_users_id_fk" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_reports" ADD CONSTRAINT "route_reports_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "route_reports" ADD CONSTRAINT "route_reports_moderated_by_users_id_fk" FOREIGN KEY ("moderated_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "explore_moderation_audits_contribution_idx" ON "explore_moderation_audits" USING btree ("contribution_kind","contribution_id","occurred_at");--> statement-breakpoint
CREATE INDEX "explore_moderation_audits_moderator_idx" ON "explore_moderation_audits" USING btree ("moderator_user_id","occurred_at");--> statement-breakpoint
CREATE INDEX "hazard_reports_location_gist_idx" ON "hazard_reports" USING gist ("location");--> statement-breakpoint
CREATE INDEX "hazard_reports_route_public_idx" ON "hazard_reports" USING btree ("route_id","moderation_status","created_at");--> statement-breakpoint
CREATE INDEX "hazard_reports_reporter_idx" ON "hazard_reports" USING btree ("reporter_user_id","created_at");--> statement-breakpoint
CREATE INDEX "place_reviews_place_public_idx" ON "place_reviews" USING btree ("place_id","moderation_status","created_at");--> statement-breakpoint
CREATE INDEX "place_reviews_reporter_idx" ON "place_reviews" USING btree ("reporter_user_id","created_at");--> statement-breakpoint
CREATE INDEX "route_reports_route_public_idx" ON "route_reports" USING btree ("route_id","moderation_status","created_at");--> statement-breakpoint
CREATE INDEX "route_reports_reporter_idx" ON "route_reports" USING btree ("reporter_user_id","created_at");
