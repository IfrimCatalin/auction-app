"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ProfileAvatar } from "@/components/profile-avatar";
import { listingInputClass } from "@/lib/listing-form";
import { removeAvatarByUrl } from "@/lib/profile-storage";
import {
  AVATAR_STORAGE_BUCKET,
  MAX_AVATAR_BYTES,
  type Profile,
  validateProfileFields,
} from "@/lib/profiles";
import { createClient } from "@/lib/supabase/client";

type ProfileFormProps = {
  userId: string;
  initial: Profile;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-sm text-rose-600" role="alert">
      {message}
    </p>
  );
}

export function ProfileForm({ userId, initial }: ProfileFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [username, setUsername] = useState(initial.username ?? "");
  const [fullName, setFullName] = useState(initial.full_name ?? "");
  const [bio, setBio] = useState(initial.bio ?? "");
  const [location, setLocation] = useState(initial.location ?? "");
  const [avatarUrl, setAvatarUrl] = useState(initial.avatar_url);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initial.avatar_url);
  const [pendingAvatar, setPendingAvatar] = useState<File | null>(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const fieldErrors = useMemo(
    () =>
      validateProfileFields({
        username,
        full_name: fullName,
        bio,
        location,
      }),
    [username, fullName, bio, location]
  );

  const isFormValid = Object.keys(fieldErrors).length === 0;

  const previewProfile = useMemo(
    () => ({
      username: username || null,
      full_name: fullName || null,
      avatar_url: removeAvatar ? null : avatarPreview,
    }),
    [username, fullName, avatarPreview, removeAvatar]
  );

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormError("");
    setSuccessMessage("");
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFormError("Please choose an image file for your avatar.");
      return;
    }
    if (file.size > MAX_AVATAR_BYTES) {
      setFormError("Avatar must be 2 MB or smaller.");
      return;
    }

    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    setPendingAvatar(file);
    setRemoveAvatar(false);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleRemoveAvatar = () => {
    if (avatarPreview?.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setPendingAvatar(null);
    setRemoveAvatar(true);
    setAvatarPreview(null);
  };

  const uploadAvatar = async (): Promise<string | null> => {
    if (!pendingAvatar) {
      return removeAvatar ? null : avatarUrl;
    }

    const extension = pendingAvatar.name.includes(".")
      ? pendingAvatar.name.split(".").pop()!.toLowerCase()
      : "jpg";
    const path = `${userId}/avatar.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(AVATAR_STORAGE_BUCKET)
      .upload(path, pendingAvatar, { contentType: pendingAvatar.type, upsert: true });

    if (uploadError) {
      throw new Error(`Avatar upload failed: ${uploadError.message}`);
    }

    const { data } = supabase.storage.from(AVATAR_STORAGE_BUCKET).getPublicUrl(path);
    return `${data.publicUrl}?t=${Date.now()}`;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitAttempted(true);
    setFormError("");
    setSuccessMessage("");

    if (!isFormValid) return;

    setLoading(true);

    try {
      const trimmedUsername = username.trim();
      if (trimmedUsername) {
        const { data: conflict } = await supabase
          .from("profiles")
          .select("id")
          .ilike("username", trimmedUsername)
          .neq("id", userId)
          .maybeSingle();

        if (conflict) {
          setFormError("That username is already taken.");
          setLoading(false);
          return;
        }
      }

      let nextAvatarUrl = avatarUrl;
      if (removeAvatar && avatarUrl) {
        await removeAvatarByUrl(supabase, avatarUrl);
        nextAvatarUrl = null;
      } else if (pendingAvatar) {
        if (avatarUrl && !removeAvatar) {
          await removeAvatarByUrl(supabase, avatarUrl);
        }
        nextAvatarUrl = await uploadAvatar();
      }

      const { error } = await supabase
        .from("profiles")
        .update({
          username: trimmedUsername || null,
          full_name: fullName.trim() || null,
          bio: bio.trim() || null,
          location: location.trim() || null,
          avatar_url: nextAvatarUrl,
        })
        .eq("id", userId);

      if (error) {
        if (error.code === "23505") {
          setFormError("That username is already taken.");
        } else {
          setFormError(error.message);
        }
        setLoading(false);
        return;
      }

      setAvatarUrl(nextAvatarUrl);
      setPendingAvatar(null);
      setRemoveAvatar(false);
      setAvatarPreview(nextAvatarUrl);
      setSuccessMessage("Profile saved.");
      router.refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Could not save profile.");
    } finally {
      setLoading(false);
    }
  };

  const showError = (field: keyof typeof fieldErrors) =>
    submitAttempted ? fieldErrors[field] : undefined;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-6">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        <ProfileAvatar profile={previewProfile} size="lg" />
        <div className="flex-1 space-y-3">
          <p className="text-sm font-medium text-ink/90">Profile photo</p>
          <div className="flex flex-wrap gap-2">
            <label className="cursor-pointer rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-ink transition hover:bg-page-dark">
              Upload photo
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={handleAvatarChange}
              />
            </label>
            {(avatarPreview || avatarUrl) && !removeAvatar ? (
              <button
                type="button"
                onClick={handleRemoveAvatar}
                className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-medium text-muted transition hover:bg-page-dark"
              >
                Remove
              </button>
            ) : null}
          </div>
          <p className="text-xs text-muted">JPG, PNG, or WebP · max 2 MB</p>
        </div>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ink/90">Username</span>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          placeholder="collector_nyc"
          className={listingInputClass(Boolean(showError("username")))}
        />
        <FieldError message={showError("username")} />
        <p className="mt-1 text-xs text-muted">Shown on your public seller page. Letters, numbers, underscores.</p>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ink/90">Full name</span>
        <input
          type="text"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
          placeholder="Alex Morgan"
          className={listingInputClass(Boolean(showError("full_name")))}
        />
        <FieldError message={showError("full_name")} />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ink/90">Location</span>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="New York, NY"
          className={listingInputClass(Boolean(showError("location")))}
        />
        <FieldError message={showError("location")} />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ink/90">Bio</span>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          rows={4}
          placeholder="Tell buyers about your collection and what you sell."
          className={`${listingInputClass(Boolean(showError("bio")))} resize-y min-h-[120px]`}
        />
        <FieldError message={showError("bio")} />
      </label>

      {formError ? (
        <p className="rounded-2xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-300">
          {formError}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-2xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent">
          {successMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={!isFormValid || loading}
        className="rounded-full bg-accent px-6 py-3 text-sm font-medium text-black transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}
