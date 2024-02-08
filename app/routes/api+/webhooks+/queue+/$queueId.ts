import { ActionFunctionArgs } from "@remix-run/node";
import { db, eq, schema } from "~/database";

export async function action({ request, params }: ActionFunctionArgs) {
  const queue = await db.query.queue.findFirst({
    where(fields, { eq }) {
      return eq(fields.id, params.queueId as string);
    },
  });
  if (!queue) return { ok: true };

  const payload = await request.json();
  console.log(payload);
  // write to tiles

  await db
    .update(schema.queue)
    .set({
      status: "completed",
      payload: {
        ...queue.payload,
      },
    })
    .where(eq(schema.queue.id, queue.id));

  return { ok: true };
}
