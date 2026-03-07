-- Drop foreign key constraints first
ALTER TABLE "attachment" DROP CONSTRAINT "attachment_item_id_item_id_fk";
ALTER TABLE "item" DROP CONSTRAINT "item_entry_id_entry_id_fk";
ALTER TABLE "mileage" DROP CONSTRAINT "mileage_entry_id_entry_id_fk";

-- Add temporary UUID columns
ALTER TABLE "entry" ADD COLUMN "id_new" uuid DEFAULT gen_random_uuid();
ALTER TABLE "item" ADD COLUMN "id_new" uuid DEFAULT gen_random_uuid();
ALTER TABLE "item" ADD COLUMN "entry_id_new" uuid;
ALTER TABLE "mileage" ADD COLUMN "id_new" uuid DEFAULT gen_random_uuid();
ALTER TABLE "mileage" ADD COLUMN "entry_id_new" uuid;
ALTER TABLE "attachment" ADD COLUMN "id_new" uuid DEFAULT gen_random_uuid();
ALTER TABLE "attachment" ADD COLUMN "item_id_new" uuid;

-- Update foreign key references to point to new UUIDs
UPDATE "item" SET "entry_id_new" = "entry"."id_new" FROM "entry" WHERE "item"."entry_id" = "entry"."id";
UPDATE "mileage" SET "entry_id_new" = "entry"."id_new" FROM "entry" WHERE "mileage"."entry_id" = "entry"."id";
UPDATE "attachment" SET "item_id_new" = "item"."id_new" FROM "item" WHERE "attachment"."item_id" = "item"."id";

-- Drop old columns and constraints
ALTER TABLE "entry" DROP CONSTRAINT "entry_pkey";
ALTER TABLE "item" DROP CONSTRAINT "item_pkey";
ALTER TABLE "mileage" DROP CONSTRAINT "mileage_pkey";
ALTER TABLE "attachment" DROP CONSTRAINT "attachment_pkey";

-- Drop old columns
ALTER TABLE "entry" DROP COLUMN "id";
ALTER TABLE "item" DROP COLUMN "id";
ALTER TABLE "item" DROP COLUMN "entry_id";
ALTER TABLE "mileage" DROP COLUMN "id";
ALTER TABLE "mileage" DROP COLUMN "entry_id";
ALTER TABLE "attachment" DROP COLUMN "id";
ALTER TABLE "attachment" DROP COLUMN "item_id";

-- Rename new columns to original names
ALTER TABLE "entry" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "item" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "item" RENAME COLUMN "entry_id_new" TO "entry_id";
ALTER TABLE "mileage" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "mileage" RENAME COLUMN "entry_id_new" TO "entry_id";
ALTER TABLE "attachment" RENAME COLUMN "id_new" TO "id";
ALTER TABLE "attachment" RENAME COLUMN "item_id_new" TO "item_id";

-- Add primary key constraints
ALTER TABLE "entry" ADD CONSTRAINT "entry_pkey" PRIMARY KEY ("id");
ALTER TABLE "item" ADD CONSTRAINT "item_pkey" PRIMARY KEY ("id");
ALTER TABLE "mileage" ADD CONSTRAINT "mileage_pkey" PRIMARY KEY ("id");
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_pkey" PRIMARY KEY ("id");

-- Add foreign key constraints back
ALTER TABLE "item" ADD CONSTRAINT "item_entry_id_entry_id_fk" FOREIGN KEY ("entry_id") REFERENCES "entry" ("id") ON DELETE CASCADE;
ALTER TABLE "mileage" ADD CONSTRAINT "mileage_entry_id_entry_id_fk" FOREIGN KEY ("entry_id") REFERENCES "entry" ("id") ON DELETE CASCADE;
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "item" ("id") ON DELETE CASCADE;

-- Set foreign key fields to not null
ALTER TABLE "item" ALTER COLUMN "entry_id" SET NOT NULL;
ALTER TABLE "mileage" ALTER COLUMN "entry_id" SET NOT NULL;
ALTER TABLE "attachment" ALTER COLUMN "item_id" SET NOT NULL;