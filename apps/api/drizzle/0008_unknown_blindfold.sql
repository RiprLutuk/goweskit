CREATE TABLE "user_saved_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"item_kind" varchar(20) NOT NULL,
	"item_id" uuid NOT NULL,
	"saved_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "user_saved_items_kind_check" CHECK ("user_saved_items"."item_kind" IN ('place', 'route'))
);
--> statement-breakpoint
ALTER TABLE "ride_events" ADD COLUMN "description" text;--> statement-breakpoint
UPDATE "ride_events" SET "description" = "requirements" WHERE "description" IS NULL;--> statement-breakpoint
ALTER TABLE "ride_events" ALTER COLUMN "description" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "routes" ADD COLUMN "elevation_profile" jsonb;--> statement-breakpoint
ALTER TABLE "user_bikes" ADD COLUMN "avatar_preset" varchar(80);--> statement-breakpoint
ALTER TABLE "user_saved_items" ADD CONSTRAINT "user_saved_items_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "user_saved_items_user_kind_item_unique" ON "user_saved_items" USING btree ("user_id","item_kind","item_id");--> statement-breakpoint
CREATE INDEX "user_saved_items_user_saved_idx" ON "user_saved_items" USING btree ("user_id","saved_at");
