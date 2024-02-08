import { z } from "zod";
import { protectedProcedure, router } from "../trpc.server";
import { db } from "~/database";
import { StorageAdapter } from "~/lib/storage.server";

export const storageRouter = router({
  put: protectedProcedure
    .input(z.object({ key: z.string() }))
    .mutation(async ({ input }) => {
      const settings = await db.query.settings.findFirst();
      if (!settings || !settings.storage) {
        throw new Error("No storage settings found");
      }
      const { storage } = settings;
      const adapter = new StorageAdapter(
        {
          endpoint: `https://${storage.accountId}.r2.cloudflarestorage.com`,
          region: storage.region ?? "auto",
          credentials: {
            accessKeyId: storage.accessKeyId,
            secretAccessKey: storage.secretAccessKey,
          },
        },
        storage.bucket
      );
      return await adapter.signedPut(input.key);
    }),
});
