import { Outlet } from "@remix-run/react";
// import { AppHeader } from "~/components/AppHeader";
import { AppNavigation, AppNavigationMobile } from "~/components/AppNavigation";

export const meta = () => {
  return [
    {
      property: "og:image",
      content: "/social/open-graph.jpg",
    },
  ];
};

export default function Route() {
  return (
    <div className="flex min-h-[100svh] flex-1 relative">
      <AppNavigation />
      <div className="flex-1 flex flex-col max-w-full overflow-x-hidden">
        <AppNavigationMobile />
        <main
          id="main"
          className="flex-1 flex flex-col bg-background mb-24 md:mb-0"
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
