import { relations, sql } from "drizzle-orm";
import {
  text,
  pgTable,
  integer,
  uuid,
  jsonb,
  timestamp,
} from "drizzle-orm/pg-core";

export type UserPreferences = {
  theme: "light" | "dark" | "system";
  [key: string]: any;
};

export const users = pgTable("users", {
  id: uuid("id")
    .default(sql`uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  full_name: text("full_name"),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  avatar_url: text("avatar_url"),
  preferences: jsonb("preferences")
    .$type<UserPreferences>()
    .notNull()
    .default({ theme: "light" }),
  created_at: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).default(sql`timezone('utc'::text, now())`),
  updated_at: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).default(sql`timezone('utc'::text, now())`),
});

export const files = pgTable("files", {
  id: uuid("id")
    .default(sql`uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  owner_id: uuid("owner_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  key: text("key").notNull(),
  size: integer("size").notNull(),
  created_at: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).default(sql`timezone('utc'::text, now())`),
  updated_at: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).default(sql`timezone('utc'::text, now())`),
});

export const tiles = pgTable("tiles", {
  id: uuid("id")
    .default(sql`uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  owner_id: uuid("owner_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  files: jsonb("files").$type<string[]>(),
  key: text("key").notNull(),
  created_at: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).default(sql`timezone('utc'::text, now())`),
  updated_at: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).default(sql`timezone('utc'::text, now())`),
});

export type StorageConfiguration = {
  provider: "cloudflare";
  region?: string;
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};
export const settings = pgTable("settings", {
  id: uuid("id")
    .default(sql`uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  storage: jsonb("storage").$type<StorageConfiguration | null>(),
  created_at: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).default(sql`timezone('utc'::text, now())`),
  updated_at: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).default(sql`timezone('utc'::text, now())`),
});

export const queue = pgTable("queue", {
  id: uuid("id")
    .default(sql`uuid_generate_v4()`)
    .primaryKey()
    .notNull(),
  status: text("status").notNull().default("pending"), // Assuming the possible statuses are 'pending', 'processing', 'completed', 'failed'
  payload: jsonb("payload").$type<Record<string, any>>(), // Storing task-specific data
  created_at: timestamp("created_at", {
    withTimezone: true,
    mode: "string",
  }).default(sql`timezone('utc'::text, now())`),
  updated_at: timestamp("updated_at", {
    withTimezone: true,
    mode: "string",
  }).default(sql`timezone('utc'::text, now())`),
});

// export const job = pgTable("job", {
//   id: uuid("id")
//     .default(sql`uuid_generate_v4()`)
//     .primaryKey()
//     .notNull(),
//   name: text("name").notNull(),
//   priority: integer("priority").notNull().default(0),
//   data: jsonb("data"),
//   output: jsonb("output"),
//   createdOn: timestamp("created_at", {
//     withTimezone: true,
//     mode: "string",
//   }).default(sql`timezone('utc'::text, now())`),
//   completedOn: timestamp("created_at", {
//     withTimezone: true,
//     mode: "string",
//   }),
// });

export const userRelations = relations(users, ({ many }) => ({
  files: many(files),
  tiles: many(tiles),
}));
