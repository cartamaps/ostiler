import { z } from "zod";
import { SESSION_KEYS } from "~/constants";
import {
  protectedProcedure,
  publicProcedure,
  router,
} from "~/trpc/trpc.server";
import { db, eq, schema } from "~/database";
import { createHashPassword } from "~/lib/hash-password.server";

export const userRouter = router({
  me: protectedProcedure.query(async ({ ctx }) => {
    const user = await db.query.users.findFirst({
      where(fields, { eq }) {
        return eq(fields.id, ctx.user.id);
      },
    });
    return user;
  }),
  update: protectedProcedure.input(z.any()).mutation(async ({ ctx, input }) => {
    const [user] = await db
      .update(schema.users)
      .set({
        email: input.email,
        full_name: input.full_name,
      })
      .where(eq(schema.users.id, ctx.user.id))
      .returning();
    return user;
  }),
  updatePreferences: protectedProcedure
    .input(z.any())
    .mutation(async ({ ctx, input }) => {
      const [user] = await db
        .update(schema.users)
        .set({
          preferences: {
            ...ctx.user.preferences,
            ...input.preferences,
          },
        })
        .where(eq(schema.users.id, ctx.user.id))
        .returning();

      ctx.setSession(SESSION_KEYS.theme, user.preferences!.theme);

      return user;
    }),
  password: protectedProcedure
    .input(z.object({ new_password: z.string().min(8) }))
    .mutation(async ({ ctx, input }) => {
      const [user] = await db
        .update(schema.users)
        .set({
          password: await createHashPassword(input.new_password),
        })
        .where(eq(schema.users.id, ctx.user.id))
        .returning();
      return user;
    }),
  create: publicProcedure
    .input(
      z.object({
        email: z.string().email(),
        password: z.string().min(8),
      })
    )
    .mutation(async ({ input }) => {
      const [user] = await db
        .insert(schema.users)
        .values({
          email: input.email,
          password: input.password,
        })
        .returning();

      return user;
    }),
});
