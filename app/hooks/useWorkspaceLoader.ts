import { useMatches } from "@remix-run/react";
import type { QueueRecord, SettingRecord, UserRecord } from "~/database";

export function useWorkspaceLoader() {
  const match = useMatches().find(
    (m) => m.id === "routes/_authenticated+/_layout"
  );
  if (!match) {
    throw new Error(
      "To `useWorkspaceLoader` you must be within the workspace context"
    );
  }
  return match.data as {
    user: UserRecord;
    settings: SettingRecord;
    queue: QueueRecord[];
  };
}
