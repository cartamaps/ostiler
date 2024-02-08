import { useForm, zodResolver } from "@mantine/form";
import { Link, useSearchParams } from "@remix-run/react";
import { IconEye, IconEyeOff, IconLoader } from "@tabler/icons-react";
import { z } from "zod";
import { Button, FormField, Input } from "~/components/ui";
import { trpc } from "~/lib/trpc";
import { useDisclosure } from "@mantine/hooks";

const signUpFormSchema = z.object({
  full_name: z.string(),
  email: z.string().email(),
  password: z.string().min(8),
});
type SignUpForm = z.infer<typeof signUpFormSchema>;

export const meta = () => {
  return [{ title: "Create Your Account | Carta Maps" }];
};

export default function AuthSignUpRoute() {
  const [searchParams] = useSearchParams();
  const [show, { toggle: pwToggle }] = useDisclosure(false);
  const signUp = trpc.auth.signUp.useMutation();

  const form = useForm<SignUpForm>({
    validate: zodResolver(signUpFormSchema),
    initialValues: {
      full_name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignUpForm) => {
    signUp.mutate(values);
  };

  return (
    <>
      <div className="w-full max-w-md flex flex-col gap-y-6 p-8 md:p-12 bg-white rounded-md shadow-2xl">
        <div className="text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create an account
          </h1>
        </div>

        <form
          onSubmit={form.onSubmit(onSubmit)}
          className="flex flex-col items-stretch gap-y-4"
        >
          <FormField
            type="text"
            label="Full Name"
            name="full_Name"
            placeholder="g mercator"
            {...form.getInputProps("full_name")}
            render={(field) => <Input {...field} />}
          />

          <FormField
            type="email"
            label="Email Address"
            name="email"
            placeholder="g.mercator@gis.com"
            {...form.getInputProps("email")}
            render={(field) => <Input {...field} />}
          />

          <FormField
            type={show ? "text" : "password"}
            label="Password"
            {...form.getInputProps("password")}
            className="flex-1"
            render={(field) => (
              <>
                <div className="relative">
                  <Input placeholder="Enter your password" {...field} />
                  <Button
                    className="absolute h-[85%] w-auto aspect-square top-1/2 right-1 transform -translate-y-1/2"
                    size="icon"
                    variant="ghost"
                    type="button"
                    onClick={pwToggle}
                  >
                    {show ? <IconEye size={16} /> : <IconEyeOff size={16} />}
                  </Button>
                </div>
              </>
            )}
          />

          <div className="mt-2">
            <Button
              className="w-full"
              type="submit"
              disabled={signUp.isPending}
            >
              {signUp.isPending && <IconLoader className="animate-spin mr-2" />}
              Send Login Link
            </Button>
            <Link
              to={{
                pathname: "/sign-in",
                search: decodeURIComponent(searchParams.toString()),
              }}
              className="text-sm mt-2 text-center block w-full"
            >
              Already have an account? Sign In
            </Link>
          </div>
        </form>
      </div>
    </>
  );
}
