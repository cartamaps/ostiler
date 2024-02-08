import { z } from "zod";
import { router, protectedProcedure } from "~/trpc/trpc.server";

export const inviteRouter = router({
  accept: protectedProcedure
    .input(z.string())
    .mutation(async ({ ctx, input }) => {
      // const { data, error } = await ctx.supabase.rpc("accept_invitation", {
      //   lookup_invitation_token: input,
      // });
      // if (error) throw error;
      // return data;
      return true;
    }),
});
