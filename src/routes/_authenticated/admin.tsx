import { createFileRoute, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, X, RotateCcw, ShieldCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

type Status = "pending" | "approved" | "rejected";
type Row = { id: string; username: string; status: Status; created_at: string; role: "admin" | "user" | null };

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async ({ context }) => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", context.user.id);
    if (!roles?.some((r) => r.role === "admin")) {
      throw redirect({ to: "/" });
    }
  },
  head: () => ({
    meta: [
      { title: "Admin — bajplayer" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

function AdminPage() {
  const qc = useQueryClient();
  const users = useQuery({
    queryKey: ["admin-users"],
    queryFn: async (): Promise<Row[]> => {
      const [{ data: profiles, error: pe }, { data: roles, error: re }] = await Promise.all([
        supabase.from("profiles").select("id, username, status, created_at").order("created_at", { ascending: false }),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      if (pe) throw pe;
      if (re) throw re;
      const roleMap = new Map<string, "admin" | "user">();
      for (const r of roles ?? []) roleMap.set(r.user_id, r.role);
      return (profiles ?? []).map((p) => ({ ...p, role: roleMap.get(p.id) ?? null } as Row));
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Status }) => {
      const { error } = await supabase.from("profiles").update({ status }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] });
      toast.success("Updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const pending = (users.data ?? []).filter((u) => u.status === "pending");
  const others = (users.data ?? []).filter((u) => u.status !== "pending");

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 ring-1 ring-primary/30">
          <ShieldCheck className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">User approvals</h1>
          <p className="text-sm text-muted-foreground">Approve or reject accounts. Admins have full access.</p>
        </div>
      </div>

      {users.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        <>
          <Section title={`Pending (${pending.length})`}>
            {pending.length === 0 ? (
              <EmptyRow>No pending requests.</EmptyRow>
            ) : (
              pending.map((u) => (
                <UserRow key={u.id} u={u}>
                  <Button size="sm" onClick={() => setStatus.mutate({ id: u.id, status: "approved" })}>
                    <Check className="mr-1 h-4 w-4" /> Approve
                  </Button>
                  <Button size="sm" variant="destructive" onClick={() => setStatus.mutate({ id: u.id, status: "rejected" })}>
                    <X className="mr-1 h-4 w-4" /> Reject
                  </Button>
                </UserRow>
              ))
            )}
          </Section>

          <Section title={`All other accounts (${others.length})`}>
            {others.length === 0 ? (
              <EmptyRow>No accounts yet.</EmptyRow>
            ) : (
              others.map((u) => (
                <UserRow key={u.id} u={u}>
                  {u.status === "approved" ? (
                    <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: u.id, status: "rejected" })}>
                      <X className="mr-1 h-4 w-4" /> Revoke
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: u.id, status: "approved" })}>
                      <RotateCcw className="mr-1 h-4 w-4" /> Re-approve
                    </Button>
                  )}
                </UserRow>
              ))
            )}
          </Section>
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function EmptyRow({ children }: { children: React.ReactNode }) {
  return <div className="rounded-lg border bg-card p-4 text-sm text-muted-foreground">{children}</div>;
}

function UserRow({ u, children }: { u: Row; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border bg-card p-4">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate font-medium">{u.username}</p>
          {u.role === "admin" && <Badge variant="secondary">admin</Badge>}
          <Badge
            variant={u.status === "approved" ? "default" : u.status === "rejected" ? "destructive" : "outline"}
          >
            {u.status}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">Joined {new Date(u.created_at).toLocaleString()}</p>
      </div>
      <div className="flex flex-shrink-0 gap-2">{children}</div>
    </div>
  );
}
