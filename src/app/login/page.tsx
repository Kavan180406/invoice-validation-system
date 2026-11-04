
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

      // Store authentication token and logged-in user details.
      localStorage.setItem("access_token", loginData.access_token);
      localStorage.setItem("user", JSON.stringify(loginData.user));

      // Navigate to the dashboard.
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
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-5 py-10 text-slate-100">
      <div className="w-full max-w-md">

        {/* Application Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-white">
            Invoice<span className="text-blue-400">Guard</span>
          </h1>

          <p className="mt-3 text-sm text-slate-400">
            Invoice Validation & Duplicate Detection System
          </p>
        </div>

        {/* Login Card */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-xl">

          <h2 className="text-2xl font-bold">
            Welcome Back
          </h2>

          <p className="mt-2 text-sm text-slate-400">
            Sign in to access your dashboard.
          </p>

          <form onSubmit={handleLogin} className="mt-7 space-y-5">

            {/* Email */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Email Address
              </label>

              <input
                type="email"
                required
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Password */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Password
              </label>

              <input
                type="password"
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-white outline-none focus:border-blue-500"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="rounded-lg border border-red-800 bg-red-950/40 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>

          </form>

          {/* Role-neutral authentication message */}
          <p className="mt-6 text-center text-xs text-slate-500">
            Secure authentication for authorized users
          </p>

        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-600">
          InvoiceGuard © 2026
        </p>

      </div>
    </main>
  );
}
