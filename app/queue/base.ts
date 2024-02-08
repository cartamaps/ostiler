import type PgBoss from "pg-boss";
import type { Job, JobType } from "./types";

export abstract class BaseJob<T extends object> implements Job<T> {
  public boss: PgBoss;
  abstract readonly type: JobType;
  readonly options = { retryLimit: 3, retryDelay: 1000 };

  constructor(boss: PgBoss) {
    this.boss = boss;
  }

  async start(): Promise<void> {
    await this.boss.work(this.type, this.work.bind(this));
  }

  abstract work(job: PgBoss.Job<T>): Promise<void>;

  async emit(data: T): Promise<void> {
    await this.boss.send(this.type, data, this.options);
  }
}
