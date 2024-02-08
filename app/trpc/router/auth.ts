import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../trpc.server";
import { db, schema } from "~/database";
import { SESSION_KEYS } from "~/constants";
import jwt from "jsonwebtoken";
import { createHash } from "crypto";
import {
  createHashPassword,
  validateHashPassword,
} from "~/lib/hash-password.server";

const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export const authRouter = router({
  signIn: publicProcedure
    .input(signInSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where(fields, { eq }) {
          return eq(fields.email, input.email);
        },
      });
      if (!user) {
        throw new Error("Incorrect credentials");
      }

      const valid = await validateHashPassword(input.password, user.password);
      if (!valid) {
        throw new Error("Incorrect credentials");
      }

      const token = jwt.sign({ sub: user.id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
      });
      ctx.setSession(SESSION_KEYS.auth, token);
      return user;
    }),
  signUp: publicProcedure
    .input(signInSchema)
    .mutation(async ({ ctx, input }) => {
      const user = await db.query.users.findFirst({
        where(fields, { eq }) {
          return eq(fields.email, input.email);
        },
      });
      if (user) {
        throw new Error("Email already exist");
      }
      const gravatarHash = createHash("sha256")
        .update(input.email)
        .digest("hex");
      const [newUser] = await db
        .insert(schema.users)
        .values({
          ...input,
          password: await createHashPassword(input.password),
          avatar_url: `https://www.gravatar.com/avatar/${gravatarHash}`,
        })
        .returning();

      const token = jwt.sign({ sub: newUser.id }, process.env.JWT_SECRET, {
        expiresIn: "30d",
      });
      ctx.setSession(SESSION_KEYS.auth, token);
      return newUser;
    }),
  signOut: protectedProcedure.mutation(async ({ ctx }) => {
    ctx.destroySession();
    return true;
  }),
});
