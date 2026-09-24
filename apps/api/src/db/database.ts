import { drizzle } from "drizzle-orm/d1";
import type { AppBindings } from "../types";

type D1Binding = Parameters<typeof drizzle>[0];
let instance: ReturnType<typeof drizzle> | undefined;

// No `schema`/`relations` config: nothing uses the relational query builder
// (`db.query.*`), only the plain select/insert/update/delete builder, which is
// also all better-auth's `drizzleAdapter` calls.
export const getDb = (env: AppBindings) => {
  if (!instance) {
    instance = drizzle(env.DB as D1Binding);
  }

  return instance;
};

export type Db = ReturnType<typeof getDb>;
