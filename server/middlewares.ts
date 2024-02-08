import { createMiddleware } from "hono/factory";
import { pathToRegexp } from "path-to-regexp";
import { getSession } from "remix-hono/session";
import jwt from "jsonwebtoken";
import { SESSION_KEYS, type SessionData } from "~/constants";
import { UserSession } from "~/types";

/**
 * Cache middleware
 *
 * @param seconds - The number of seconds to cache
 */
export function cache(seconds: number) {
  return createMiddleware(async (c, next) => {
    if (!c.req.path.match(/\.[a-zA-Z0-9]+$/)) {
      return next();
    }

    await next();

    if (!c.res.ok) {
      return;
    }

    c.res.headers.set("cache-control", `public, max-age=${seconds}`);
  });
}

function pathMatch(paths: string[], requestPath: string) {
  for (const path of paths) {
    const regex = pathToRegexp(path);

    if (regex.test(requestPath)) {
      return true;
    }
  }

  return false;
}

export function protect({
  publicRoutes,
  redirectTo,
}: {
  publicRoutes: string[];
  redirectTo: string;
}) {
  return createMiddleware(async (c, next) => {
    const isPublic = pathMatch(publicRoutes, c.req.path);

    if (isPublic) {
      return next();
    }

    const session = getSession<SessionData>(c);
    const token = session.get(SESSION_KEYS.auth);
    if (!token) {
      return c.redirect(`${redirectTo}?redirectTo=${c.req.path}`);
    }

    let userSession: UserSession | null = null;
    try {
      userSession = jwt.verify(token, process.env.JWT_SECRET) as UserSession;
    } catch (error) {
      //
    }

    if (!userSession) {
      return c.redirect(`${redirectTo}?redirectTo=${c.req.path}`);
    }

    return next();
  });
}
