import { createFileRoute, useNavigate, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Film } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

export const Route = createFileRoute("/auth")({
  ssr: false,
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (data.user) throw redirect({ to: "/" });
  },
  head: () => ({
    meta: [
      { title: "Sign in — bajplayer" },
      { name: "description", content: "Sign in or create an account to use the playlist player." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center px-6">
      <div className="mb-6 flex flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/15 ring-1 ring-primary/30">
          <Film className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight">bajplayer</h1>
        <p className="text-sm text-muted-foreground">
          Sign in or request an account. New accounts need admin approval.
        </p>
      </div>

      <Tabs defaultValue="login" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Sign in</TabsTrigger>
          <TabsTrigger value="register">Register</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <LoginForm />
        </TabsContent>
        <TabsContent value="register">
          <RegisterForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LoginForm() {
  const nav = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) {
      // Deliberately generic — do not distinguish "wrong password" from
      // "rejected user" or "no such account". The layout handles the
      // "pending / rejected" states after a successful sign-in.
      toast.error("Incorrect email or password");
      return;
    }
    nav({ to: "/" });
  };

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border bg-card p-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Email</label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Password</label>
        <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}

function RegisterForm() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return toast.error("Username is required");
    if (password.length < 8) return toast.error("Password must be at least 8 characters");
    if (password !== confirm) return toast.error("Passwords don't match");

    setBusy(true);
    const emailRedirectTo = `${window.location.origin}/auth`;
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo,
        data: { username: username.trim() },
      },
    });
    setBusy(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setDone(true);
    // Ensure no lingering session — user must wait for admin approval.
    await supabase.auth.signOut();
  };

  if (done) {
    return (
      <div className="mt-4 rounded-lg border bg-card p-4 text-sm">
        <p className="font-medium">Your request has been sent.</p>
        <p className="mt-2 text-muted-foreground">
          An admin needs to approve your account before you can sign in.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="mt-4 space-y-3 rounded-lg border bg-card p-4">
      <div className="space-y-1">
        <label className="text-sm font-medium">Email</label>
        <Input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Username</label>
        <Input required value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Password</label>
        <Input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
      </div>
      <div className="space-y-1">
        <label className="text-sm font-medium">Confirm password</label>
        <Input type="password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
      </div>
      <Button type="submit" className="w-full" disabled={busy}>
        {busy ? "Creating…" : "Request account"}
      </Button>
      <p className="pt-1 text-xs text-muted-foreground">
        The first account ever created becomes the admin automatically.
      </p>
    </form>
  );
}
