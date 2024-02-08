import { useForm, zodResolver } from "@mantine/form";
import { useDisclosure } from "@mantine/hooks";
import { Link, useNavigate, useSearchParams } from "@remix-run/react";
import { IconEye, IconEyeOff, IconLoader } from "@tabler/icons-react";
import { z } from "zod";
import { Button, FormField, Input, useToast } from "~/components/ui";
import { trpc } from "~/lib/trpc";

const signInFormSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
type SignInWithPassword = z.infer<typeof signInFormSchema>;

export const meta = () => {
  return [{ title: "Sign In | Carta Maps" }];
};

export default function AuthSignInRoute() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [show, { toggle: pwToggle }] = useDisclosure(false);
  const signIn = trpc.auth.signIn.useMutation({
    onSuccess() {
      navigate("/");
    },
    onError: () => {
      toast({
        title: "Sorry",
        description: "Invalid credentials",
        variant: "destructive",
      });
    },
  });

  const form = useForm<SignInWithPassword>({
    validate: zodResolver(signInFormSchema),
    initialValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (values: SignInWithPassword) => {
    signIn.mutate({
      ...values,
    });
  };

  return (
    <div className="w-full max-w-md flex flex-col gap-y-6 p-8 md:p-12 bg-white rounded-md shadow-2xl">
      <div className="text-center">
        <h1 className="text-2xl font-semibold tracking-tight">
          Sign in to your account
        </h1>
      </div>

      <form
        onSubmit={form.onSubmit(onSubmit)}
        className="flex flex-col items-stretch gap-y-4"
      >
        <FormField
          type="email"
          label="Email Address"
          {...form.getInputProps("email")}
          render={(field) => <Input {...field} />}
        />

        <FormField
          type={show ? "text" : "password"}
          aria-label="Password"
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
          <Button className="w-full" type="submit" disabled={signIn.isPending}>
            {signIn.isPending && <IconLoader className="animate-spin mr-2" />}
            Send Login Link
          </Button>
          <Link
            to={{
              pathname: "/sign-up",
              search: decodeURIComponent(searchParams.toString()),
            }}
            className="text-sm mt-2 text-center block w-full"
          >
            {`Don't have an account? Sign Up`}
          </Link>
        </div>
      </form>
    </div>
  );
}
