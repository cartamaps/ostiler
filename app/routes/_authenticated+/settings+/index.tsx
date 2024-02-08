import type { MetaFunction } from "@remix-run/node";
import { AccountForm } from "~/components/AccountForm";
import { Separator } from "~/components/ui";
import { trpc } from "~/lib/trpc";
import { useWorkspaceLoader } from "~/hooks/useWorkspaceLoader";

export const meta: MetaFunction = () => {
  return [{ title: "Your Account | Carta Maps" }];
};

export default function Route() {
  const { user } = useWorkspaceLoader();
  const { data } = trpc.users.me.useQuery(undefined, {
    initialData: user,
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-8xl font-bold tracking-tighter leading-none">
          personal
        </h3>
      </div>
      <Separator />
      <div className="max-w-screen-sm">
        {data && <AccountForm key={data.id} user={data} />}
      </div>
    </div>
  );
}
