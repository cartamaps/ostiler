import maplibre_stylesheet from "maplibre-gl/dist/maplibre-gl.css";

import { LinksFunction, LoaderFunctionArgs, json } from "@remix-run/node";
import { Outlet, useLoaderData } from "@remix-run/react";
import { db, schema, sql } from "~/database";
import { FileQueueProvider } from "~/components/FileQueueProvider";
import { requireAuthUser } from "~/lib/session.server";
import type PgBoss from "pg-boss";

export const links: LinksFunction = () => [
  { rel: "preload", href: maplibre_stylesheet, as: "style" },
  { rel: "stylesheet", href: maplibre_stylesheet },
];

export async function loader({ request, context }: LoaderFunctionArgs) {
  const { user } = await requireAuthUser(request, context.session);

  let settings = await db.query.settings.findFirst();
  if (!settings) {
    [settings] = await db
      .insert(schema.settings)
      .values({
        storage: null,
      })
      .returning();
  }

  const queue = await db.execute(
    sql`select * from pgboss.job where state != 'completed' and name not ilike '__pgboss%'`
  );

  return json({
    user,
    settings,
    queue: queue as unknown as PgBoss.Job[],
  });
}

export default function WorkspaceLayout() {
  const { queue } = useLoaderData<typeof loader>();

  return (
    <FileQueueProvider queue={queue}>
      <Outlet />
    </FileQueueProvider>
  );
}
