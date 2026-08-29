ALTER TABLE "user_saved_items" DROP CONSTRAINT "user_saved_items_kind_check";--> statement-breakpoint
DROP INDEX "user_saved_items_user_kind_item_unique";--> statement-breakpoint
ALTER TABLE "user_saved_items" ADD COLUMN "place_id" uuid;--> statement-breakpoint
ALTER TABLE "user_saved_items" ADD COLUMN "route_id" uuid;--> statement-breakpoint
ALTER TABLE "user_saved_items" ADD CONSTRAINT "user_saved_items_place_id_places_id_fk" FOREIGN KEY ("place_id") REFERENCES "public"."places"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_saved_items" ADD CONSTRAINT "user_saved_items_route_id_routes_id_fk" FOREIGN KEY ("route_id") REFERENCES "public"."routes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
UPDATE "user_saved_items" SET "place_id" = "item_id" WHERE "item_kind" = 'place';--> statement-breakpoint
UPDATE "user_saved_items" SET "route_id" = "item_id" WHERE "item_kind" = 'route';--> statement-breakpoint
CREATE UNIQUE INDEX "user_saved_items_user_place_unique" ON "user_saved_items" USING btree ("user_id","place_id") WHERE "user_saved_items"."place_id" IS NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "user_saved_items_user_route_unique" ON "user_saved_items" USING btree ("user_id","route_id") WHERE "user_saved_items"."route_id" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "user_saved_items" DROP COLUMN "item_kind";--> statement-breakpoint
ALTER TABLE "user_saved_items" DROP COLUMN "item_id";--> statement-breakpoint
ALTER TABLE "user_saved_items" ADD CONSTRAINT "user_saved_items_exactly_one_target_check" CHECK (num_nonnulls("user_saved_items"."place_id", "user_saved_items"."route_id") = 1);
