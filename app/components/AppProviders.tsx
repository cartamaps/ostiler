import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { trpc } from "~/lib/trpc";
import * as SuperJSON from "superjson";
import { httpBatchLink } from "@trpc/react-query";
import { UserRecord } from "~/database";
import { UserSession } from "~/types";

export function AppProviders({
  session,
  initialUser,
  children,
}: {
  session: UserSession | null;
  initialUser: UserRecord | null | undefined;
  children: React.ReactNode;
}) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `/api/trpc`,
          transformer: SuperJSON,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
