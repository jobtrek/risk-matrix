import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = Route.useRouteContext();

  return (
    <div>
      <h1>Dashboard</h1>
      <p>Welcome {user.name}</p>
    </div>
  );
}
