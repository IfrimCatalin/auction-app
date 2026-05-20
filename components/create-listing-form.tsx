"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuctionDurationSelector } from "@/components/auction-duration-selector";
import {
  calculateAuctionEndFromDuration,
  DEFAULT_AUCTION_DURATION_ID,
  formatAuctionEndDisplay,
  type AuctionDurationId,
} from "@/lib/auction-duration";
import {
  LISTING_CATEGORY_OPTIONS,
  validateCreateListingFields,
  type ListingFieldErrors,
} from "@/lib/listing-form";
import {
  parseReservePriceForInsert,
  type ReserveMode,
} from "@/lib/reserve-price";
import { createClient } from "@/lib/supabase/client";

type CreateListingFormProps = {
  sellerId: string;
};

type TouchedFields = {
  title?: boolean;
  description?: boolean;
  category?: boolean;
  startingPrice?: boolean;
  reservePrice?: boolean;
  auctionDuration?: boolean;
};

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
};

const STORAGE_BUCKET = "listing-images";
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES = 8;

const inputBaseClass =
  "w-full rounded-2xl border bg-page-dark px-4 py-3 text-sm text-ink outline-none transition placeholder:text-muted/70 focus:border-accent";

function inputClass(hasError: boolean) {
  return hasError
    ? `${inputBaseClass} border-rose-400 focus:border-rose-500`
    : `${inputBaseClass} border-border`;
}

function FieldError({ message, id }: { message?: string; id?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="mt-1.5 text-sm text-rose-600" role="alert">
      {message}
    </p>
  );
}

export function CreateListingForm({ sellerId }: CreateListingFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>(LISTING_CATEGORY_OPTIONS[0]);
  const [startingPrice, setStartingPrice] = useState("");
  const [reserveMode, setReserveMode] = useState<ReserveMode>("none");
  const [reservePrice, setReservePrice] = useState("");
  const [auctionDuration, setAuctionDuration] = useState<AuctionDurationId | "">(
    DEFAULT_AUCTION_DURATION_ID
  );
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<TouchedFields>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const fieldErrors = useMemo(
    () =>
      validateCreateListingFields({
        title,
        description,
        category,
        startingPrice,
        reserveMode,
        reservePrice,
        auctionDuration,
      }),
    [title, description, category, startingPrice, reserveMode, reservePrice, auctionDuration]
  );

  const previewAuctionEnd = useMemo(() => {
    if (!auctionDuration) return null;
    try {
      return calculateAuctionEndFromDuration(auctionDuration);
    } catch {
      return null;
    }
  }, [auctionDuration]);

  const isFormValid = Object.keys(fieldErrors).length === 0;
  const submitDisabled = !isFormValid || loading;

  const showError = (field: keyof ListingFieldErrors) =>
    (submitAttempted || touched[field as keyof TouchedFields]) && fieldErrors[field];

  const markTouched = (field: keyof TouchedFields) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const removePendingImage = (id: string) => {
    setPendingImages((prev) => {
      const target = prev.find((img) => img.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((img) => img.id !== id);
    });
  };

  const handleFilesChange = (event: ChangeEvent<HTMLInputElement>) => {
    setFormError("");
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (files.length === 0) return;

    const remainingSlots = MAX_IMAGES - pendingImages.length;
    if (remainingSlots <= 0) {
      setFormError(`You can upload up to ${MAX_IMAGES} images.`);
      return;
    }

    const filesToAdd = files.slice(0, remainingSlots);
    if (files.length > remainingSlots) {
      setFormError(`Only ${remainingSlots} more image(s) can be added (max ${MAX_IMAGES}).`);
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

  const uploadListingImages = async (listingId: string, images: PendingImage[]) => {
    const rows: { listing_id: string; image_url: string; sort_order: number }[] = [];

    for (let index = 0; index < images.length; index++) {
      const { file } = images[index];
      const extension = file.name.includes(".")
        ? file.name.split(".").pop()!.toLowerCase()
        : "jpg";
      const path = `${sellerId}/${listingId}/${crypto.randomUUID()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(path, file, { contentType: file.type, upsert: false });

      if (uploadError) {
        throw new Error(`Image upload failed: ${uploadError.message}`);
      }

      const { data: publicUrlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(path);
      rows.push({
        listing_id: listingId,
        image_url: publicUrlData.publicUrl,
        sort_order: index,
      });
    }

    if (rows.length === 0) return null;

    const { error: insertError } = await supabase.from("listing_images").insert(rows);
    if (insertError) {
      throw new Error(insertError.message);
    }

    return rows[0].image_url;
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError("");
    setSubmitAttempted(true);

    const errors = validateCreateListingFields({
      title,
      description,
      category,
      startingPrice,
      reserveMode,
      reservePrice,
      auctionDuration,
    });

    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);

    const parsedPrice = Number(startingPrice);
    const auctionEndIso = calculateAuctionEndFromDuration(
      auctionDuration as AuctionDurationId
    );

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .insert({
        title: title.trim(),
        description: description.trim(),
        category,
        starting_price: parsedPrice,
        current_price: parsedPrice,
        auction_end: auctionEndIso,
        reserve_price: parseReservePriceForInsert(reserveMode, reservePrice),
        status: "active",
        seller_id: sellerId,
        image_url: null,
      })
      .select("id")
      .single();

    if (listingError || !listing) {
      setFormError(listingError?.message ?? "Could not create listing.");
      setLoading(false);
      return;
    }

    try {
      const coverUrl = await uploadListingImages(listing.id, pendingImages);

      if (coverUrl) {
        await supabase.from("listings").update({ image_url: coverUrl }).eq("id", listing.id);
      }
    } catch (uploadErr) {
      const message = uploadErr instanceof Error ? uploadErr.message : "Image upload failed.";
      setFormError(
        `${message} Your listing was created, but some images may be missing. You can add images later from your dashboard.`
      );
      setLoading(false);
      router.push("/dashboard");
      router.refresh();
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  const coverPreview = pendingImages[0]?.previewUrl;

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <label className="block text-sm font-medium text-ink/90">Photos</label>
          <span className="text-xs text-muted">
            {pendingImages.length}/{MAX_IMAGES}
          </span>
        </div>
        <p className="mb-3 text-xs text-muted">
          Add up to {MAX_IMAGES} images. The first photo is the cover on auction cards.
        </p>

        {coverPreview ? (
          <div className="mb-3 overflow-hidden rounded-2xl border border-border bg-page">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverPreview}
              alt="Cover preview"
              className="aspect-[4/3] w-full object-cover"
            />
          </div>
        ) : (
          <div className="mb-3 flex aspect-[4/3] w-full items-center justify-center rounded-2xl border border-dashed border-border bg-page text-xs text-muted">
            PNG or JPG · up to 5 MB each
          </div>
        )}

        {pendingImages.length > 0 ? (
          <div className="mb-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
            {pendingImages.map((img, index) => (
              <div key={img.id} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={img.previewUrl}
                  alt={`Preview ${index + 1}`}
                  className={`aspect-square w-full rounded-xl object-cover ${
                    index === 0 ? "ring-2 ring-accent" : ""
                  }`}
                />
                {index === 0 ? (
                  <span className="absolute left-1 top-1 rounded bg-accent px-1.5 py-0.5 text-[10px] font-medium text-black">
                    Cover
                  </span>
                ) : null}
                <button
                  type="button"
                  onClick={() => removePendingImage(img.id)}
                  disabled={loading}
                  className="absolute right-1 top-1 rounded-full bg-surface/90 px-1.5 py-0.5 text-[10px] font-medium text-ink/90 shadow hover:bg-surface"
                  aria-label={`Remove image ${index + 1}`}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <input
          type="file"
          accept="image/*"
          multiple
          onChange={handleFilesChange}
          disabled={loading || pendingImages.length >= MAX_IMAGES}
          className="block w-full cursor-pointer rounded-2xl border border-border bg-surface px-4 py-3 text-sm text-ink/90 file:mr-4 file:rounded-full file:border-0 file:bg-accent file:px-4 file:py-2 file:font-medium file:text-black hover:file:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ink/90">Title</span>
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          onBlur={() => markTouched("title")}
          aria-invalid={Boolean(showError("title"))}
          aria-describedby={showError("title") ? "title-error" : undefined}
          className={inputClass(Boolean(showError("title")))}
          placeholder="What are you selling?"
        />
        <FieldError message={showError("title") || undefined} id="title-error" />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ink/90">Description</span>
        <textarea
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          onBlur={() => markTouched("description")}
          aria-invalid={Boolean(showError("description"))}
          className={inputClass(Boolean(showError("description")))}
          placeholder="Condition, authenticity, what’s included…"
        />
        <FieldError message={showError("description") || undefined} />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink/90">Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            onBlur={() => markTouched("category")}
            aria-invalid={Boolean(showError("category"))}
            className={inputClass(Boolean(showError("category")))}
          >
            {LISTING_CATEGORY_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          <FieldError message={showError("category") || undefined} />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-ink/90">Starting price</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={startingPrice}
            onChange={(event) => setStartingPrice(event.target.value)}
            onBlur={() => markTouched("startingPrice")}
            aria-invalid={Boolean(showError("startingPrice"))}
            className={inputClass(Boolean(showError("startingPrice")))}
            placeholder="500.00"
          />
          <FieldError message={showError("startingPrice") || undefined} />
        </label>
      </div>

      <fieldset className="space-y-3">
        <legend className="mb-2 block text-sm font-medium text-ink/90">Reserve price</legend>
        <p className="text-xs text-muted">
          No reserve listings usually get more bids.
        </p>
        <div className="grid gap-3 sm:grid-cols-2">
          <label
            className={`flex cursor-pointer flex-col rounded-2xl border p-4 transition ${
              reserveMode === "none"
                ? "border-accent bg-accent/10"
                : "border-border bg-page hover:border-accent/30"
            }`}
          >
            <input
              type="radio"
              name="reserve-mode"
              value="none"
              checked={reserveMode === "none"}
              onChange={() => {
                setReserveMode("none");
                setReservePrice("");
              }}
              className="sr-only"
            />
            <span className="text-sm font-semibold text-ink">No reserve</span>
            <span className="mt-1 text-xs text-accent">Recommended</span>
          </label>
          <label
            className={`flex cursor-pointer flex-col rounded-2xl border p-4 transition ${
              reserveMode === "set"
                ? "border-accent bg-accent/10"
                : "border-border bg-page hover:border-accent/30"
            }`}
          >
            <input
              type="radio"
              name="reserve-mode"
              value="set"
              checked={reserveMode === "set"}
              onChange={() => setReserveMode("set")}
              className="sr-only"
            />
            <span className="text-sm font-semibold text-ink">Set reserve price</span>
            <span className="mt-1 text-xs text-muted">Hidden from buyers</span>
          </label>
        </div>
        {reserveMode === "set" ? (
          <label className="block">
            <span className="mb-2 block text-xs font-medium uppercase tracking-wide text-muted">
              Reserve price (USD)
            </span>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={reservePrice}
              onChange={(event) => setReservePrice(event.target.value)}
              onBlur={() => markTouched("reservePrice")}
              aria-invalid={Boolean(showError("reservePrice"))}
              className={inputClass(Boolean(showError("reservePrice")))}
              placeholder="Must be above starting price"
            />
            <FieldError message={showError("reservePrice") || undefined} />
          </label>
        ) : null}
      </fieldset>

      <AuctionDurationSelector
        value={auctionDuration}
        onChange={setAuctionDuration}
        onBlur={() => markTouched("auctionDuration")}
        disabled={loading}
        error={showError("auctionDuration") || undefined}
      />

      {previewAuctionEnd ? (
        <p className="rounded-2xl border border-border bg-page px-4 py-3 text-sm text-muted">
          Auction ends{" "}
          <span className="font-medium text-ink">{formatAuctionEndDisplay(previewAuctionEnd)}</span>
        </p>
      ) : null}

      {formError ? (
        <p
          className="rounded-2xl border border-rose-500/30 bg-rose-950/40 px-4 py-3 text-sm text-rose-300"
          role="alert"
        >
          {formError}
        </p>
      ) : null}

      {submitAttempted && !isFormValid ? (
        <p className="text-sm text-muted">Please fix the highlighted fields before publishing.</p>
      ) : null}

      <button
        type="submit"
        disabled={submitDisabled}
        className="w-full rounded-full bg-accent px-5 py-3 text-sm font-medium text-black transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Publishing…" : "Publish listing"}
      </button>
    </form>
  );
}
