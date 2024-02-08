import { InferSelectModel } from "drizzle-orm";
import * as schema from "./schema";

export type UserRecord = InferSelectModel<typeof schema.users>;
export type FileRecord = InferSelectModel<typeof schema.files>;
export type TileRecord = InferSelectModel<typeof schema.tiles>;
export type SettingRecord = InferSelectModel<typeof schema.settings>;
export type QueueRecord = InferSelectModel<typeof schema.queue>;

export type { StorageConfiguration } from "./schema";
