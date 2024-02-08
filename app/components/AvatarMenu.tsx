import {
  DropdownMenu,
  DropdownMenuTrigger,
  Avatar,
  AvatarImage,
  AvatarFallback,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "~/components/ui";
import {
  IconDeviceDesktop,
  IconLogout,
  IconMoon,
  IconPalette,
  IconSun,
} from "@tabler/icons-react";
import { useWorkspaceLoader } from "~/hooks/useWorkspaceLoader";
import { Link, useRevalidator } from "@remix-run/react";
import { trpc } from "~/lib/trpc";

export type ThemeOptions = "light" | "dark" | "system";

export function AvatarMenu() {
  const revalidator = useRevalidator();
  const { user } = useWorkspaceLoader();
  const updatePreferences = trpc.users.updatePreferences.useMutation({
    onSuccess() {
      revalidator.revalidate();
    },
  });

  const handleChangeTheme = (newTheme: ThemeOptions) => {
    updatePreferences.mutate({
      preferences: {
        theme: newTheme,
      },
    });
  };

  const signOut = async () => {
    // await supabase.auth.signOut();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger>
        {user && (
          <Avatar className="">
            {user.avatar_url ? (
              <AvatarImage src={user.avatar_url}></AvatarImage>
            ) : (
              <AvatarFallback className="uppercase bg-background">
                {user.email?.substring(0, 2)}
              </AvatarFallback>
            )}
          </Avatar>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent side="bottom" align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem className="flex flex-col items-start">
            <p className="text-xs font-medium text-muted-foreground">
              Sign in as
            </p>
            <p className="text-xs">{user?.email}</p>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <IconPalette className="mr-2" size={16} />
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleChangeTheme("light")}>
                <IconSun className="mr-2" size={16} />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeTheme("dark")}>
                <IconMoon className="mr-2" size={16} />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeTheme("system")}>
                <IconDeviceDesktop className="mr-2" size={16} />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} asChild>
          <Link to="/sign-out">
            <IconLogout className="mr-2" size={16} />
            Logout
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
