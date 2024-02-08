import { PasswordForm } from "~/components/PasswordForm";
import { Separator } from "~/components/ui";

export const meta = () => {
  return [{ title: "Change Password | Carta Maps" }];
};

export default function Route() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-8xl font-bold tracking-tighter leading-none">
          password
        </h3>
      </div>
      <Separator />
      <div className="max-w-screen-sm">
        <PasswordForm />
      </div>
    </div>
  );
}
