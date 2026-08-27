CREATE TABLE "bike_component_installs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_bike_id" uuid NOT NULL,
	"component_category_id" uuid NOT NULL,
	"custom_name" varchar(120) NOT NULL,
	"brand" varchar(100),
	"model" varchar(120),
	"serial_number" varchar(160),
	"notes" text,
	"installed_at" date,
	"standards" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "bike_component_installs" ADD CONSTRAINT "bike_component_installs_user_bike_id_user_bikes_id_fk" FOREIGN KEY ("user_bike_id") REFERENCES "public"."user_bikes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "bike_component_installs" ADD CONSTRAINT "bike_component_installs_component_category_id_component_categories_id_fk" FOREIGN KEY ("component_category_id") REFERENCES "public"."component_categories"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "bike_component_installs_bike_idx" ON "bike_component_installs" USING btree ("user_bike_id");--> statement-breakpoint
CREATE INDEX "bike_component_installs_category_idx" ON "bike_component_installs" USING btree ("component_category_id");