import { LoaderFunctionArgs, redirect } from "@remix-run/node";

export async function loader({ context }: LoaderFunctionArgs) {
  context.destroySession();
  return redirect("/sign-in", {});
}
