import { db, eq, insertFileSchema, schema } from "~/database";
import { protectedProcedure, router } from "~/trpc/trpc.server";
import { z } from "zod";

export const fileRouter = router({
  all: protectedProcedure.query(async () => {
    return await db.query.files.findMany();
  }),
  create: protectedProcedure
    .input(
      insertFileSchema
        .omit({ owner_id: true })
        .extend({ options: z.record(z.any()).optional() })
    )
    .mutation(async ({ ctx, input }) => {
      const [file] = await db
        .insert(schema.files)
        .values({
          ...input,
          owner_id: ctx.user.id,
        })
        .returning();
      return file;
    }),
  remove: protectedProcedure.input(z.string()).mutation(async ({ input }) => {
    await db.delete(schema.files).where(eq(schema.files.id, input));
    return true;
  }),
});
