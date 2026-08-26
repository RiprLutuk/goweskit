CREATE EXTENSION IF NOT EXISTS postgis;
--> statement-breakpoint
CREATE TABLE "bicycle_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(100) NOT NULL,
	"summary" text NOT NULL,
	"typical_use" text NOT NULL,
	"beginner_notes" text NOT NULL,
	CONSTRAINT "bicycle_types_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "bike_specs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_bike_id" uuid NOT NULL,
	"standard_code" varchar(80) NOT NULL,
	"value_json" jsonb,
	"confidence" varchar(30) NOT NULL,
	"source" varchar(80) NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "bike_specs_unknown_value_check" CHECK (("bike_specs"."confidence" = 'unknown' AND "bike_specs"."value_json" IS NULL) OR ("bike_specs"."confidence" <> 'unknown' AND "bike_specs"."value_json" IS NOT NULL))
);
--> statement-breakpoint
CREATE TABLE "component_categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" varchar(80) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	CONSTRAINT "component_categories_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" varchar(64) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "standard_definitions" (
	"code" varchar(80) PRIMARY KEY NOT NULL,
	"category" varchar(80) NOT NULL,
	"label" varchar(120) NOT NULL,
	"description" text NOT NULL,
	"guidance" text NOT NULL,
	"source_url" text NOT NULL,
	"review_status" varchar(30) DEFAULT 'reviewed' NOT NULL,
	"version" varchar(30) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_bikes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"nickname" varchar(80) NOT NULL,
	"bicycle_type_id" uuid NOT NULL,
	"brand" varchar(100),
	"model" varchar(100),
	"model_year" integer,
	"notes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"display_name" varchar(80) NOT NULL,
	"email" varchar(320) NOT NULL,
	"password_hash" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bike_specs" ADD CONSTRAINT "bike_specs_user_bike_id_user_bikes_id_fk" FOREIGN KEY ("user_bike_id") REFERENCES "public"."user_bikes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bike_specs" ADD CONSTRAINT "bike_specs_standard_code_standard_definitions_code_fk" FOREIGN KEY ("standard_code") REFERENCES "public"."standard_definitions"("code") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bikes" ADD CONSTRAINT "user_bikes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_bikes" ADD CONSTRAINT "user_bikes_bicycle_type_id_bicycle_types_id_fk" FOREIGN KEY ("bicycle_type_id") REFERENCES "public"."bicycle_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "bike_specs_bike_standard_unique" ON "bike_specs" USING btree ("user_bike_id","standard_code");--> statement-breakpoint
CREATE INDEX "bike_specs_user_bike_id_idx" ON "bike_specs" USING btree ("user_bike_id");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_token_hash_unique" ON "sessions" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_id_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "user_bikes_user_id_idx" ON "user_bikes" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");
--> statement-breakpoint
INSERT INTO "bicycle_types" ("slug", "name", "summary", "typical_use", "beginner_notes") VALUES
  ('mtb_hardtail', 'MTB Hardtail', 'A mountain bike with front suspension and a rigid rear frame.', 'Trails, mixed surfaces, commuting, and learning off-road skills.', 'A simple, versatile first mountain bike. Wheel, axle, fork, and drivetrain standards still need checking before upgrades.'),
  ('folding', 'Folding Bike', 'A compact bicycle with a frame designed to fold for storage and transport.', 'Urban trips, public-transport connections, and limited storage.', 'Wheel sizes and folding-specific parts vary widely. Measure and confirm standards instead of relying on the brand name.');
--> statement-breakpoint
INSERT INTO "component_categories" ("slug", "name", "description") VALUES
  ('frame', 'Frame', 'The main structure that determines fit and many component interfaces.'),
  ('fork', 'Fork', 'Holds the front wheel and may provide suspension.'),
  ('rear_shock', 'Rear Shock', 'Controls rear suspension movement on full-suspension bikes.'),
  ('wheel', 'Wheel', 'The rim, spokes, and hub assembly.'),
  ('hub', 'Hub', 'The wheel center containing bearings, axle interfaces, and the freehub.'),
  ('tire', 'Tire', 'The rubber contact surface fitted to the rim.'),
  ('cassette', 'Cassette', 'The rear cluster of sprockets fitted to the freehub.'),
  ('chain', 'Chain', 'Transfers pedaling force through the drivetrain.'),
  ('crank', 'Crank', 'Connects the pedals to the bottom bracket and chainring.'),
  ('bottom_bracket', 'Bottom Bracket', 'The bearing assembly between crank and frame.'),
  ('rear_derailleur', 'Rear Derailleur', 'Moves the chain across the cassette.'),
  ('shifter', 'Shifter', 'Controls gear changes.'),
  ('brake', 'Brake', 'Slows the bicycle through rim or disc braking.'),
  ('rotor', 'Rotor', 'The disc-brake surface attached to the hub.'),
  ('handlebar', 'Handlebar', 'The primary steering contact point.'),
  ('stem', 'Stem', 'Connects the handlebar to the fork steerer.'),
  ('seatpost', 'Seatpost', 'Connects the saddle to the frame.'),
  ('saddle', 'Saddle', 'The rider seating contact point.'),
  ('pedal', 'Pedal', 'The rider foot contact attached to the crank.'),
  ('folding_hinge', 'Folding Hinge', 'The frame mechanism that enables a folding bike to fold.');
--> statement-breakpoint
INSERT INTO "standard_definitions" ("code", "category", "label", "description", "guidance", "source_url", "review_status", "version") VALUES
  ('wheel_size', 'wheel', 'Wheel size', 'The wheel bead-seat diameter used by the frame and wheel.', 'Look for an ISO/ETRTO number on the tire sidewall, such as 622 or 584.', 'https://www.iso.org/standard/80740.html', 'reviewed', '1.0.0'),
  ('front_axle', 'hub', 'Front axle', 'The front hub axle diameter and dropout spacing.', 'Check the fork leg markings or measure the hub spacing and axle.', 'https://www.sram.com/globalassets/document-hierarchy/compatibility-map/mtb/mtb-hubforkwheelend-cap-compatibilty-.pdf', 'reviewed', '1.0.0'),
  ('rear_axle', 'hub', 'Rear axle', 'The rear hub axle format and frame dropout spacing.', 'Check the frame or rear hub markings for spacing and axle format.', 'https://www.sram.com/en/service/manuals--documents/compatability-map', 'reviewed', '1.0.0'),
  ('freehub', 'cassette', 'Freehub interface', 'The spline interface that receives the cassette.', 'Remove the cassette or check the rear hub documentation for the freehub body.', 'https://www.sram.com/globalassets/document-hierarchy/compatibility-map/mtb/2021-mtb-components-compatibility-map.pdf', 'reviewed', '1.0.0'),
  ('drivetrain_speeds', 'rear_derailleur', 'Drivetrain speeds', 'The number of rear cassette sprockets used by the drivetrain.', 'Count the cassette sprockets or check the shifter model specification.', 'https://www.sram.com/en/service/manuals--documents/compatability-map', 'reviewed', '1.0.0'),
  ('fork_steerer', 'fork', 'Fork steerer', 'The steerer-tube shape accepted by the frame and headset.', 'Check the fork specification and the headset or frame documentation.', 'https://www.sram.com/en/service/manuals--documents/compatability-map', 'reviewed', '1.0.0');
