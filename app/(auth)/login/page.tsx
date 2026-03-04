"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  }

  return (
    <div
      className="min-h-screen bg-background flex flex-col items-center justify-center px-6"
      style={{ paddingTop: "max(env(safe-area-inset-top), 20px)" }}
    >
      {/* Logo */}
      <div className="mb-10 text-center">
        <div className="w-20 h-20 bg-primary rounded-[22px] flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary/30">
          <svg width="44" height="44" viewBox="0 0 44 44" fill="none">
            <path
              d="M8 22h6M30 22h6M14 22l4-8 4 16 4-16 4 8"
              stroke="white"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-3xl font-bold text-white">FitTrack</h1>
        <p className="text-text-secondary mt-1">Track your gains</p>
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        <Input
          label="Email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          required
        />
        <Input
          label="Password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-ios px-4 py-3">
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}

        <Button type="submit" fullWidth loading={loading} size="lg">
          Sign In
        </Button>

        <div className="text-center">
          <span className="text-text-secondary text-sm">
            Don&apos;t have an account?{" "}
          </span>
          <Link href="/signup" className="text-primary text-sm font-semibold">
            Sign Up
          </Link>
        </div>
      </form>
    </div>
  );
}
