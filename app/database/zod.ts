import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import * as schema from "./schema";
import { z } from "zod";

export const selectUserSchema = createSelectSchema(schema.users);
export const selectFileSchema = createSelectSchema(schema.files);
export const selectTileSchema = createSelectSchema(schema.tiles);
export const selectQueueSchema = createSelectSchema(schema.queue, {
  payload: z.record(z.any()),
});
export const selectSettingSchema = createSelectSchema(schema.settings, {
  storage: z.object({
    provider: z.literal("cloudflare"),
    region: z.string().optional().default("auto"),
    accountId: z.string(),
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
    bucket: z.string(),
  }),
});

export const insertUserSchema = createInsertSchema(schema.users);
export const insertFileSchema = createInsertSchema(schema.files);
export const insertTileSchema = createInsertSchema(schema.tiles);
export const insertQueueSchema = createInsertSchema(schema.queue, {
  payload: z.record(z.any()),
});
export const insertSettingSchema = createInsertSchema(schema.settings, {
  storage: z.object({
    provider: z.literal("cloudflare"),
    region: z.string().optional().default("auto"),
    accountId: z.string(),
    accessKeyId: z.string(),
    secretAccessKey: z.string(),
    bucket: z.string(),
  }),
});
