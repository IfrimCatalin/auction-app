"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type CreateListingFormProps = {
  sellerId: string;
};

type FieldErrors = {
  title?: string;
  description?: string;
  category?: string;
  startingPrice?: string;
  auctionEnd?: string;
};

type TouchedFields = {
  title?: boolean;
  description?: boolean;
  category?: boolean;
  startingPrice?: boolean;
  auctionEnd?: boolean;
};

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
};

const categoryOptions = [
  "Watches",
  "Art",
  "Cars",
  "Sneakers",
  "Tech",
  "Memorabilia",
  "Other",
];

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

function validateForm(values: {
  title: string;
  description: string;
  category: string;
  startingPrice: string;
  auctionEnd: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.title.trim()) {
    errors.title = "Title is required.";
  }

  if (!values.description.trim()) {
    errors.description = "Description is required.";
  }

  if (!values.category || !categoryOptions.includes(values.category)) {
    errors.category = "Please select a category.";
  }

  const priceRaw = values.startingPrice.trim();
  const parsedPrice = Number(priceRaw);
  if (!priceRaw) {
    errors.startingPrice = "Starting price is required.";
  } else if (!Number.isFinite(parsedPrice)) {
    errors.startingPrice = "Enter a valid number.";
  } else if (parsedPrice <= 0) {
    errors.startingPrice = "Starting price must be greater than 0.";
  }

  const endRaw = values.auctionEnd.trim();
  if (!endRaw) {
    errors.auctionEnd = "Auction end date is required.";
  } else {
    const auctionEndDate = new Date(endRaw);
    if (Number.isNaN(auctionEndDate.getTime())) {
      errors.auctionEnd = "Enter a valid date and time.";
    } else if (auctionEndDate.getTime() <= Date.now()) {
      errors.auctionEnd = "Auction end must be in the future.";
    }
  }

  return errors;
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
  const [category, setCategory] = useState(categoryOptions[0]);
  const [startingPrice, setStartingPrice] = useState("");
  const [auctionEnd, setAuctionEnd] = useState("");
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [touched, setTouched] = useState<TouchedFields>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const fieldErrors = useMemo(
    () =>
      validateForm({
        title,
        description,
        category,
        startingPrice,
        auctionEnd,
      }),
    [title, description, category, startingPrice, auctionEnd]
  );

  const isFormValid = Object.keys(fieldErrors).length === 0;
  const submitDisabled = !isFormValid || loading;

  const showError = (field: keyof FieldErrors) =>
    (submitAttempted || touched[field]) && fieldErrors[field];

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

    const errors = validateForm({
      title,
      description,
      category,
      startingPrice,
      auctionEnd,
    });

    if (Object.keys(errors).length > 0) {
      return;
    }

    setLoading(true);

    const parsedPrice = Number(startingPrice);
    const auctionEndDate = new Date(auctionEnd);

    const { data: listing, error: listingError } = await supabase
      .from("listings")
      .insert({
        title: title.trim(),
        description: description.trim(),
        category,
        starting_price: parsedPrice,
        current_price: parsedPrice,
        auction_end: auctionEndDate.toISOString(),
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

  const minAuctionEnd = useMemo(() => {
    const nextMinute = new Date(Date.now() + 60_000);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${nextMinute.getFullYear()}-${pad(nextMinute.getMonth() + 1)}-${pad(nextMinute.getDate())}T${pad(nextMinute.getHours())}:${pad(nextMinute.getMinutes())}`;
  }, []);

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
            {categoryOptions.map((option) => (
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

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-ink/90">Auction end</span>
        <input
          type="datetime-local"
          value={auctionEnd}
          min={minAuctionEnd}
          onChange={(event) => setAuctionEnd(event.target.value)}
          onBlur={() => markTouched("auctionEnd")}
          aria-invalid={Boolean(showError("auctionEnd"))}
          className={inputClass(Boolean(showError("auctionEnd")))}
        />
        <FieldError message={showError("auctionEnd") || undefined} />
        <p className="mt-1.5 text-xs text-muted">Must be a future date and time.</p>
      </label>

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
