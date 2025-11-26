"use client";

import { useState } from "react";
import { useLogin } from "@/domains/auth/hooks";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { GraduationCap } from "lucide-react";

export default function LoginPage() {
  const { mutateAsync, isPending } = useLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await mutateAsync({ email, password });
      window.location.href = "/";
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const axiosError = err as { response?: { data?: { message?: string } } };
        setError(axiosError.response?.data?.message || "Login failed");
      } else {
        setError("Login failed");
      }
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md space-y-6">
        <div className="space-y-3 text-center">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight text-foreground">Durusuna</h1>
            <p className="text-sm text-muted-foreground">Your school. Your control</p>
          </div>
          <div className="flex justify-center">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-[#1e3a5f]">
              <GraduationCap className="w-10 h-10 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
          <p className="text-sm text-muted-foreground">Use your school account</p>
        </div>
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Email</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Password</label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error && (
            <div className="text-sm text-red-600" role="alert">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Signing in..." : "Sign in"}
          </Button>
        </form>
        
        <div className="text-center pt-4">
          <p className="text-sm text-muted-foreground">
            Don&apos;t have a school account?{" "}
            <a
              href="/register"
              className="font-medium text-primary hover:underline"
            >
              Create one here
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
