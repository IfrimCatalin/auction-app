export const PROFILE_SELECT =
  "id, username, full_name, bio, location, avatar_url, created_at, updated_at";

export const AVATAR_STORAGE_BUCKET = "avatars";
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

export type Profile = {
  id: string;
  username: string | null;
  full_name: string | null;
  bio: string | null;
  location: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
};

export type ProfileFieldErrors = {
  username?: string;
  full_name?: string;
  bio?: string;
  location?: string;
  avatar?: string;
};

export function getProfileDisplayName(
  profile: Pick<Profile, "username" | "full_name"> | null | undefined,
  fallback = "Seller"
) {
  const name = profile?.full_name?.trim() || profile?.username?.trim();
  return name || fallback;
}

export function getProfileInitials(
  profile: Pick<Profile, "username" | "full_name"> | null | undefined,
  fallback = "?"
) {
  const display = getProfileDisplayName(profile, "");
  if (!display) return fallback;

  const parts = display.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return display.slice(0, 2).toUpperCase();
}

export function validateProfileFields(values: {
  username: string;
  full_name: string;
  bio: string;
  location: string;
}): ProfileFieldErrors {
  const errors: ProfileFieldErrors = {};

  const username = values.username.trim();
  if (username) {
    if (username.length < 3 || username.length > 30) {
      errors.username = "Username must be 3–30 characters.";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = "Use letters, numbers, and underscores only.";
    }
  }

  const fullName = values.full_name.trim();
  if (fullName.length > 100) {
    errors.full_name = "Full name must be 100 characters or less.";
  }

  const bio = values.bio.trim();
  if (bio.length > 500) {
    errors.bio = "Bio must be 500 characters or less.";
  }

  const location = values.location.trim();
  if (location.length > 100) {
    errors.location = "Location must be 100 characters or less.";
  }

  return errors;
}
