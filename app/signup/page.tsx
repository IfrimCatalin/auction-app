"use client";

import { FormEvent, useState } from "react";
import { AuthFooterLink, AuthFormShell } from "@/components/auth-form-shell";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/cn";
import { errorBox, successBox } from "@/lib/ui-tokens";
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
      "Account created. Check your email for the confirmation link, then sign in."
    );
    setEmail("");
    setPassword("");
    setLoading(false);
  };

  return (
    <AuthFormShell
      title="Create your account"
      description="Join GoBidMe to bid on rare items and list your own."
      footer={
        <>
          Already have an account? <AuthFooterLink href="/login">Sign in</AuthFooterLink>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Field label="Email" htmlFor="signup-email" required>
          <Input
            id="signup-email"
            type="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </Field>
        <Field
          label="Password"
          htmlFor="signup-password"
          required
          helper="At least 6 characters"
        >
          <Input
            id="signup-password"
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Create a password"
            autoComplete="new-password"
          />
        </Field>
        {errorMessage ? <p className={cn(errorBox)} role="alert">{errorMessage}</p> : null}
        {successMessage ? <p className={cn(successBox)} role="status">{successMessage}</p> : null}
        <Button type="submit" fullWidth loading={loading} size="lg">
          Create account
        </Button>
      </form>
    </AuthFormShell>
  );
}
