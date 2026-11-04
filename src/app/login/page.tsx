"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import API_BASE_URL from "@/lib/api";

type LoginResponse = {
  access_token: string;
  token_type: string;
  user: {
    user_id: number;
    full_name: string;
    email: string;
    role: string;
  };
};

export default function LoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    try {
      setLoading(true);
      setError("");

      const formData = new URLSearchParams();
      formData.append("username", email.trim());
      formData.append("password", password);

      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData.toString(),
      });

      const data: LoginResponse | { detail?: string } =
        await response.json();

      if (!response.ok) {
        throw new Error(
          "detail" in data
            ? data.detail || "Invalid email or password."
            : "Login failed."
        );
      }

      const loginData = data as LoginResponse;

      localStorage.setItem("access_token", loginData.access_token);
      localStorage.setItem("user", JSON.stringify(loginData.user));

      router.replace("/");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to login."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F4F7FC] px-5 py-8">

      {/* Background decoration */}
      <div className="absolute -left-40 -top-40 h-80 w-80 rounded-full bg-blue-200/30 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-80 w-80 rounded-full bg-indigo-200/30 blur-3xl" />

      <div className="relative w-full max-w-[400px]">

        {/* Branding */}
        <div className="mb-6 text-center">

          <div className="mb-3 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-700 text-white shadow-lg shadow-blue-700/20">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                className="h-6 w-6"
              >
                <path
                  d="M7 3.75h7l4 4V20a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4.75a1 1 0 0 1 1-1Z"
                  stroke="currentColor"
                  strokeWidth="1.7"
                />
                <path
                  d="M14 4v4h4M9 13h6M9 17h6"
                  stroke="currentColor"
                  strokeWidth="1.7"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>

          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Invoice<span className="text-blue-700">Guard</span>
          </h1>

          <p className="mt-1.5 text-[11px] font-medium tracking-[0.16em] text-slate-400">
            INVOICE MANAGEMENT SYSTEM
          </p>

        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-7">

          <div className="mb-6">

            <div className="mb-3 inline-flex rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Welcome back
            </div>

            <h2 className="text-xl font-bold tracking-tight text-slate-900">
              Sign in to your account
            </h2>

            <p className="mt-2 text-sm leading-5 text-slate-500">
              Enter your credentials to access your InvoiceGuard workspace.
            </p>

          </div>

          <form onSubmit={handleLogin} className="space-y-4">

            {/* Email */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Email Address
              </label>

              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
              />

            </div>

            {/* Password */}
            <div>

              <label className="mb-2 block text-sm font-semibold text-slate-700">
                Password
              </label>

              <div className="relative">

                <input
                  type={showPassword ? "text" : "password"}
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-16 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 hover:border-slate-300 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500 hover:text-blue-700"
                >
                  {showPassword ? "Hide" : "Show"}
                </button>

              </div>

            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Sign In */}
            <button
              type="submit"
              disabled={loading}
              className="flex h-11 w-full items-center justify-center rounded-xl bg-blue-700 text-sm font-bold text-white shadow-lg shadow-blue-700/20 transition hover:-translate-y-0.5 hover:bg-blue-800 hover:shadow-blue-700/30 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In  →"}
            </button>

          </form>

          {/* Security message */}
          <div className="mt-5 flex items-center justify-center gap-2 border-t border-slate-100 pt-5">

            <svg
              viewBox="0 0 24 24"
              fill="none"
              className="h-4 w-4 text-emerald-600"
            >
              <path
                d="M12 3 19 6v5c0 5-3 8-7 10-4-2-7-5-7-10V6l7-3Z"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinejoin="round"
              />
              <path
                d="m9 12 2 2 4-4"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <p className="text-xs text-slate-500">
              Secure authentication for authorized users
            </p>

          </div>

        </div>

        {/* Footer */}
        <p className="mt-5 text-center text-xs text-slate-400">
          © 2026 InvoiceGuard. All rights reserved.
        </p>

      </div>
    </main>
  );
}