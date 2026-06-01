"use client";

import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { errorBox, successBox } from "@/lib/ui-tokens";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    const trimmedName = name.trim();
    const trimmedEmail = email.trim();
    const trimmedSubject = subject.trim();
    const trimmedMessage = message.trim();

    if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
      setStatus("error");
      setErrorMessage("Please fill in all fields.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setStatus("error");
      setErrorMessage("Please enter a valid email address.");
      return;
    }

    setStatus("success");
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  };

  return (
    <Card padding="lg" hover={false} className="space-y-4">
      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Name" htmlFor="contact-name" required>
            <Input
              id="contact-name"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoComplete="name"
              required
              hasError={status === "error"}
            />
          </Field>
          <Field label="Email" htmlFor="contact-email" required>
            <Input
              id="contact-email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              hasError={status === "error"}
            />
          </Field>
        </div>
        <Field label="Subject" htmlFor="contact-subject" required>
          <Input
            id="contact-subject"
            name="subject"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            required
            hasError={status === "error"}
          />
        </Field>
        <Field label="Message" htmlFor="contact-message" required>
          <Textarea
            id="contact-message"
            name="message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            required
            hasError={status === "error"}
          />
        </Field>

        {status === "success" ? (
          <p className={successBox} role="status">
            Thank you for your message. Our team will review it and respond by email when support
            is available.
          </p>
        ) : null}
        {status === "error" && errorMessage ? (
          <p className={cn(errorBox)} role="alert">
            {errorMessage}
          </p>
        ) : null}

        <Button type="submit" size="lg">
          Send message
        </Button>
        <p className="text-xs text-muted">
          This form is for general inquiries. For urgent order issues, include your order ID.
        </p>
      </form>
    </Card>
  );
}
