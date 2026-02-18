import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/settings/account")({
  component: AccountSettings,
});

function AccountSettings() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Account</CardTitle>
        <CardDescription>Update your personal information.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <Input id="username" defaultValue="adbme" />
        </div>
        <Button>Save Profile</Button>
      </CardContent>
    </Card>
  );
}