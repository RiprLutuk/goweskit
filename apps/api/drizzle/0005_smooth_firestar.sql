CREATE TABLE "safety_audits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"action" varchar(40) NOT NULL,
	"session_id" uuid,
	"actor_user_id" uuid,
	"occurred_at" timestamp with time zone NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "safety_locations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"location" geography(Point,4326) NOT NULL,
	"accuracy_meters" double precision NOT NULL,
	"battery_percent" double precision,
	"recorded_at" timestamp with time zone NOT NULL,
	CONSTRAINT "safety_locations_accuracy_check" CHECK ("safety_locations"."accuracy_meters" >= 0 AND "safety_locations"."accuracy_meters" <= 10000),
	CONSTRAINT "safety_locations_battery_check" CHECK ("safety_locations"."battery_percent" IS NULL OR ("safety_locations"."battery_percent" >= 0 AND "safety_locations"."battery_percent" <= 100))
);
--> statement-breakpoint
CREATE TABLE "safety_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"rider_display_name" varchar(80) NOT NULL,
	"trusted_contact_id" uuid,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"started_at" timestamp with time zone NOT NULL,
	"expected_end_at" timestamp with time zone,
	"ended_at" timestamp with time zone,
	"share_token_hash" varchar(64) NOT NULL,
	"share_expires_at" timestamp with time zone NOT NULL,
	"sos_triggered_at" timestamp with time zone,
	"note" text,
	CONSTRAINT "safety_sessions_status_check" CHECK ("safety_sessions"."status" IN ('active', 'sos', 'ended', 'revoked', 'expired')),
	CONSTRAINT "safety_sessions_share_expiry_check" CHECK ("safety_sessions"."share_expires_at" > "safety_sessions"."started_at"),
	CONSTRAINT "safety_sessions_expected_end_check" CHECK ("safety_sessions"."expected_end_at" IS NULL OR ("safety_sessions"."expected_end_at" > "safety_sessions"."started_at" AND "safety_sessions"."expected_end_at" <= "safety_sessions"."share_expires_at"))
);
--> statement-breakpoint
CREATE TABLE "trusted_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"name" varchar(80) NOT NULL,
	"phone" varchar(160),
	"email" varchar(320),
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "trusted_contacts_reachable_check" CHECK ("trusted_contacts"."phone" IS NOT NULL OR "trusted_contacts"."email" IS NOT NULL)
);
--> statement-breakpoint
ALTER TABLE "safety_audits" ADD CONSTRAINT "safety_audits_session_id_safety_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."safety_sessions"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_audits" ADD CONSTRAINT "safety_audits_actor_user_id_users_id_fk" FOREIGN KEY ("actor_user_id") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_locations" ADD CONSTRAINT "safety_locations_session_id_safety_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."safety_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_sessions" ADD CONSTRAINT "safety_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "safety_sessions" ADD CONSTRAINT "safety_sessions_trusted_contact_id_trusted_contacts_id_fk" FOREIGN KEY ("trusted_contact_id") REFERENCES "public"."trusted_contacts"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "trusted_contacts" ADD CONSTRAINT "trusted_contacts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "safety_audits_session_occurred_idx" ON "safety_audits" USING btree ("session_id","occurred_at");--> statement-breakpoint
CREATE INDEX "safety_audits_retention_idx" ON "safety_audits" USING btree ("occurred_at");--> statement-breakpoint
CREATE INDEX "safety_locations_session_recorded_idx" ON "safety_locations" USING btree ("session_id","recorded_at");--> statement-breakpoint
CREATE INDEX "safety_locations_retention_idx" ON "safety_locations" USING btree ("recorded_at");--> statement-breakpoint
CREATE UNIQUE INDEX "safety_sessions_share_token_hash_unique" ON "safety_sessions" USING btree ("share_token_hash");--> statement-breakpoint
CREATE INDEX "safety_sessions_user_started_idx" ON "safety_sessions" USING btree ("user_id","started_at");--> statement-breakpoint
CREATE INDEX "safety_sessions_expiry_idx" ON "safety_sessions" USING btree ("status","share_expires_at");--> statement-breakpoint
CREATE INDEX "trusted_contacts_user_created_idx" ON "trusted_contacts" USING btree ("user_id","created_at");
