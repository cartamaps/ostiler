import PgBoss from "pg-boss";
import { JobManager } from "~/queue/manager";
import { WelcomeEmailJob } from "~/queue/welcome-email";
import { ProcessGeoJsonJob } from "./process-geojson";

export async function initQueue() {
  console.log("initQueue called");
  const boss = new PgBoss(process.env.DATABASE_URL);
  const jobs = new JobManager(boss)
    .register(WelcomeEmailJob)
    .register(ProcessGeoJsonJob);

  await jobs.start();

  return {
    boss,
    jobs,
  };
}
