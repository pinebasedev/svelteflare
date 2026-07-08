import { drizzle } from "drizzle-orm/d1";
import type { AppBindings } from "../types";
import * as schema from "./schema";

type D1Binding = Parameters<typeof drizzle>[0];
let instance: ReturnType<typeof drizzle> | undefined;

export const getDb = (env: AppBindings) => {
  if (!instance) {
    instance = drizzle(env.DB as D1Binding, { schema });
  }

  return instance;
};

export type Db = ReturnType<typeof getDb>;
