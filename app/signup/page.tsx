"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setSuccessMessage(
      "Account created. Check your email for the confirmation link, then log in."
    );
    setEmail("");
    setPassword("");
    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 py-12 text-slate-100">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-slate-900/70 p-8 shadow-2xl shadow-black/40 backdrop-blur">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-cyan-300">GoBidMe</p>
        <h1 className="mt-4 text-3xl font-semibold text-white">Create your GoBidMe account</h1>
        <p className="mt-2 text-sm text-slate-300">
          Join GoBidMe and start bidding on premium listings from trusted sellers.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none ring-cyan-300 transition placeholder:text-slate-500 focus:ring-2"
              placeholder="you@example.com"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Password</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none ring-cyan-300 transition placeholder:text-slate-500 focus:ring-2"
              placeholder="At least 6 characters"
            />
          </label>

          {errorMessage ? (
            <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {errorMessage}
            </p>
          ) : null}

          {successMessage ? (
            <p className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
              {successMessage}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-300">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-cyan-300 hover:text-cyan-200">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}
