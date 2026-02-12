import {
  HeadContent,
  Outlet,
  createRootRouteWithContext,
  useLocation,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";

import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Separator } from "@/components/ui/separator";

import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";

import "../index.css";
import { ModeToggle } from "@/components/mode-toggle";
import UserMenu from "@/components/user-menu";

import { authClient } from "@/lib/auth-client";
import { redirect } from "@tanstack/react-router";

export interface RouterAppContext {
  session?: any;
}

export const Route = createRootRouteWithContext<RouterAppContext>()({
  beforeLoad: async ({ location }) => {
    if (location.pathname === "/login") return;

    const session = await authClient.getSession();
    if (!session.data) {
      throw redirect({
        to: "/login",
      });
    }
    return { session };
  },
  component: RootComponent,
  head: () => ({
    meta: [
      {
        title: "risk-matrix",
      },
      {
        name: "description",
        content: "risk-matrix is a web application",
      },
    ],
    links: [
      {
        rel: "icon",
        href: "/favicon.ico",
      },
    ],
  }),
});

function RootComponent() {
  const location = useLocation();
  const isLoginPage = location.pathname === "/login";

  return (
    <>
      <HeadContent />
      <ThemeProvider
        attribute="class"
        defaultTheme="dark"
        disableTransitionOnChange
        storageKey="vite-ui-theme"
      >
        {isLoginPage ? (
          // LAYOUT POUR LOGIN (SANS SIDEBAR)
          <div className="flex min-h-svh items-center justify-center">
            <Outlet />
          </div>
        ) : (
          // LAYOUT APPLI (AVEC SIDEBAR)
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
                <SidebarTrigger className="-ml-1" />
                <Separator orientation="vertical" className="mr-2 h-4" />
                <ModeToggle />
                <UserMenu />
              </header>
              <div className="flex flex-1 flex-col gap-4 p-4">
                <Outlet />
              </div>
            </SidebarInset>
          </SidebarProvider>
        )}
        <Toaster richColors />
      </ThemeProvider>
      <TanStackRouterDevtools position="bottom-left" />
    </>
  );
}
