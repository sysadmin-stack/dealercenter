"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Car, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError("Invalid credentials");
      setLoading(false);
    } else {
      router.push("/dashboard");
    }
  }

  return (
    <div className="flex min-h-screen">
      {/* Left panel — branding */}
      <div className="hidden flex-1 flex-col justify-between bg-[#1a2332] p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-[#5b8def]">
            <Car className="size-5 text-white" />
          </div>
          <span
            className="text-lg font-bold text-white"
            style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}
          >
            FAC Engine
          </span>
        </div>

        <div>
          <h2
            className="text-4xl font-extrabold leading-tight text-white"
            style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}
          >
            Lead Reactivation
            <br />
            <span className="text-[#5b8def]">Made Intelligent</span>
          </h2>
          <p className="mt-4 max-w-md text-lg leading-relaxed text-slate-400">
            Multi-channel outreach engine for Florida Auto Center.
            Reactivate dormant leads with AI-powered messaging across
            WhatsApp, Email, and SMS.
          </p>
        </div>

        <p className="text-sm text-slate-600">
          Florida Auto Center &middot; Reactivation CRM
        </p>
      </div>

      {/* Right panel — login form */}
      <div className="flex flex-1 items-center justify-center bg-[#f7f9fc] px-6">
        <div className="w-full max-w-[400px]">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-3 lg:hidden">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#5b8def]">
              <Car className="size-5 text-white" />
            </div>
            <span
              className="text-lg font-bold text-[#1a2332]"
              style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}
            >
              FAC Engine
            </span>
          </div>

          <h1
            className="text-2xl font-bold text-[#1a2332]"
            style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}
          >
            Welcome back
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to access your dashboard
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-[13px] font-semibold text-[#1a2332]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#1a2332] shadow-sm transition-all placeholder:text-slate-400 focus:border-[#5b8def] focus:outline-none focus:ring-2 focus:ring-[#5b8def]/20"
                placeholder="you@company.com"
                required
              />
            </div>
            <div>
              <label
                htmlFor="password"
                className="block text-[13px] font-semibold text-[#1a2332]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1.5 block w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-[#1a2332] shadow-sm transition-all placeholder:text-slate-400 focus:border-[#5b8def] focus:outline-none focus:ring-2 focus:ring-[#5b8def]/20"
                placeholder="Enter your password"
                required
              />
            </div>

            {error && (
              <div className="rounded-lg bg-rose-50 px-4 py-3 text-sm font-medium text-rose-600">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#1b2a4a] px-4 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#243656] focus:outline-none focus:ring-2 focus:ring-[#5b8def]/50 focus:ring-offset-2 disabled:opacity-50"
              style={{ fontFamily: "var(--font-display), system-ui, sans-serif" }}
            >
              {loading ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
