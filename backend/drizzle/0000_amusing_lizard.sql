CREATE TABLE "expense_shares" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"expense_id" uuid NOT NULL,
	"member_id" uuid NOT NULL,
	"share_paise" integer NOT NULL,
	CONSTRAINT "expense_shares_expense_member" UNIQUE("expense_id","member_id"),
	CONSTRAINT "expense_shares_nonnegative" CHECK ("expense_shares"."share_paise" >= 0)
);
--> statement-breakpoint
CREATE TABLE "expenses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"title" text NOT NULL,
	"amount_paise" integer NOT NULL,
	"paid_by_member_id" uuid NOT NULL,
	"expense_date" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "expenses_group_id_id" UNIQUE("group_id","id"),
	CONSTRAINT "expenses_positive_amount" CHECK ("expenses"."amount_paise" > 0)
);
--> statement-breakpoint
CREATE TABLE "groups" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"name" text NOT NULL,
	CONSTRAINT "members_group_id_id" UNIQUE("group_id","id")
);
--> statement-breakpoint
CREATE TABLE "settlements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"group_id" uuid NOT NULL,
	"from_member_id" uuid NOT NULL,
	"to_member_id" uuid NOT NULL,
	"amount_paise" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "settlements_positive_amount" CHECK ("settlements"."amount_paise" > 0),
	CONSTRAINT "settlements_different_members" CHECK ("settlements"."from_member_id" <> "settlements"."to_member_id")
);
--> statement-breakpoint
ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_group_id_expense_id_expenses_group_id_id_fk" FOREIGN KEY ("group_id","expense_id") REFERENCES "public"."expenses"("group_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expense_shares" ADD CONSTRAINT "expense_shares_group_id_member_id_members_group_id_id_fk" FOREIGN KEY ("group_id","member_id") REFERENCES "public"."members"("group_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_group_id_paid_by_member_id_members_group_id_id_fk" FOREIGN KEY ("group_id","paid_by_member_id") REFERENCES "public"."members"("group_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "members" ADD CONSTRAINT "members_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_group_id_groups_id_fk" FOREIGN KEY ("group_id") REFERENCES "public"."groups"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_group_id_from_member_id_members_group_id_id_fk" FOREIGN KEY ("group_id","from_member_id") REFERENCES "public"."members"("group_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "settlements" ADD CONSTRAINT "settlements_group_id_to_member_id_members_group_id_id_fk" FOREIGN KEY ("group_id","to_member_id") REFERENCES "public"."members"("group_id","id") ON DELETE no action ON UPDATE no action;