import { Link, NavLink, useRevalidator } from "@remix-run/react";
import { navigation } from "~/lib/navigation";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "~/components/ui";
import { cn } from "~/lib/utils";
import { useWorkspaceLoader } from "~/hooks/useWorkspaceLoader";
import {
  IconDeviceDesktop,
  IconLogout2,
  IconMenu,
  IconMoon,
  IconPalette,
  IconSelector,
  IconSettings,
  IconSun,
  IconUser,
} from "@tabler/icons-react";
import { trpc } from "~/lib/trpc";
import { useMemo } from "react";
import { AvatarMenu } from "./AvatarMenu";
import { useDisclosure } from "@mantine/hooks";

export function AppNavigation() {
  return (
    <>
      <div
        className={cn(
          "group sticky top-0 flex-shrink-0 scrollbar-none",
          "transition-all ease-in-out duration-150",
          "hidden md:block md:w-52 h-screen overflow-y-auto",
          "bg-secondary"
        )}
      >
        <div className="flex items-center p-2">
          <NavDropdownMenu />
        </div>

        <NavItems />

        <div className="absolute bottom-0 inset-x-0 flex items-center p-2">
          {/* <WorkspaceSwitcher /> */}
        </div>
      </div>
    </>
  );
}

export function AppNavigationMobile() {
  const [open, { toggle }] = useDisclosure(false);
  return (
    <>
      <div className="md:hidden h-16 border-b fixed top-0 inset-x-0 bg-background z-50 flex items-center gap-x-3 px-3">
        <Sheet open={open} onOpenChange={toggle}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <IconMenu />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0">
            <SheetHeader className="h-16 flex items-center justify-center border-b">
              <SheetTitle>Menu</SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-y-0.5 p-2 justify-start w-full">
              {navigation.map((item) => {
                return (
                  <NavLink
                    key={item.slug}
                    to={item.slug}
                    className={({ isActive }) =>
                      cn(
                        "text-sm px-2 py-1.5 flex items-center h-full w-full relative text-foreground/80 rounded-md",
                        isActive ? "bg-foreground/10" : "hover:bg-foreground/10"
                      )
                    }
                    onClick={toggle}
                  >
                    <item.icon
                      className="flex-none mr-2"
                      size={16}
                      strokeWidth={1.5}
                    />
                    <span className="text-sm">{item.name}</span>
                  </NavLink>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
        <div className="max-w-[250px]">{/* <WorkspaceSwitcher /> */}</div>
        <div className="ml-auto">
          <AvatarMenu />
        </div>
      </div>
      <div className="md:hidden h-16" aria-hidden={true} />
    </>
  );
}

export function AppBottomBar() {
  return (
    <div className="fixed bottom-0 inset-x-0 h-16 bg-secondary border-t md:hidden">
      <div className="grid grid-cols-4 gap-2 p-2 h-full">
        {navigation.map((item) => {
          return (
            <NavLink
              key={item.slug}
              to={item.slug}
              className={({ isActive }) =>
                cn(
                  "text-sm flex flex-col gap-y-0.5 items-center justify-center h-full relative text-foreground/80 rounded-md",
                  isActive ? "bg-foreground/10" : "hover:bg-foreground/10"
                )
              }
            >
              <item.icon
                className="flex-none sm:mr-2"
                size={16}
                strokeWidth={1.5}
              />
              <span className="text-xs">{item.name}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}

export type ThemeOptions = "light" | "dark" | "system";

function NavDropdownMenu() {
  const { user } = useWorkspaceLoader();
  const revalidator = useRevalidator();
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

  const userName = useMemo(() => {
    if (user.email) {
      return user.email.split("@").shift();
    }
    return user.id.substring(0, 8);
  }, [user]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="px-0 sm:px-3 justify-center sm:justify-start hover:bg-primary/10 w-full"
        >
          <Avatar className="sm:mr-2 h-5 w-5">
            <AvatarImage
              src={
                user.avatar_url ?? `https://avatar.vercel.sh/${user.email!}.png`
              }
              alt={user.email ?? ""}
            />
            <AvatarFallback>{user.email?.slice(0, 2)}</AvatarFallback>
          </Avatar>
          <span className="hidden sm:inline truncate capitalize">
            {userName}
          </span>
          <IconSelector className="hidden sm:inline ml-auto h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-48 p-0 py-1">
        <DropdownMenuItem className="text-sm leading-5 rounded-none" asChild>
          <Link to="/settings/account" type="button">
            <IconUser size={14} className="mr-2" />
            My Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-sm leading-5 rounded-none" asChild>
          <Link to="/settings" type="button">
            <IconSettings size={14} className="mr-2" />
            Settings
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <IconPalette className="mr-2" size={14} />
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => handleChangeTheme("light")}>
                <IconSun className="mr-2" size={14} />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeTheme("dark")}>
                <IconMoon className="mr-2" size={14} />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleChangeTheme("system")}>
                <IconDeviceDesktop className="mr-2" size={14} />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="text-sm leading-5 rounded-none" asChild>
          <Link to="/sign-out">
            <IconLogout2 size={14} className="mr-2" />
            Sign Out
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function NavItems() {
  return (
    <div className="flex flex-col gap-y-0.5 p-2 justify-start w-full">
      {navigation.map((item) => {
        return (
          <NavLink
            key={item.slug}
            to={item.slug}
            className={({ isActive }) =>
              cn(
                "text-sm px-2 py-1.5 flex items-center h-full w-full relative text-foreground/80 rounded-md",
                isActive ? "bg-foreground/10" : "hover:bg-foreground/10"
              )
            }
          >
            <item.icon className="flex-none mr-2" size={16} strokeWidth={1.5} />
            <span className="text-sm">{item.name}</span>
          </NavLink>
        );
      })}
    </div>
  );
}
