import type PgBoss from "pg-boss";
import { BaseJob } from "./base";

export type WelcomeEmail = { email: string };
export class WelcomeEmailJob extends BaseJob<WelcomeEmail> {
  readonly type = "welcome_email";

  async work(job: PgBoss.Job<WelcomeEmail>): Promise<void> {
    console.log(`[WelcomeEmailJob] Sent welcome email to ${job.data.email}!`);
  }
}
