import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/settings")({
  component: SettingsLayout,
});

function SettingsLayout() {
  const tabs = [
    { name: "Account", href: "/settings/account" },
    { name: "Matrix Templates", href: "/settings/matrix" },
    { name: "Security", href: "/settings/security" },
  ];

  return (
    <div className="flex flex-col gap-6 h-full w-full">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-muted-foreground text-sm">
          Manage your workspace and profile.
        </p>
      </div>

      <Separator />

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-1/4">
          <nav className="flex lg:flex-col gap-2">
            {tabs.map((tab) => (
              <Link
                key={tab.href}
                to={tab.href}
                activeProps={{ className: "bg-muted font-medium text-primary" }}
                className={cn(
                  "px-4 py-2 rounded-md text-sm transition-colors hover:bg-muted/50",
                  "text-muted-foreground",
                )}
              >
                {tab.name}
              </Link>
            ))}
          </nav>
        </aside>

        <main className="flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
