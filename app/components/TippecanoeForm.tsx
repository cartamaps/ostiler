import { useForm, zodResolver } from "@mantine/form";
import { Checkbox, FormField, Input, Label } from "~/components/ui";
import { useEffect } from "react";
import { z } from "zod";

const formSchema = z.object({
  name: z.string(),
  attribution: z.string(),
  description: z.string(),
  projection: z.string(),
  layer: z.string(),
  maximum_zoom: z.string(),
  minimum_zoom: z.string(),
  zg: z.boolean().default(true),
  drop_densest_as_needed: z.boolean(),
  extend_zooms_if_still_dropping: z.boolean(),
  coalesce_densest_as_needed: z.boolean(),
  smallest_maximum_zoom_guess: z.boolean(),
});
export type FormValues = z.infer<typeof formSchema>;

export function TippecanoeForm({
  defaultValues,
  onValuesChange,
}: {
  defaultValues?: Partial<FormValues>;
  onValuesChange?: (values: FormValues) => void;
}) {
  const form = useForm<FormValues>({
    validate: zodResolver(formSchema),
    initialValues: {
      name: defaultValues?.name ?? "", // Optional[str]
      attribution: defaultValues?.attribution ?? "", // Optional[str]
      description: defaultValues?.description ?? "", // Optional[str]
      projection: defaultValues?.projection ?? "", // Optional[str]
      layer: defaultValues?.layer ?? "", // Optional[str]
      maximum_zoom: defaultValues?.maximum_zoom ?? "", // Optional[str]
      minimum_zoom: defaultValues?.minimum_zoom ?? "", // Optional[str]
      zg: true, // Optional[bool]
      drop_densest_as_needed: false, // Optional[bool]
      extend_zooms_if_still_dropping: false, // Optional[bool]
      coalesce_densest_as_needed: false, // Optional[bool]
      smallest_maximum_zoom_guess: false, // Optional[bool]
    },
  });

  const { values } = form;
  useEffect(() => {
    if (onValuesChange) {
      onValuesChange(values);
    }
  }, [onValuesChange, values]);

  return (
    <form className="grid grid-cols-2 gap-4">
      <FormField
        label="Name"
        className="col-span-2"
        {...form.getInputProps("name")}
        render={(field) => <Input {...field} />}
      />
      <FormField
        label="Attribution"
        {...form.getInputProps("attribution")}
        render={(field) => <Input {...field} />}
      />
      <FormField
        label="Description"
        {...form.getInputProps("description")}
        render={(field) => <Input {...field} />}
      />
      <FormField
        label="Projection"
        {...form.getInputProps("projection")}
        render={(field) => <Input {...field} />}
      />
      <FormField
        label="Layer"
        {...form.getInputProps("layer")}
        render={(field) => <Input {...field} />}
      />
      <FormField
        label="Maximum_Zoom"
        {...form.getInputProps("maximum_zoom")}
        render={(field) => <Input {...field} />}
      />
      <FormField
        label="Minimum_Zoom"
        {...form.getInputProps("minimum_zoom")}
        render={(field) => <Input {...field} />}
      />
      <FormField<typeof Checkbox>
        aria-label="Zg"
        {...form.getInputProps("Zg", { type: "checkbox" })}
        render={(field) => (
          <Label className="flex items-center gap-x-2">
            <Checkbox
              checked={field.checked}
              onCheckedChange={(checked) =>
                form.setFieldValue("zg", checked as boolean)
              }
            />
            <span>Zg</span>
          </Label>
        )}
      />
      <FormField<typeof Checkbox>
        aria-label="Drop_Densest_As_Needed"
        {...form.getInputProps("drop_densest_as_needed", { type: "checkbox" })}
        render={(field) => (
          <Label className="flex items-center gap-x-2">
            <Checkbox
              checked={field.checked}
              onCheckedChange={(checked) =>
                form.setFieldValue("drop_densest_as_needed", checked as boolean)
              }
            />
            <span>Drop_Densest_As_Needed</span>
          </Label>
        )}
      />
      <FormField<typeof Checkbox>
        aria-label="Extend_Zooms_If_Still_Dropping"
        {...form.getInputProps("extend_zooms_if_still_dropping", {
          type: "checkbox",
        })}
        render={(field) => (
          <Label className="flex items-center gap-x-2">
            <Checkbox
              checked={field.checked}
              onCheckedChange={(checked) =>
                form.setFieldValue(
                  "extend_zooms_if_still_dropping",
                  checked as boolean
                )
              }
            />
            <span>Extend_Zooms_If_Still_Dropping</span>
          </Label>
        )}
      />
      <FormField<typeof Checkbox>
        aria-label="Coalesce_Densest_As_Needed"
        {...form.getInputProps("coalesce_densest_as_needed", {
          type: "checkbox",
        })}
        render={(field) => (
          <Label className="flex items-center gap-x-2">
            <Checkbox
              checked={field.checked}
              onCheckedChange={(checked) =>
                form.setFieldValue(
                  "coalesce_densest_as_needed",
                  checked as boolean
                )
              }
            />
            <span>Coalesce_Densest_As_Needed</span>
          </Label>
        )}
      />
      <FormField<typeof Checkbox>
        aria-label="Smallest_Maximum_Zoom_Guess"
        {...form.getInputProps("smallest_maximum_zoom_guess", {
          type: "checkbox",
        })}
        render={(field) => (
          <Label className="flex items-center gap-x-2">
            <Checkbox
              checked={field.checked}
              onCheckedChange={(checked) =>
                form.setFieldValue(
                  "smallest_maximum_zoom_guess",
                  checked as boolean
                )
              }
            />
            <span>Smallest_Maximum_Zoom_Guess</span>
          </Label>
        )}
      />
    </form>
  );
}
