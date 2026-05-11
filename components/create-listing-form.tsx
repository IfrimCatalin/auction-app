"use client";

import { FormEvent, useState } from "react";
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

export function CreateListingForm({ sellerId }: CreateListingFormProps) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categoryOptions[0]);
  const [startingPrice, setStartingPrice] = useState("");
  const [auctionEnd, setAuctionEnd] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage("");
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
    <form onSubmit={handleSubmit} className="mt-8 space-y-4">
      <label className="block">
        <span className="mb-2 block text-sm text-slate-300">Title</span>
        <input
          type="text"
          required
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none ring-cyan-300 transition placeholder:text-slate-500 focus:ring-2"
          placeholder="Luxury watch, rare collectible..."
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm text-slate-300">Description</span>
        <textarea
          required
          rows={4}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none ring-cyan-300 transition placeholder:text-slate-500 focus:ring-2"
          placeholder="Describe the condition, authenticity, included items, and details."
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm text-slate-300">Category</span>
        <select
          value={category}
          onChange={(event) => setCategory(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none ring-cyan-300 transition focus:ring-2"
        >
          {categoryOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="mb-2 block text-sm text-slate-300">Starting Price</span>
        <input
          type="number"
          required
          min="0.01"
          step="0.01"
          value={startingPrice}
          onChange={(event) => setStartingPrice(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none ring-cyan-300 transition placeholder:text-slate-500 focus:ring-2"
          placeholder="500.00"
        />
      </label>

      <label className="block">
        <span className="mb-2 block text-sm text-slate-300">Auction End Date</span>
        <input
          type="datetime-local"
          required
          value={auctionEnd}
          onChange={(event) => setAuctionEnd(event.target.value)}
          className="w-full rounded-xl border border-white/10 bg-slate-950/70 px-4 py-3 text-slate-100 outline-none ring-cyan-300 transition focus:ring-2"
        />
      </label>

      {errorMessage ? (
        <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
          {errorMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-full bg-cyan-400 px-5 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Creating listing..." : "Create Listing"}
      </button>
    </form>
  );
}
