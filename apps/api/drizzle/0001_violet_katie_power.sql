CREATE TABLE "places" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" varchar(40) NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text NOT NULL,
	"location" geography(Point,4326) NOT NULL,
	"address" text NOT NULL,
	"bicycle_types" text[] NOT NULL,
	"beginner_friendly" boolean DEFAULT false NOT NULL,
	"verification_status" varchar(30) DEFAULT 'unverified' NOT NULL,
	"last_confirmed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "routes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"route_type" varchar(40) NOT NULL,
	"name" varchar(160) NOT NULL,
	"description" text NOT NULL,
	"geometry" geography(LineString,4326) NOT NULL,
	"distance_meters" integer NOT NULL,
	"elevation_gain_meters" integer NOT NULL,
	"difficulty" varchar(30) NOT NULL,
	"surface" varchar(30) NOT NULL,
	"bicycle_types" text[] NOT NULL,
	"beginner_friendly" boolean DEFAULT false NOT NULL,
	"verification_status" varchar(30) DEFAULT 'unverified' NOT NULL,
	"last_confirmed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "places_location_gist_idx" ON "places" USING gist ("location");--> statement-breakpoint
CREATE INDEX "places_discovery_idx" ON "places" USING btree ("type","verification_status","last_confirmed_at");--> statement-breakpoint
CREATE INDEX "routes_geometry_gist_idx" ON "routes" USING gist ("geometry");--> statement-breakpoint
CREATE INDEX "routes_discovery_idx" ON "routes" USING btree ("route_type","difficulty","surface","verification_status","last_confirmed_at");
