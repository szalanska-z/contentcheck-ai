CREATE TABLE "ai_daily_usage" (
	"user_id" text NOT NULL,
	"day" date NOT NULL,
	"attempts" integer NOT NULL,
	CONSTRAINT "ai_daily_usage_user_id_day_pk" PRIMARY KEY("user_id","day")
);
--> statement-breakpoint
ALTER TABLE "analyses" ADD COLUMN "ai_mode" text;--> statement-breakpoint
ALTER TABLE "analyses" ADD COLUMN "ai_claim_id" uuid;--> statement-breakpoint
ALTER TABLE "analyses" ADD COLUMN "ai_claim_until" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "ai_daily_usage" ADD CONSTRAINT "ai_daily_usage_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;