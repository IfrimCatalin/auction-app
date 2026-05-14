"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type CreateListingFormProps = {
  sellerId: string;
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

const inputClass =
  "w-full rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-900 outline-none transition placeholder:text-stone-400 focus:border-stone-900";

export function CreateListingForm({ sellerId }: CreateListingFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categoryOptions[0]);
  const [startingPrice, setStartingPrice] = useState("");
  const [auctionEnd, setAuctionEnd] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    setErrorMessage("");
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select an image file.");
      event.target.value = "";
      return;
    }

    if (file.size > MAX_IMAGE_BYTES) {
      setErrorMessage("Image must be 5 MB or smaller.");
      event.target.value = "";
      return;
    }

    setUploading(true);

    const extension = file.name.includes(".")
      ? file.name.split(".").pop()!.toLowerCase()
      : "jpg";
    const path = `${sellerId}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(STORAGE_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) {
      setErrorMessage(`Image upload failed: ${uploadError.message}`);
      setUploading(false);
      event.target.value = "";
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(path);

    setImageUrl(publicUrlData.publicUrl);
    setUploading(false);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");

    if (uploading) {
      setErrorMessage("Please wait for the image to finish uploading.");
      return;
    }

    setLoading(true);

    const parsedPrice = Number(startingPrice);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) {
      setErrorMessage("Starting price must be a valid number greater than 0.");
      setLoading(false);
      return;
    }

    const auctionEndDate = new Date(auctionEnd);
    if (Number.isNaN(auctionEndDate.getTime())) {
      setErrorMessage("Please choose a valid auction end date.");
      setLoading(false);
      return;
    }

    const { error } = await supabase.from("listings").insert({
      title,
      description,
      category,
      starting_price: parsedPrice,
      current_price: parsedPrice,
      auction_end: auctionEndDate.toISOString(),
      status: "active",
      seller_id: sellerId,
      image_url: imageUrl,
    });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-2 block text-sm font-medium text-stone-700">Photo</label>
        <div className="overflow-hidden rounded-2xl border border-dashed border-stone-300 bg-stone-50">
          {uploading ? (
            <div className="flex aspect-[4/3] w-full items-center justify-center text-sm text-stone-500">
              Uploading…
            </div>
          ) : imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt="Listing preview"
              className="aspect-[4/3] w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] w-full items-center justify-center text-xs text-stone-500">
              PNG or JPG · up to 5 MB
            </div>
          )}
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          disabled={uploading || loading}
          className="mt-3 block w-full cursor-pointer rounded-2xl border border-stone-300 bg-white px-4 py-3 text-sm text-stone-700 file:mr-4 file:rounded-full file:border-0 file:bg-stone-900 file:px-4 file:py-2 file:font-medium file:text-white hover:file:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-stone-700">Title</span>
        <input
          type="text"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className={inputClass}
          placeholder="What are you selling?"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-stone-700">Description</span>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className={inputClass}
          placeholder="Condition, authenticity, what’s included…"
        />
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Category</span>
          <select
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            className={inputClass}
          >
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-stone-700">Starting price</span>
          <input
            type="number"
            required
            min="0.01"
            step="0.01"
            value={startingPrice}
            onChange={(event) => setStartingPrice(event.target.value)}
            className={inputClass}
            placeholder="500.00"
          />
        </label>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-stone-700">Auction end</span>
        <input
          type="datetime-local"
          required
          value={auctionEnd}
          onChange={(event) => setAuctionEnd(event.target.value)}
          className={inputClass}
        />
      </label>

      {errorMessage ? (
        <p className="rounded-2xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading || uploading}
        className="w-full rounded-full bg-stone-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-stone-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Publishing…" : "Publish listing"}
      </button>
    </form>
  );
}
