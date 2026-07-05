import { createFileRoute, Outlet, redirect, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { LogOut, ShieldCheck, Film, Settings as SettingsIcon } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

// Integration-managed pattern: client-only session gate. localStorage isn't
// available during SSR, so ssr:false avoids redirect loops on refresh.
export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth" });
    }
    return { user: data.user };
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { user } = Route.useRouteContext();
  const router = useRouter();

  const profile = useQuery({
    queryKey: ["me-profile", user.id],
    queryFn: async () => {
      const [{ data: p, error: pe }, { data: r }] = await Promise.all([
        supabase.from("profiles").select("username, status").eq("id", user.id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", user.id),
      ]);
      if (pe) throw pe;
      const roles = (r ?? []).map((x) => x.role);
      return { profile: p, isAdmin: roles.includes("admin") };
    },
  });

  const signOut = async () => {
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  };

  if (profile.isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">
        Loading account…
      </div>
    );
  }

  const status = profile.data?.profile?.status;
  const isAdmin = !!profile.data?.isAdmin;

  if (!profile.data?.profile || status === "pending") {
    return (
      <GateScreen
        title="Waiting for approval"
        body="Your account has been created. An admin needs to approve you before you can use the player."
        onSignOut={signOut}
      />
    );
  }
  if (status === "rejected") {
    return (
      <GateScreen
        title="Access declined"
        body="Your account was not approved. If you think this is a mistake, contact the admin."
        onSignOut={signOut}
      />
    );
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-border/50 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-3 px-4 py-3 lg:px-6">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Film className="h-5 w-5 text-primary" />
            <span>bajplayer</span>
          </Link>
          <div className="flex items-center gap-1">
            {isAdmin && (
              <Button asChild variant="ghost" size="sm">
                <Link to="/admin">
                  <ShieldCheck className="mr-2 h-4 w-4" /> Admin
                </Link>
              </Button>
            )}
            <Button asChild variant="ghost" size="sm">
              <Link to="/settings">
                <SettingsIcon className="mr-2 h-4 w-4" /> Settings
              </Link>
            </Button>
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {profile.data?.profile?.username}
            </span>
            <Button variant="ghost" size="sm" onClick={signOut}>
              <LogOut className="mr-2 h-4 w-4" /> Sign out
            </Button>
          </div>
        </div>
      </header>
      <Outlet />
    </div>
  );
}

function GateScreen({ title, body, onSignOut }: { title: string; body: string; onSignOut: () => void }) {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm text-muted-foreground">{body}</p>
      <Button variant="outline" size="sm" onClick={onSignOut} className="mt-6">
        <LogOut className="mr-2 h-4 w-4" /> Sign out
      </Button>
    </div>
  );
}

// Also re-subscribe on auth state changes so sign-out anywhere invalidates the layout.
export function useAuthReactivity() {
  const router = useRouter();
  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") router.navigate({ to: "/auth", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [router]);
}
// hint to keep useState import used across future edits
export const _hintKeep: unknown = useState;
