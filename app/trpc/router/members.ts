import { z } from "zod";
import { router, protectedProcedure } from "~/trpc/trpc.server";

export const memberRouter = router({
  all: protectedProcedure.query(async ({ ctx }) => {
    return [];
  }),
  update: protectedProcedure.input(z.any()).mutation(async ({ ctx, input }) => {
    return true;
  }),
  remove: protectedProcedure.input(z.any()).mutation(async ({ ctx, input }) => {
    return true;
  }),
});
