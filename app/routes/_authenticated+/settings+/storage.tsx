import type { MetaFunction } from "@remix-run/node";
import { Separator } from "~/components/ui";
import { trpc } from "~/lib/trpc";
import { useWorkspaceLoader } from "~/hooks/useWorkspaceLoader";
import { StorageForm } from "~/components/StorageForm";

export const meta: MetaFunction = () => {
  return [{ title: "Storage | OSSTiler" }];
};

export default function Route() {
  const { settings } = useWorkspaceLoader();
  const { data } = trpc.settings.get.useQuery(undefined, {
    initialData: settings,
  });

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-8xl font-bold tracking-tighter leading-none">
          storage
        </h3>
      </div>
      <Separator />
      <div className="max-w-screen-sm">
        <StorageForm settings={data} />
      </div>
    </div>
  );
}
