import "dotenv/config";
import type { Config } from "drizzle-kit";

export default {
  schema: "./app/database/schema.ts",
  out: "./app/database",
  driver: "pg",
  dbCredentials: {
    connectionString: process.env.DATABASE_URL,
  },
} satisfies Config;
