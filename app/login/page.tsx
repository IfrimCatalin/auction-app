"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthFooterLink, AuthFormShell } from "@/components/auth-form-shell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { errorBox } from "@/lib/ui-tokens";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/cn";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <AuthFormShell
      title="Welcome back"
      description="Sign in to continue bidding and managing your listings."
      footer={
        <>
          New to GoBidMe? <AuthFooterLink href="/signup">Create an account</AuthFooterLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email" htmlFor="email" required>
          <Input
            id="email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            hasError={Boolean(errorMessage)}
          />
        </Field>
        <Field label="Password" htmlFor="password" required>
          <Input
            id="password"
            type="password"
            required
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
            hasError={Boolean(errorMessage)}
          />
        </Field>
        {errorMessage ? <p className={cn(errorBox)} role="alert">{errorMessage}</p> : null}
        <Button type="submit" fullWidth loading={loading} size="lg">
          Sign in
        </Button>
      </form>
    </AuthFormShell>
  );
}
