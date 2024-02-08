import { TRPCError, initTRPC } from "@trpc/server";
import * as SuperJSON from "superjson";
import { ZodError } from "zod";
import type { Context } from "./context";

// You can use any variable name you like.
// We use t to keep things simple.
export const t = initTRPC.context<Context>().create({
  transformer: SuperJSON,
  errorFormatter({ shape, error }) {
    // TODO: sentry for internal server errors
    // if (error.cause instanceof ZodError) {
    //   console.log(error.cause.format().data.name)
    // }

    return {
      ...shape,
      data: {
        ...shape.data,
        formError: !(error.cause instanceof ZodError)
          ? error.code === "INTERNAL_SERVER_ERROR"
            ? "There was an error processing your request."
            : error.message
          : undefined,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});
export const router = t.router;
export const middleware = t.middleware;
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.user) throw new TRPCError({ code: "UNAUTHORIZED" });
  return next({ ctx: { user: ctx.user } });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);
