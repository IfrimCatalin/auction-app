import { getProfileDisplayName, getProfileInitials, type Profile } from "@/lib/profiles";

type ProfileAvatarProps = {
  profile: Pick<Profile, "username" | "full_name" | "avatar_url"> | null | undefined;
  size?: "sm" | "md" | "lg";
  className?: string;
};

const sizeClasses = {
  sm: "h-10 w-10 text-xs",
  md: "h-16 w-16 text-base",
  lg: "h-24 w-24 text-xl",
};

export function ProfileAvatar({ profile, size = "md", className = "" }: ProfileAvatarProps) {
  const displayName = getProfileDisplayName(profile);
  const initials = getProfileInitials(profile);
  const sizeClass = sizeClasses[size];

  if (profile?.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={profile.avatar_url}
        alt={displayName}
        className={`rounded-full object-cover bg-stone-100 ${sizeClass} ${className}`}
      />
    );
  }

  return (
    <div
      className={`flex items-center justify-center rounded-full bg-stone-200 font-semibold text-stone-700 ${sizeClass} ${className}`}
      aria-hidden
    >
      {initials}
    </div>
  );
}
