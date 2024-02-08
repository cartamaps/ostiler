import { json } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import { sql } from "drizzle-orm";
import type PgBoss from "pg-boss";
import { db } from "~/database";

export async function loader() {
  const queue = await db.execute(
    sql`select * from pgboss.job where name not ilike '__pgboss%' order by createdon desc`
  );

  return json({
    queue: queue as unknown as PgBoss.Job[],
  });
}

export default function Route() {
  const { queue } = useLoaderData<typeof loader>();

  return (
    <div>
      <pre>{JSON.stringify(queue, null, 2)}</pre>
    </div>
  );
}
