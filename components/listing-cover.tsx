type ListingCoverProps = {
  src: string | null;
  alt: string;
  className?: string;
  fallbackClassName?: string;
};

export function ListingCover({
  src,
  alt,
  className = "h-full w-full object-cover",
  fallbackClassName = "flex h-full w-full items-center justify-center text-xs text-stone-400",
}: ListingCoverProps) {
  if (!src) {
    return <div className={fallbackClassName}>No image</div>;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} className={className} />
  );
}
