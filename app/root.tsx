import tailwind_stylesheet from "~/tailwind.css";
import { cssBundleHref } from "@remix-run/css-bundle";
import type { LinksFunction, LoaderFunctionArgs } from "@remix-run/node";
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  isRouteErrorResponse,
  useLoaderData,
  useRouteError,
} from "@remix-run/react";
import { getAuthUser } from "./lib/session.server";
import { UserRecord } from "./database";
import { AppProviders } from "./components/AppProviders";
import { cn } from "./lib/utils";
import { Button, Toaster } from "./components/ui";

export const links: LinksFunction = () => [
  { rel: "preload", href: tailwind_stylesheet, as: "style" },
  ...(cssBundleHref
    ? [{ rel: "preload", href: cssBundleHref, as: "style" }]
    : []),

  { rel: "stylesheet", href: tailwind_stylesheet },
  ...(cssBundleHref ? [{ rel: "stylesheet", href: cssBundleHref }] : []),
];

export async function loader({ context }: LoaderFunctionArgs) {
  const { userSession, user } = await getAuthUser(context.session);

  return {
    session: userSession,
    user,
    theme: user?.preferences?.theme ?? "light",
  };
}

export default function App() {
  const { session, user, theme } = useLoaderData<typeof loader>();

  return (
    <AppProviders session={session} initialUser={user}>
      <Document theme={theme}>
        <Outlet />
        <script
          dangerouslySetInnerHTML={{
            __html: `window.env = ${JSON.stringify({})}`,
          }}
        />
      </Document>
    </AppProviders>
  );
}

function Document({
  theme,
  children,
}: {
  theme: UserRecord["preferences"]["theme"];
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning={true}
      className={cn(theme === "dark" && "dark")}
    >
      <head>
        <meta charSet="utf-8" />
        <meta
          name="viewport"
          content="width=device-width,initial-scale=1,maximum-scale=1,viewport-fit=cover"
        />
        <Meta />
        <Links />
      </head>
      <body className="">
        {children}
        <Toaster />
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  );
}

export function ErrorBoundary() {
  const error = useRouteError();

  const renderErrorMarkup = () => {
    if (isRouteErrorResponse(error)) {
      return (
        <>
          <div className="flex items-center gap-x-2 text-sm text-primary uppercase tracking-wider font-medium mb-8 border px-2 py-1.5 rounded-md bg-background border-primary">
            <span className="h-2 w-2 rounded-full bg-primary overflow-hidden"></span>
            <p>{error.status} error</p>
          </div>
          <h1 className="text-7xl font-sans font-semibold mb-8 leading-none">
            {error.status === 404
              ? "We can't find that page"
              : "Sorry, something went wrong."}
          </h1>
          <p className="text-lg text-muted-foreground mb-12">
            {error.statusText
              ? error.statusText
              : "Sorry, the page you are looking for doesn't exist or has been moved."}
          </p>
          <Button asChild>
            <a href="/">
              <div className="h-full flex items-center justify-center font-bold">
                Back Home
              </div>
            </a>
          </Button>
        </>
      );
    }

    let errorMessage: string = "Unknown error";
    if (error instanceof Error && "message" in error) {
      errorMessage = error.message as string;
    }

    return (
      <>
        <div className="flex items-center gap-x-2 text-sm text-primary uppercase tracking-wider font-medium mb-8 border px-2 py-1.5 rounded-md bg-background border-primary">
          <span className="h-2 w-2 rounded-full bg-primary overflow-hidden"></span>
          <p>Oh No</p>
        </div>
        <h1 className="text-7xl font-sans font-semibold mb-4">
          Sorry, something went wrong.
        </h1>
        <p className="text-lg text-muted-foreground mb-8">{errorMessage}</p>
        <Button asChild>
          <a href="/">
            <div className="h-full flex items-center justify-center font-bold">
              Back Home
            </div>
          </a>
        </Button>
      </>
    );
  };

  return (
    <html lang="en" suppressHydrationWarning={true} className={""}>
      <head>
        <title>Oops!</title>
        <Meta />
        <Links />
      </head>
      <body className="h-screen w-screen bg-muted flex items-center justify-start">
        <div className="container max-w-screen-md flex flex-col items-start">
          {renderErrorMarkup()}
        </div>
        <Scripts />
      </body>
    </html>
  );
}
