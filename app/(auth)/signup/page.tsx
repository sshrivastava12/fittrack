"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: name },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setSuccess(true);
      setTimeout(() => router.push("/"), 2000);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 text-center">
        <div className="text-5xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-2">Welcome!</h2>
        <p className="text-text-secondary">Redirecting you to FitTrack...</p>
      </div>
    );
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
        <h1 className="text-3xl font-bold text-white">Create Account</h1>
        <p className="text-text-secondary mt-1">Start tracking your gains</p>
      </div>

      <form onSubmit={handleSignup} className="w-full max-w-sm space-y-4">
        <Input
          label="Name"
          type="text"
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          autoComplete="name"
        />
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
          placeholder="Min. 6 characters"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          minLength={6}
          required
        />

        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-ios px-4 py-3">
            <p className="text-danger text-sm">{error}</p>
          </div>
        )}

        <Button type="submit" fullWidth loading={loading} size="lg">
          Create Account
        </Button>

        <div className="text-center">
          <span className="text-text-secondary text-sm">
            Already have an account?{" "}
          </span>
          <Link href="/login" className="text-primary text-sm font-semibold">
            Sign In
          </Link>
        </div>
      </form>
    </div>
  );
}
