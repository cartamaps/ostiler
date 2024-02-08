import type PgBoss from "pg-boss";
import type { Job } from "./types";
import type { WelcomeEmailJob } from "./welcome-email";
import type { ProcessGeoJsonJob } from "./process-geojson";
import { BaseJob } from "./base";

type JobTypeMapping = {
  welcome_email: WelcomeEmailJob;
  process_geojson: ProcessGeoJsonJob;
};

export class JobManager {
  private readonly boss: PgBoss;
  private jobs = new Map<string, BaseJob<any>>();

  constructor(boss: PgBoss) {
    this.boss = boss;
  }

  register(job: new (boss: PgBoss) => BaseJob<any>): JobManager {
    const jobInstance = new job(this.boss);
    this.jobs.set(jobInstance.type, jobInstance);
    return this;
  }

  async start(): Promise<void> {
    await this.boss.start();
    for (const job of this.jobs.values()) {
      await job.start();
    }
  }

  async emit<K extends keyof JobTypeMapping>(
    jobName: K,
    data: Parameters<JobTypeMapping[K]["emit"]>[0]
  ): Promise<void> {
    const job = this.jobs.get(jobName);
    if (job === undefined) {
      throw new Error(`No job registered with the name ${jobName}`);
    }
    await job.emit(data);
  }
}
