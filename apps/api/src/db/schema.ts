import { sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

// Better Auth's tables (user, session, account, verification, subscription)
// are generated from auth.config.ts: run `pnpm generate:auth`, never edit
// auth-schema.ts by hand. Only the app's own tables live in this file.
export * from "./auth-schema";

export const plan = sqliteTable("plan", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  priceId: text("price_id"),
  lookupKey: text("lookup_key"),
  annualDiscountPriceId: text("annual_discount_price_id"),
  annualDiscountLookupKey: text("annual_discount_lookup_key"),
  limits: text("limits"),
  group: text("group"),
  freeTrialDays: integer("free_trial_days").default(0).notNull(),
  // Same timestamp format as the generated auth tables.
  createdAt: integer("created_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .notNull(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .default(sql`(cast(unixepoch('subsecond') * 1000 as integer))`)
    .$onUpdate(() => new Date())
    .notNull()
});
