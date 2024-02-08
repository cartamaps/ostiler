import { publicProcedure, router } from "~/trpc/trpc.server";
import { userRouter } from "./user";
import { inviteRouter } from "./invite";
import { memberRouter } from "./members";
import { authRouter } from "./auth";
import { storageRouter } from "./storage";
import { settingsRouter } from "./settings";
import { fileRouter } from "./files";
import { queueRouter } from "./queue";

export const appRouter = router({
  healthcheck: publicProcedure.query(() => "yay!"),
  auth: authRouter,
  users: userRouter,
  invites: inviteRouter,
  members: memberRouter,
  storage: storageRouter,
  settings: settingsRouter,
  files: fileRouter,
  queue: queueRouter,
});

// Export only the type of a router!
// This prevents us from importing server code on the client.
export type AppRouter = typeof appRouter;
