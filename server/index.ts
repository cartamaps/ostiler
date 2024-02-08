import path from "path";
import { fileURLToPath } from "url";
import type { ServerBuild, Session, AppLoadContext } from "@remix-run/node";
import { broadcastDevReady, installGlobals } from "@remix-run/node";
import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { logger } from "hono/logger";
import { serveStatic } from "@hono/node-server/serve-static";
import { getSession, getSessionStorage, session } from "remix-hono/session";
import { remix } from "remix-hono/handler";
import closeWithGrace from "close-with-grace";
import { cache, protect } from "./middlewares";
import { SESSION_KEYS, SessionData } from "~/constants";
import { sessionStorage } from "~/lib/session.server";
import { initQueue } from "~/queue";
import type { JobManager } from "~/queue/manager";

installGlobals();

const BUILD_PATH = "../build/index.js";
const WATCH_PATH = "../build/version.txt";

const mode =
  process.env.NODE_ENV === "test" ? "development" : process.env.NODE_ENV;
const isProductionMode = mode === "production";

/**
 * Initial build
 * @type {ServerBuild}
 */
const build = await import(BUILD_PATH);
let devBuild = build;

const app = new Hono();
const { jobs } = await initQueue();

/**
 * Serve assets files from build/client/assets
 */
app.use(
  "/build",
  cache(60 * 60 * 24 * 365), // 1 year
  serveStatic({ root: "./public/build" })
);

/**
 * Serve public files
 */
app.use("*", cache(60 * 60), serveStatic({ root: "./public" })); // 1 hour

/**
 * Add logger middleware
 */
app.use("*", logger());

/**
 * Add session middleware (https://github.com/sergiodxa/remix-hono?tab=readme-ov-file#session-management)
 */
app.use(
  session({
    autoCommit: true,
    createSessionStorage() {
      if (!process.env.SESSION_SECRET) {
        throw new Error("SESSION_SECRET is not defined");
      }

      return {
        ...sessionStorage,
        // If a user doesn't come back to the app within 30 days, their session will be deleted.
        async commitSession(session) {
          return sessionStorage.commitSession(session, {
            maxAge: 60 * 60 * 24 * 30, // 30 days
          });
        },
      };
    },
  })
);

app.use(
  protect({
    publicRoutes: ["/sign-in", "/sign-up", "/auth-error", "/api/trpc/:path"],
    redirectTo: "/sign-in",
  })
);

/**
 * Add remix middleware to Hono server
 */
app.use(async (c, next) => {
  return remix({
    build: isProductionMode ? build : devBuild,
    mode,
    async getLoadContext(c) {
      const sessionStorage = getSessionStorage(c);
      const session = getSession<SessionData>(c);
      return {
        appVersion: isProductionMode ? build.assets.version : "dev",
        sessionStorage,
        session,
        jobs,
        getAuthSession: () => {
          return session.get(SESSION_KEYS.auth);
        },
        setSession: (name: SESSION_KEYS, value: string) => {
          session.set(name, value);
        },
        destroySession: () => {
          session.unset(SESSION_KEYS.auth);
        },
      } satisfies AppLoadContext;
    },
  })(c, next);
});

/**
 * Start the production server
 */

const server = serve(
  {
    ...app,
    port: Number(process.env.PORT) || 3000,
  },
  async (info) => {
    console.log(`🚀 Server started on port ${info.port}`);

    if (!isProductionMode) {
      broadcastDevReady(build);
    }
  }
);

closeWithGrace(async () => {
  await new Promise((resolve, reject) => {
    server.close((e) => (e ? reject(e) : resolve("ok")));
  });
});

if (!isProductionMode) {
  async function reloadBuild() {
    devBuild = await import(`${BUILD_PATH}?update=${Date.now()}`);
    broadcastDevReady(devBuild);
  }

  // We'll import chokidar here so doesn't get bundled in production.
  const chokidar = await import("chokidar");

  const dirname = path.dirname(fileURLToPath(import.meta.url));
  const watchPath = path.join(dirname, WATCH_PATH).replace(/\\/g, "/");

  const buildWatcher = chokidar
    .watch(watchPath, { ignoreInitial: true })
    .on("add", reloadBuild)
    .on("change", reloadBuild);

  closeWithGrace(() => buildWatcher.close());
}

export default app;

/**
 * Declare our loaders and actions context type
 */
declare module "@remix-run/node" {
  interface AppLoadContext {
    /**
     * The app version from the build assets
     */
    readonly appVersion: string;
    readonly session: Session<SessionData>;
    readonly jobs: JobManager;
    getAuthSession(): SessionData["__osstiler-auth"];
    setSession(name: SESSION_KEYS, value: unknown): void;
    destroySession(): void;
  }
}
