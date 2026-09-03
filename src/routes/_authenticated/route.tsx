import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { EMAIL_AUTORIZADO } from "@/lib/acesso";
import { AppNav } from "@/components/layout/app-nav";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) throw redirect({ to: "/auth" });
    if ((data.user.email ?? "").toLowerCase() !== EMAIL_AUTORIZADO) {
      await supabase.auth.signOut();
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const { user } = Route.useRouteContext();
  return (
    <div className="min-h-svh bg-background">
      <AppNav email={user.email ?? ""} />
      <Outlet />
    </div>
  );
}
