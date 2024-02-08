import {
  db,
  eq,
  insertQueueSchema,
  schema,
  selectQueueSchema,
  sql,
} from "~/database";
import { protectedProcedure, router } from "../trpc.server";
import { z } from "zod";
import PgBoss from "pg-boss";

const createSchema = z.discriminatedUnion("name", [
  z.object({
    name: z.literal("welcome_email"),
    data: z.object({
      email: z.string(),
    }),
  }),
  z.object({
    name: z.literal("process_geojson"),
    data: z
      .object({
        fileId: z.string(),
      })
      .and(
        z
          .object({
            name: z.string(),
            attribution: z.string(),
            description: z.string(),
            projection: z.string(),
            layer: z.string(),
            maximum_zoom: z.string(),
            minimum_zoom: z.string(),
            zg: z.boolean().default(true),
            drop_densest_as_needed: z.boolean(),
            extend_zooms_if_still_dropping: z.boolean(),
            coalesce_densest_as_needed: z.boolean(),
            smallest_maximum_zoom_guess: z.boolean(),
          })
          .partial()
      ),
  }),
]);

export const queueRouter = router({
  all: protectedProcedure.query(async () => {
    const queue = await db.execute(
      sql`select * from pgboss.job where name not ilike '__pgboss%'`
    );
    return queue as unknown as PgBoss.Job[];
  }),
  pending: protectedProcedure.query(async () => {
    const queue = await db.execute(
      sql`select * from pgboss.job where state != 'completed' and name not ilike '__pgboss%'`
    );
    return queue as unknown as PgBoss.Job[];
  }),
  run: protectedProcedure
    .input(z.string().optional())
    .mutation(async ({ input }) => {
      const queue = await db.query.queue.findFirst({
        where(fields, { eq }) {
          return input ? eq(fields.id, input) : eq(fields.status, "pending");
        },
        orderBy(fields, { asc }) {
          return asc(fields.created_at);
        },
      });
      if (!queue) return;
      if (!queue.payload) return;

      const file = await db.query.files.findFirst({
        where(fields, { eq }) {
          return eq(fields.id, queue.payload!.fileId);
        },
      });
      await db
        .update(schema.queue)
        .set({
          status: !file ? "failed" : "processing",
          payload: {
            ...queue.payload,
            error: "No file found",
          },
        })
        .where(eq(schema.queue.id, queue.id));
      if (!file) return;
      // run
      let endpoint: string = "";
      const ext = file.key.split(".").pop()!;
      switch (ext) {
        case "geojson":
          endpoint = "tippecanoe";
          break;
        case "mbtile":
          endpoint = "mbtile";
          break;
        case "pmtile":
          endpoint = "pmtile";
          break;
      }
      const res = await fetch(`http://localhost:3001/${endpoint}`, {
        method: "post",
        body: JSON.stringify({
          from_file: file.key,
          on_complete: `http://localhost:5173/webhooks/queue/${queue.id}`,
          ...queue.payload,
        }),
      });

      await db
        .update(schema.queue)
        .set({
          status: res.ok ? "completed" : "failed",
          payload: {
            ...queue.payload,
            ...(!res.ok ? { error: "Error running process" } : {}),
          },
        })
        .where(eq(schema.queue.id, queue.id));

      return true;
    }),
  create: protectedProcedure
    .input(createSchema)
    .mutation(async ({ ctx, input }) => {
      ctx.jobs.emit(input.name, input.data);

      return true;
    }),
  update: protectedProcedure
    .input(selectQueueSchema.omit({ created_at: true, updated_at: true }))
    .mutation(async ({ input }) => {
      const [queue] = await db
        .update(schema.queue)
        .set({
          ...input,
        })
        .where(eq(schema.queue.id, input.id))
        .returning();
      return queue;
    }),
});
