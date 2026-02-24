import { authClient } from '@/lib/auth-client';
import { createFileRoute, redirect } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: async () => {

    const session = await authClient.getSession();

    if (!session || !session.data) {
      throw redirect({ to: "/login" });
    }

    return { user: session.data.user };
  }
})
