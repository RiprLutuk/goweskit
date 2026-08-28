ALTER TABLE "maintenance_events" ADD COLUMN "performed_at_distance_km" integer;--> statement-breakpoint
ALTER TABLE "maintenance_events" ADD COLUMN "next_due_distance_km" integer;--> statement-breakpoint
ALTER TABLE "user_bikes" ADD COLUMN "photo_url" text;