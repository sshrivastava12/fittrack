"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export default function ProfilePage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [unit, setUnit] = useState<"lbs" | "kg">("lbs");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      setEmail(user.email ?? "");

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (data) {
        setDisplayName(data.display_name ?? "");
        setUnit(data.unit_preference ?? "lbs");
      }
    }
    load();
  }, []);

  async function saveProfile() {
    setLoading(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from("profiles")
      .upsert({
        user_id: user.id,
        display_name: displayName,
        unit_preference: unit,
        updated_at: new Date().toISOString(),
      });

    setSaved(true);
    setLoading(false);
    setTimeout(() => setSaved(false), 2000);
  }

  async function logout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="px-4 safe-top">
      <h1 className="text-2xl font-bold text-white pt-4 mb-6">Profile</h1>

      {/* Avatar */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-3xl font-bold text-white mb-3">
          {(displayName || email || "U")[0].toUpperCase()}
        </div>
        <p className="text-white font-semibold text-lg">
          {displayName || "Set your name"}
        </p>
        <p className="text-text-secondary text-sm">{email}</p>
      </div>

      {/* Settings */}
      <div className="space-y-4 mb-6">
        <Input
          label="Display Name"
          placeholder="Your name"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
        />

        <div>
          <p className="text-sm text-text-secondary font-medium mb-2 px-1">
            Weight Unit
          </p>
          <Card padding="none">
            <div className="flex">
              <button
                onClick={() => setUnit("lbs")}
                className={`flex-1 py-3 text-center font-medium text-sm rounded-l-ios-lg transition-colors ${
                  unit === "lbs"
                    ? "bg-primary text-white"
                    : "text-text-secondary"
                }`}
              >
                lbs
              </button>
              <button
                onClick={() => setUnit("kg")}
                className={`flex-1 py-3 text-center font-medium text-sm rounded-r-ios-lg transition-colors ${
                  unit === "kg"
                    ? "bg-primary text-white"
                    : "text-text-secondary"
                }`}
              >
                kg
              </button>
            </div>
          </Card>
        </div>
      </div>

      <Button
        fullWidth
        size="lg"
        onClick={saveProfile}
        loading={loading}
        variant={saved ? "success" : "primary"}
        className="mb-4"
      >
        {saved ? "✓ Saved!" : "Save Changes"}
      </Button>

      {/* About section */}
      <Card className="mb-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">App Version</span>
            <span className="text-white text-sm">1.0.0</span>
          </div>
          <div className="h-px bg-separator" />
          <div className="flex items-center justify-between">
            <span className="text-text-secondary text-sm">Platform</span>
            <span className="text-white text-sm">FitTrack PWA</span>
          </div>
        </div>
      </Card>

      <Button
        fullWidth
        variant="danger"
        size="lg"
        onClick={logout}
        className="mb-8"
      >
        Sign Out
      </Button>
    </div>
  );
}
