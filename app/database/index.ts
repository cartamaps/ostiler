import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("Missing environment variable: DATABASE_URL");
}

const queryClient = postgres(process.env.DATABASE_URL);
export const db = drizzle(queryClient, { schema });

export { schema };
export * from "drizzle-orm";
export * from "./types";
export * from "./zod";
