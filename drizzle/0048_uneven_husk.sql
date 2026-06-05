CREATE TABLE "wanjiedaoyou_tower_enemy_floors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"season_key" varchar(40) NOT NULL,
	"realm" varchar(20) NOT NULL,
	"floor" integer NOT NULL,
	"status" varchar(20) DEFAULT 'ready' NOT NULL,
	"schema_version" integer DEFAULT 1 NOT NULL,
	"enemy" jsonb,
	"generated_at" timestamp DEFAULT now() NOT NULL,
	"error_message" text,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DROP TABLE "wanjiedaoyou_tower_enemy_sets" CASCADE;--> statement-breakpoint
CREATE UNIQUE INDEX "tower_enemy_floors_season_realm_floor_uidx" ON "wanjiedaoyou_tower_enemy_floors" USING btree ("season_key","realm","floor");--> statement-breakpoint
CREATE INDEX "tower_enemy_floors_realm_floor_generated_idx" ON "wanjiedaoyou_tower_enemy_floors" USING btree ("realm","floor","generated_at");--> statement-breakpoint
CREATE INDEX "tower_enemy_floors_season_realm_status_idx" ON "wanjiedaoyou_tower_enemy_floors" USING btree ("season_key","realm","status");