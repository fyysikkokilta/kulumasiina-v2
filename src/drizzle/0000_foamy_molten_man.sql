CREATE TABLE
	"attachment" (
		"id" serial PRIMARY KEY NOT NULL,
		"item_id" integer,
		"filename" text NOT NULL,
		"data" text NOT NULL,
		"value" real,
		"is_not_receipt" boolean NOT NULL,
		"created_at" timestamp DEFAULT now () NOT NULL,
		"updated_at" timestamp DEFAULT now () NOT NULL
	);

--> statement-breakpoint
CREATE TABLE
	"entry" (
		"id" serial PRIMARY KEY NOT NULL,
		"name" text NOT NULL,
		"contact" text NOT NULL,
		"iban" text NOT NULL,
		"gov_id" text,
		"title" text NOT NULL,
		"status" text DEFAULT 'submitted' NOT NULL,
		"submission_date" timestamp NOT NULL,
		"approval_date" timestamp,
		"approval_note" text,
		"paid_date" timestamp,
		"rejection_date" timestamp,
		"archived" boolean DEFAULT false,
		"created_at" timestamp DEFAULT now () NOT NULL,
		"updated_at" timestamp DEFAULT now () NOT NULL
	);

--> statement-breakpoint
CREATE TABLE
	"item" (
		"id" serial PRIMARY KEY NOT NULL,
		"entry_id" integer NOT NULL,
		"description" text NOT NULL,
		"date" timestamp NOT NULL,
		"account" text,
		"created_at" timestamp DEFAULT now () NOT NULL,
		"updated_at" timestamp DEFAULT now () NOT NULL
	);

--> statement-breakpoint
CREATE TABLE
	"mileage" (
		"id" serial PRIMARY KEY NOT NULL,
		"entry_id" integer NOT NULL,
		"description" text NOT NULL,
		"date" timestamp NOT NULL,
		"route" text NOT NULL,
		"distance" real NOT NULL,
		"plate_no" text NOT NULL,
		"account" text,
		"created_at" timestamp DEFAULT now () NOT NULL,
		"updated_at" timestamp DEFAULT now () NOT NULL
	);

--> statement-breakpoint
ALTER TABLE "attachment" ADD CONSTRAINT "attachment_item_id_item_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."item" ("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_entry_id_entry_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entry" ("id") ON DELETE cascade ON UPDATE no action;

--> statement-breakpoint
ALTER TABLE "mileage" ADD CONSTRAINT "mileage_entry_id_entry_id_fk" FOREIGN KEY ("entry_id") REFERENCES "public"."entry" ("id") ON DELETE cascade ON UPDATE no action;