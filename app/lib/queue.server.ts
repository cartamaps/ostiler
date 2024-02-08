import PgBoss from "pg-boss";
import { JobManager } from "~/queue/manager";
import { WelcomeEmailJob } from "~/queue/welcome-email";

export function createBoss() {
  const boss = new PgBoss(process.env.DATABASE_URL);
  const jobs = new JobManager(boss).register(WelcomeEmailJob);

  return {
    boss,
    jobs,
  };
}
