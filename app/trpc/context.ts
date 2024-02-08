import { AppLoadContext } from "@remix-run/node";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";
import { combineHeaders } from "~/lib/merge-headers.server";
import { getAuthUser } from "~/lib/session.server";

export async function createContext({
  req,
  resHeaders,
  context,
}: FetchCreateContextFnOptions & { context: AppLoadContext }) {
  const { user } = await getAuthUser(context.session);
  const res = new Response();

  return {
    req,
    res: {
      ...res,
      headers: combineHeaders(resHeaders, res.headers),
    },
    user,
    ...context,
  };
}
export type Context = Awaited<ReturnType<typeof createContext>>;
