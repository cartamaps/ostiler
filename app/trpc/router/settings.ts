import { db, eq, schema, selectSettingSchema } from "~/database";
import { protectedProcedure, router } from "~/trpc/trpc.server";

export const settingsRouter = router({
  get: protectedProcedure.query(async () => {
    let settings = await db.query.settings.findFirst();
    if (!settings) {
      [settings] = await db
        .insert(schema.settings)
        .values({
          storage: null,
        })
        .returning();
    }
    return settings;
  }),
  update: protectedProcedure
    .input(selectSettingSchema.omit({ created_at: true, updated_at: true }))
    .mutation(async ({ input }) => {
      return await db
        .update(schema.settings)
        .set(input)
        .where(eq(schema.settings.id, input.id))
        .returning();
    }),
});
