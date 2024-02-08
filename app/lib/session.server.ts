import { Session, createCookieSessionStorage, redirect } from "@remix-run/node";
import jwt from "jsonwebtoken";
import { SESSION_KEYS } from "~/constants";
import { db } from "~/database";
import { UserSession } from "~/types";

export const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: "__osstiler",
    httpOnly: true,
    path: "/",
    sameSite: "lax",
    secrets: [process.env.SESSION_SECRET],
    secure: process.env.NODE_ENV === "production",
  },
});

export async function getAuthUser(session: Session) {
  const token = session.get(SESSION_KEYS.auth);

  let userSession: UserSession | null = null;
  try {
    userSession = jwt.verify(token, process.env.JWT_SECRET) as UserSession;
  } catch (error) {
    //
  }

  const user = userSession
    ? await db.query.users.findFirst({
        where(fields, { eq }) {
          return eq(fields.id, userSession!.sub);
        },
      })
    : null;

  return {
    userSession,
    user,
  };
}

export async function requireAuthUser(request: Request, session: Session) {
  console.log("require auth user");
  const { userSession, user } = await getAuthUser(session);

  const { pathname } = new URL(request.url);
  const redirectTo = [`/sign-in`];
  if (pathname !== "/" && pathname !== "/sign-in") {
    redirectTo.push(`?redirectTo=${pathname}`);
  }

  if (!userSession || !user) {
    throw redirect(redirectTo.join(""));
  }

  return {
    session,
    user,
  };
}
