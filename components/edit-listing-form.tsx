"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  LISTING_STORAGE_BUCKET,
  LISTING_CATEGORY_OPTIONS,
  MAX_IMAGE_BYTES,
  MAX_LISTING_IMAGES,
  listingInputClass,
  minDatetimeLocalValue,
  toDatetimeLocalValue,
  validateEditListingFields,
} from "@/lib/listing-form";
import type { ListingImageRowWithId } from "@/lib/listing-images";
import { removeStorageImagesByUrls } from "@/lib/storage-images";

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
};

type EditListingFormProps = {
  listingId: string;
  sellerId: string;
  initial: {
    title: string;
    description: string;
    category: string;
    auctionEnd: string;
    startingPrice: number;
    images: ListingImageRowWithId[];
  };
};

type FieldErrors = {
  title?: string;
  description?: string;
  category?: string;
  auctionEnd?: string;
};

type TouchedFields = {
  title?: boolean;
  description?: boolean;
  category?: boolean;
  auctionEnd?: boolean;
};

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="mt-1.5 text-sm text-rose-600" role="alert">
      {message}
    </p>
  );
}

export function EditListingForm({ listingId, sellerId, initial }: EditListingFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(initial.title);
  const [description, setDescription] = useState(initial.description);
  const [category, setCategory] = useState(initial.category);
  const [auctionEnd, setAuctionEnd] = useState(toDatetimeLocalValue(initial.auctionEnd));
  const existingImages = useMemo(
    () => [...initial.images].sort((a, b) => a.sort_order - b.sort_order),
    [initial.images]
  );
  const [removedImageIds, setRemovedImageIds] = useState<Set<string>>(new Set());
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<TouchedFields>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const keptExisting = useMemo(
    () => existingImages.filter((img) => !removedImageIds.has(img.id)),
    [existingImages, removedImageIds]
  );

  const totalImageCount = keptExisting.length + pendingImages.length;

  const fieldErrors = useMemo(
    () =>
      validateEditListingFields({
        title,
        description,
        category,
        auctionEnd,
      }),
    [title, description, category, auctionEnd]
  );

  const imageCountError =
    totalImageCount > MAX_LISTING_IMAGES
      ? `You can have at most ${MAX_LISTING_IMAGES} images.`
      : undefined;

  const isFormValid = Object.keys(fieldErrors).length === 0 && !imageCountError;
  const submitDisabled = !isFormValid || loading;

  const showError = (field: keyof FieldErrors) =>
    (submitAttempted || touched[field]) && fieldErrors[field];

  const markTouched = (field: keyof TouchedFields) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const coverPreview =
    keptExisting[0]?.image_url ?? pendingImages[0]?.previewUrl ?? null;

  const removePendingImage = (id: string) => {
    setPendingImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const markExistingRemoved = (id: string) => {
    setRemovedImageIds((prev) => new Set(prev).add(id));
  };

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormError("");
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) return;

    const remainingSlots = MAX_LISTING_IMAGES - totalImageCount;
    if (remainingSlots <= 0) {
      setFormError(`You can upload up to ${MAX_LISTING_IMAGES} images.`);
      return;
    }

    const filesToAdd = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setFormError(`Only ${remainingSlots} more image(s) can be added (max ${MAX_LISTING_IMAGES}).`);
    }

    const newImages: PendingImage[] = [];

    for (const file of filesToAdd) {
      if (!file.type.startsWith("image/")) {
        setFormError("Please select image files only.");
        continue;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        setFormError("Each image must be 5 MB or smaller.");
        continue;
      }
      newImages.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    if (newImages.length > 0) {
      setPendingImages((prev) => [...prev, ...newImages]);
    }
  };

  const uploadNewImages = async (startSortOrder: number) => {
    const rows: { listing_id: string; image_url: string; sort_order: number }[] = [];

    for (let index = 0; index < pendingImages.length; index++) {
      const { file } = pendingImages[index];
      const extension = file.name.includes(".")
        ? file.name.split(".").pop()!.toLowerCase()
        : "jpg";
      const path = `${sellerId}/${listingId}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(LISTING_STORAGE_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage
        .from(LISTING_STORAGE_BUCKET)
        .getPublicUrl(path);

      rows.push({
        listing_id: listingId,
        image_url: publicUrlData.publicUrl,
        sort_order: startSortOrder + index,
      });
    }

    if (rows.length === 0) return;

    const { error: insertError } = await supabase.from("listing_images").insert(rows);
    if (insertError) {
      throw new Error(insertError.message);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setSubmitAttempted(true);

    const errors = validateEditListingFields({
      title,
      description,
      category,
      auctionEnd,
    });

    if (Object.keys(errors).length > 0 || imageCountError) {
      return;
    }

    setLoading(true);

    const auctionEndDate = new Date(auctionEnd);

    const { error: updateError } = await supabase
      .from("listings")
      .update({
        title: title.trim(),
        description: description.trim(),
        category,
        auction_end: auctionEndDate.toISOString(),
      })
      .eq("id", listingId);

    if (updateError) {
      setFormError(updateError.message);
      setLoading(false);
      return;
    }

    try {
      const removedUrls = existingImages
        .filter((img) => removedImageIds.has(img.id))
        .map((img) => img.image_url);

      if (removedImageIds.size > 0) {
        const { error: deleteError } = await supabase
          .from("listing_images")
          .delete()
          .in("id", Array.from(removedImageIds));

        if (deleteError) {
          throw new Error(deleteError.message);
        }

        await removeStorageImagesByUrls(supabase, removedUrls);
      }

      const maxSort = keptExisting.reduce((max, img) => Math.max(max, img.sort_order), -1);
      await uploadNewImages(maxSort + 1);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Could not update images.";
      setFormError(message);
      setLoading(false);
      return;
    }

    router.push(`/auctions/${listingId}`);
    router.refresh();
  };

  const minAuctionEnd = useMemo(() => minDatetimeLocalValue(), []);

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-stone-700">Photos</label>
          <span className="text-xs text-stone-500">
            {totalImageCount}/{MAX_LISTING_IMAGES}
          </span>
        </div>
        <p className="mb-3 text-xs text-stone-500">
          The first photo is the cover. Remove or add images as needed.
        </p>

        {coverPreview ? (
          <div className="mb-3 overflow-hidden rounded-2xl border border-stone-200 bg-stone-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={coverPreview} alt="Cover preview" className="aspect-[4/3] w-full object-cover" />
          </div>
        ) : (
          <div className="mb-3 flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-dashed border-stone-300 bg-stone-50 text-xs text-stone-500">
            No images yet
          </div>
        )}

        {keptExisting.length > 0 || pendingImages.length > 0 ? (
          <div className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
            {keptExisting.map((img, index) => (
              <div key={img.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.image_url}
                  alt={`Existing ${index + 1}`}
                  className={`aspect-square w-full rounded-xl object-cover ${
                    index === 0 ? "ring-2 ring-stone-900" : ""
                  }`}
                />
                {index === 0 ? (
                  <span className="absolute left-1 top-1 rounded bg-stone-900 px-1.5 py-0.5 text-[10px] font-medium text-white">
                    Cover
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => markExistingRemoved(img.id)}
                  disabled={loading}
                  className="absolute right-1 top-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-stone-700 shadow hover:bg-white"
                  aria-label={`Remove image ${index + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
            {pendingImages.map((img, index) => {
              const displayIndex = keptExisting.length + index;
              return (
                <div key={img.id} className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.previewUrl}
                    alt={`New ${displayIndex + 1}`}
                    className={`aspect-square w-full rounded-xl object-cover ${
                      displayIndex === 0 ? "ring-2 ring-stone-900" : ""
                    }`}
                  />
                  {displayIndex === 0 && keptExisting.length === 0 ? (
                    <span className="absolute left-1 top-1 rounded bg-stone-900 px-1.5 py-0.5 text-[10px] font-medium text-white">
                      Cover
                    </span>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => removePendingImage(img.id)}
                    disabled={loading}
                    className="absolute right-1 top-1 rounded-full bg-white/90 px-1.5 py-0.5 text-[10px] font-medium text-stone-700 shadow hover:bg-white"
                    aria-label={`Remove new image ${displayIndex + 1}`}
                  >
                    ×
                  </button>
                </div>
              );
            })}
          </div>
        ) : null}

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesChange}
          disabled={loading || totalImageCount >= MAX_LISTING_IMAGES}
          className="block w-full cursor-pointer rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-700 file:mr-4 file:rounded-full file:border-0 file:bg-stone-900 file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
        />
        {imageCountError ? (
          <p className="mt-1.5 text-sm text-rose-600">{imageCountError}</p>
        ) : null}
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-stone-700">Title</span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => markTouched("title")}
          className={listingInputClass(Boolean(showError("title")))}
        />
        <FieldError message={showError("title") || undefined} />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-stone-700">Description</span>
        <textarea
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => markTouched("description")}
          className={listingInputClass(Boolean(showError("description")))}
        />
        <FieldError message={showError("description") || undefined} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            onBlur={() => markTouched("category")}
            className={listingInputClass(Boolean(showError("category")))}
          >
            {LISTING_CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <FieldError message={showError("category") || undefined} />
        </label>

        <div className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Starting price</span>
          <div className="rounded-2xl border border-stone-200 bg-stone-50 px-4 py-3 text-sm text-stone-600">
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(initial.startingPrice)}
            <p className="mt-1 text-xs text-stone-500">Cannot be changed after listing.</p>
          </div>
        </div>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-stone-700">Auction end</span>
        <input
          type="datetime-local"
          value={auctionEnd}
          min={minAuctionEnd}
          onChange={(e) => setAuctionEnd(e.target.value)}
          onBlur={() => markTouched("auctionEnd")}
          className={listingInputClass(Boolean(showError("auctionEnd")))}
        />
        <FieldError message={showError("auctionEnd") || undefined} />
        <p className="mt-1.5 text-xs text-stone-500">Must be a future date and time.</p>
      </label>

      {formError ? (
        <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {formError}
        </p>
      ) : null}

      {submitAttempted && !isFormValid ? (
        <p className="text-sm text-stone-600">Please fix the highlighted fields before saving.</p>
      ) : null}

      <button
        type="submit"
        disabled={submitDisabled}
        className="w-full rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Saving…" : "Save changes"}
      </button>
    </form>
  );
}
