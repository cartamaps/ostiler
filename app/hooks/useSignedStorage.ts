import { useMutation } from "@tanstack/react-query";

export function useSignedStorage() {
  return useMutation({
    mutationFn: async ({ url, file }: { url: string; file: File }) => {
      return await fetch(url, {
        method: "PUT",
        body: await file.arrayBuffer(),
      });
    },
  });
}
