import { useForm, zodResolver } from "@mantine/form";
import { useRevalidator } from "@remix-run/react";
import { SettingRecord } from "~/database";
import { FormField, Input, Button, toast } from "~/components/ui";
import { IconLoader2 } from "@tabler/icons-react";
import { z } from "zod";
import { trpc } from "~/lib/trpc";

type StorageFormProps = {
  settings: SettingRecord;
};
const storageFormSchema = z.object({
  provider: z.literal("cloudflare"),
  region: z.string().optional().default("auto"),
  accountId: z.string(),
  accessKeyId: z.string(),
  secretAccessKey: z.string(),
  bucket: z.string(),
});
type StorageFormValues = z.infer<typeof storageFormSchema>;

export function StorageForm({ settings }: StorageFormProps) {
  const utils = trpc.useUtils();
  const revalidator = useRevalidator();
  const updateSettings = trpc.settings.update.useMutation({
    async onSuccess() {
      await utils.settings.get.invalidate();
      revalidator.revalidate();
      toast({
        title: "Storage settings updated",
      });
    },
  });
  const form = useForm<StorageFormValues>({
    validate: zodResolver(storageFormSchema),
    initialValues: {
      provider: settings.storage?.provider ?? ("cloudflare" as const),
      region: settings.storage?.region ?? "auto",
      accountId: settings.storage?.accountId ?? "",
      accessKeyId: settings.storage?.accessKeyId ?? "",
      secretAccessKey: settings.storage?.secretAccessKey ?? "",
      bucket: settings.storage?.bucket ?? "",
    },
  });

  const onSubmit = (values: StorageFormValues) => {
    updateSettings.mutate({
      id: settings.id,
      storage: {
        ...values,
      },
    });
  };

  return (
    <form className="flex flex-col gap-y-6" onSubmit={form.onSubmit(onSubmit)}>
      <FormField
        label="Provider"
        type="text"
        readOnly
        {...form.getInputProps("provider")}
        render={(field) => <Input {...field} />}
      />
      <FormField
        label="Account ID"
        type="text"
        {...form.getInputProps("accountId")}
        render={(field) => <Input {...field} />}
      />
      <div className="grid grid-cols-2 gap-6">
        <FormField
          label="Bucket"
          type="text"
          {...form.getInputProps("bucket")}
          render={(field) => <Input {...field} />}
        />
        <FormField
          label="Region"
          type="text"
          {...form.getInputProps("region")}
          render={(field) => <Input {...field} />}
        />
      </div>

      <div className="grid grid-cols-2 gap-6">
        <FormField
          label="Access Key ID"
          type="text"
          {...form.getInputProps("accessKeyId")}
          render={(field) => <Input {...field} />}
        />
        <FormField
          label="Access Key Secret"
          type="password"
          {...form.getInputProps("secretAccessKey")}
          render={(field) => <Input {...field} />}
        />
      </div>
      <div>
        <Button disabled={updateSettings.isPending}>
          {updateSettings.isPending && (
            <IconLoader2 className="animate-spin mr-3" />
          )}
          Save
        </Button>
      </div>
    </form>
  );
}
