CREATE TABLE "maintenance_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"user_bike_id" uuid NOT NULL,
	"type" varchar(40) NOT NULL,
	"performed_at" date NOT NULL,
	"notes" text,
	"next_due_date" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "maintenance_events_due_after_performed_check" CHECK ("maintenance_events"."next_due_date" IS NULL OR "maintenance_events"."next_due_date" >= "maintenance_events"."performed_at")
);
--> statement-breakpoint
ALTER TABLE "maintenance_events" ADD CONSTRAINT "maintenance_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "maintenance_events" ADD CONSTRAINT "maintenance_events_user_bike_id_user_bikes_id_fk" FOREIGN KEY ("user_bike_id") REFERENCES "public"."user_bikes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "maintenance_events_bike_performed_idx" ON "maintenance_events" USING btree ("user_bike_id","performed_at");--> statement-breakpoint
CREATE INDEX "maintenance_events_user_due_idx" ON "maintenance_events" USING btree ("user_id","next_due_date");