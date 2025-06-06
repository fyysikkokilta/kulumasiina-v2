CREATE TYPE "public"."status" AS ENUM('submitted', 'approved', 'paid', 'denied');--> statement-breakpoint
ALTER TABLE "attachment" ALTER COLUMN "is_not_receipt" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "entry" ALTER COLUMN "status" SET DEFAULT 'submitted'::"public"."status";--> statement-breakpoint
ALTER TABLE "entry" ALTER COLUMN "status" SET DATA TYPE "public"."status" USING "status"::"public"."status";--> statement-breakpoint
ALTER TABLE "item" ALTER COLUMN "date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "mileage" ALTER COLUMN "date" SET DATA TYPE timestamp;--> statement-breakpoint
ALTER TABLE "attachment" DROP COLUMN "data";