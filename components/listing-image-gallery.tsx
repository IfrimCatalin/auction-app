"use client";

import { useMemo, useState } from "react";

type ListingImageGalleryProps = {
  images: string[];
  title: string;
};

export function ListingImageGallery({ images, title }: ListingImageGalleryProps) {
  const galleryImages = useMemo(() => images.filter(Boolean), [images]);
  const [activeIndex, setActiveIndex] = useState(0);

  if (galleryImages.length === 0) {
    return (
      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="flex aspect-square w-full items-center justify-center bg-page-dark text-sm text-muted/70">
          No images provided
        </div>
      </div>
    );
  }

  const activeSrc = galleryImages[activeIndex] ?? galleryImages[0];

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="aspect-square w-full overflow-hidden bg-page-dark">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={activeSrc} alt={title} className="h-full w-full object-cover" />
        </div>
      </div>

      {galleryImages.length > 1 ? (
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
          {galleryImages.map((src, index) => (
            <button
              key={`${src}-${index}`}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={`overflow-hidden rounded-xl border-2 transition ${
                index === activeIndex
                  ? "border-accent"
                  : "border-transparent opacity-80 hover:opacity-100"
              }`}
              aria-label={`View image ${index + 1} of ${galleryImages.length}`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt="" className="aspect-square w-full object-cover" />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
