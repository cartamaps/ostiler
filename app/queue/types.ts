import type PgBoss from "pg-boss";

export type JobType = "welcome_email" | "process_geojson";

export interface Job<T extends object> {
  type: JobType;
  options: PgBoss.SendOptions;
  start: () => Promise<void>;
  work: (job: PgBoss.Job<T>) => Promise<void>;
  emit: (data: T) => Promise<void>;
}
