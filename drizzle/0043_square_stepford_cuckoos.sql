CREATE TABLE "wanjiedaoyou_cultivator_tasks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"cultivator_id" uuid NOT NULL,
	"definition_id" varchar(120) NOT NULL,
	"category" varchar(40) NOT NULL,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"current_stage" varchar(120),
	"objectives" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"metadata" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"completed_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "wanjiedaoyou_cultivator_tasks" ADD CONSTRAINT "wanjiedaoyou_cultivator_tasks_cultivator_id_wanjiedaoyou_cultivators_id_fk" FOREIGN KEY ("cultivator_id") REFERENCES "public"."wanjiedaoyou_cultivators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "cultivator_tasks_cultivator_status_updated_idx" ON "wanjiedaoyou_cultivator_tasks" USING btree ("cultivator_id","status","updated_at");--> statement-breakpoint
CREATE UNIQUE INDEX "cultivator_tasks_cultivator_definition_unique" ON "wanjiedaoyou_cultivator_tasks" USING btree ("cultivator_id","definition_id");