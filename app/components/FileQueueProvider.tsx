import { QueueRecord } from "~/database";
import React, { createContext, useContext, useEffect, useState } from "react";
import { trpc } from "~/lib/trpc";
import PgBoss from "pg-boss";

interface FileQueueContextType {
  queue: PgBoss.Job[];
}

const FileQueueContext = createContext<FileQueueContextType | undefined>(
  undefined
);

export function FileQueueProvider({
  queue: initialQueue,
  children,
}: {
  queue: PgBoss.Job[];
  children: React.ReactNode;
}) {
  const [refetchInterval, setRefetchInterval] = useState<number | false>(2000);
  const utils = trpc.useUtils();
  const { data: queue } = trpc.queue.pending.useQuery(undefined, {
    initialData: initialQueue,
    refetchInterval: false,
  });
  const { mutate: runQueue } = trpc.queue.run.useMutation({
    async onSettled() {
      await utils.queue.invalidate();
    },
  });

  // useEffect(() => {
  //   if (queue.length > 0) {
  //     setRefetchInterval(2000);
  //     runQueue();
  //   } else {
  //     setRefetchInterval(false);
  //   }
  // }, [queue, runQueue]);

  return (
    <FileQueueContext.Provider value={{ queue }}>
      {children}
    </FileQueueContext.Provider>
  );
}

export const useFileQueue = () => {
  const context = useContext(FileQueueContext);
  if (context === undefined) {
    throw new Error("useFileQueue must be used within a FileQueueProvider");
  }
  return context;
};
