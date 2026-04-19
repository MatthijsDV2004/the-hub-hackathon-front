"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import LoadingAnimation from "@/components/LoadingAnimation";

type ShelfSummary = {
  id: string;
  name: string | null;
  locationDescription: string | null;
};

type StudentInventoryItem = {
  id: string;
  shelfId: string | null;
  shelf: ShelfSummary | null;
  name: string;
  brand: string;
  quantity: number;
  category: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  description: string | null;
  photoUrl: string | null;
  size: string | null;
};

function formatTimestamp(value: string | null) {
  if (!value) return "-";

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) return value;

  const now = Date.now();
  const diffMs = now - parsed;

  const minutes = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(diffMs / (1000 * 60 * 60));

  if (minutes === 0) return "Just updated";

  if (minutes < 60) {
    if (minutes <= 1) return "Last updated 1 minute ago";
    return `Last updated ${minutes} minutes ago`;
  }

  if (hours === 1) return "Last updated 1 hour ago";
  if (hours < 24) return `Last updated ${hours} hours ago`;

  return new Date(parsed).toLocaleDateString();
}

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

async function readInventoryPayload(response: Response): Promise<{
  json: Record<string, unknown> | null;
  text: string;
}> {
  const rawText = await response.text();
  if (!rawText) {
    return { json: null, text: "" };
  }

  try {
    const parsed = JSON.parse(rawText) as Record<string, unknown>;
    return { json: parsed, text: rawText };
  } catch {
    return { json: null, text: rawText };
  }
}

function InventoryImage({
  src,
  alt,
  category,
}: {
  src: string | null;
  alt: string;
  category: string | null;
}) {
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-[#1D4ED8]/10 bg-[#F3F7FF]">
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-contain p-3" />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-sm font-medium text-[#35507A]">
          No image
        </div>
      )}
      {category && (
        <span className="absolute right-2.5 top-2.5 rounded-md bg-[#123B7A] px-2 py-0.5 text-[10px] font-semibold uppercase tracking-widest text-white">
          {category}
        </span>
      )}
    </div>
  );
}

export default function StudentInventoryPage() {
  const [items, setItems] = useState<StudentInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShelfId, setSelectedShelfId] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/dataconnect/inventory-items?limit=500", {
        method: "GET",
      });

      const { json, text } = await readInventoryPayload(response);
      const payload = (json || {}) as {
        items?: StudentInventoryItem[];
        error?: string;
      };

      if (!response.ok) {
        const details =
          payload.error ||
          (text.trim().startsWith("<!DOCTYPE")
            ? "Received HTML instead of JSON from inventory API."
            : text.slice(0, 160));

        throw new Error(details || `Failed to load inventory (${response.status}).`);
      }

      setItems(Array.isArray(payload.items) ? payload.items : []);
    } catch (loadError) {
      setItems([]);
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Could not load student inventory right now."
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const timerId = setTimeout(() => {
      void loadInventory();
    }, 0);

    return () => {
      clearTimeout(timerId);
    };
  }, [loadInventory]);

  const shelfGroups = useMemo(() => {
    const map = new Map<
      string,
      { id: string; label: string; location: string | null; itemCount: number; totalUnits: number }
    >();

    for (const item of items) {
      const id = item.shelfId || "unassigned";
      const defaultLabel = item.shelfId ? `Shelf ${item.shelfId.slice(0, 8)}` : "Unassigned";
      const label = item.shelf?.name || defaultLabel;
      const location = item.shelf?.locationDescription || null;

      const current = map.get(id);
      if (!current) {
        map.set(id, {
          id,
          label,
          location,
          itemCount: 1,
          totalUnits: item.quantity,
        });
        continue;
      }

      current.itemCount += 1;
      current.totalUnits += item.quantity;
      if (!current.location && location) {
        current.location = location;
      }
    }

    return Array.from(map.values()).sort((a, b) => b.itemCount - a.itemCount);
  }, [items]);

  const categoryOptions = useMemo(() => {
    const values = Array.from(
      new Set(
        items
          .map((item) => item.category?.trim())
          .filter((value): value is string => Boolean(value))
      )
    );

    return values.sort((a, b) => a.localeCompare(b));
  }, [items]);

  const filteredItems = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);

    return items.filter((item) => {
      if (selectedShelfId !== "all") {
        const itemShelf = item.shelfId || "unassigned";
        if (itemShelf !== selectedShelfId) {
          return false;
        }
      }

      if (selectedCategory !== "all") {
        const itemCategory = item.category?.trim().toLowerCase() || "other";
        if (itemCategory !== selectedCategory.toLowerCase()) {
          return false;
        }
      }

      if (!normalizedSearch) {
        return true;
      }

      const haystack = normalizeText(
        [
          item.brand,
          item.name,
          item.category,
          item.size,
          item.description,
          item.shelf?.name,
          item.shelf?.locationDescription,
        ]
          .filter(Boolean)
          .join(" ")
      );

      return haystack.includes(normalizedSearch);
    });
  }, [items, searchTerm, selectedShelfId, selectedCategory]);

  const inventorySummary = useMemo(() => {
    const totalUnits = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
    return {
      totalItems: filteredItems.length,
      totalUnits,
    };
  }, [filteredItems]);

  return (
    <div className="min-h-screen bg-[#F8F6F2] px-4 py-8 text-[#243B53] md:px-8">
      <main className="mx-auto w-full max-w-7xl space-y-6 rounded-3xl border border-[#1D4ED8]/10 bg-white p-5 shadow-[0_18px_50px_rgba(36,59,83,0.08)] md:p-8">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-[#1D4ED8]/10 pb-5">
          <div>
            <h1 className="mt-3 text-3xl font-semibold leading-tight text-[#123B7A] md:text-5xl">
              Current Hub Inventory
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#486581] md:text-base">
              Inventory grouped by shelf upload so you can find specific stock faster.
            </p>
            <p className="mt-2 text-sm text-[#6B7C93]">
              {isLoading
                ? "Loading latest inventory..."
                : `${inventorySummary.totalItems} items • ${inventorySummary.totalUnits} units shown`}
            </p>
          </div>

          <nav className="flex flex-wrap gap-2 text-sm">
            <Link
              href="/"
              className="rounded-lg border border-[#1D4ED8]/15 bg-white px-3 py-2 text-[#35507A] transition hover:border-[#1D4ED8]/35 hover:text-[#123B7A]"
            >
              Home
            </Link>
            <Link
              href="/hours"
              className="rounded-lg border border-[#1D4ED8]/15 bg-white px-3 py-2 text-[#35507A] transition hover:border-[#1D4ED8]/35 hover:text-[#123B7A]"
            >
              Hours
            </Link>
            <Link
              href="/events"
              className="rounded-lg border border-[#1D4ED8]/15 bg-white px-3 py-2 text-[#35507A] transition hover:border-[#1D4ED8]/35 hover:text-[#123B7A]"
            >
              Events
            </Link>
            <button
              type="button"
              onClick={() => void loadInventory()}
              className="rounded-lg border border-[#1D4ED8]/15 bg-[#123B7A] px-3 py-2 font-medium text-white transition hover:bg-[#0e2f61]"
            >
              Refresh
            </button>
          </nav>
        </header>

        {error ? (
          <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <section className="rounded-2xl border border-[#1D4ED8]/10 bg-[#FCFDFF] p-4">
          <div className="grid gap-4 md:grid-cols-[1.4fr_1fr_1fr]">
            <label className="text-sm font-medium text-[#243B53]">
              Search inventory
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by item, brand, category, shelf..."
                className="mt-1 w-full rounded-xl border border-[#1D4ED8]/15 bg-white px-3 py-2.5 text-sm text-[#243B53] outline-none transition placeholder:text-[#7B8794] focus:border-[#1D4ED8]/50"
              />
            </label>

            <label className="text-sm font-medium text-[#243B53]">
              Shelf group
              <select
                value={selectedShelfId}
                onChange={(event) => setSelectedShelfId(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#1D4ED8]/15 bg-white px-3 py-2.5 text-sm text-[#243B53] outline-none transition focus:border-[#1D4ED8]/50"
              >
                <option value="all">All shelves</option>
                {shelfGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.label} ({group.itemCount} items)
                  </option>
                ))}
              </select>
            </label>

            <label className="text-sm font-medium text-[#243B53]">
              Category
              <select
                value={selectedCategory}
                onChange={(event) => setSelectedCategory(event.target.value)}
                className="mt-1 w-full rounded-xl border border-[#1D4ED8]/15 bg-white px-3 py-2.5 text-sm text-[#243B53] outline-none transition focus:border-[#1D4ED8]/50"
              >
                <option value="all">All categories</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category.toLowerCase()}>
                    {category}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {categoryOptions.length ? (
            <div className="mt-4 flex flex-wrap gap-2">
              {categoryOptions.map((category) => {
                const isActive = selectedCategory.toLowerCase() === category.toLowerCase();
                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() =>
                      setSelectedCategory(isActive ? "all" : category.toLowerCase())
                    }
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      isActive
                        ? "bg-[#123B7A] text-white"
                        : "border border-[#1D4ED8]/15 bg-white text-[#35507A] hover:border-[#1D4ED8]/35 hover:text-[#123B7A]"
                    }`}
                  >
                    {category}
                  </button>
                );
              })}
            </div>
          ) : null}
        </section>

        <section>
          {isLoading ? (
            <div className="rounded-2xl border border-[#1D4ED8]/10 bg-white py-12">
              <LoadingAnimation />
            </div>
          ) : filteredItems.length ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <article
                  key={item.id}
                  className="overflow-hidden rounded-3xl border border-[#1D4ED8]/10 bg-white shadow-[0_10px_30px_rgba(36,59,83,0.08)] transition hover:-translate-y-0.5 hover:border-[#1D4ED8]/35"
                >
                  <div className="p-4">
                    <InventoryImage
                      src={item.photoUrl}
                      alt={item.name}
                      category={item.category ?? null}
                    />
                  </div>

                  <div className="border-t border-[#1D4ED8]/10 px-4 pb-4 pt-3">
                    <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#9A6B00]">
                      {item.brand || "Unknown brand"}
                    </p>

                    <h2 className="mt-2 line-clamp-2 min-h-[3.5rem] text-xl font-semibold leading-7 text-[#123B7A]">
                      {item.name}
                    </h2>

                    <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl border border-[#1D4ED8]/10 bg-[#F8FAFF] px-3 py-2">
                        <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#7B8794]">
                          Quantity
                        </p>
                        <p className="mt-1 text-base font-semibold text-[#123B7A]">
                          {item.quantity}
                        </p>
                      </div>
                      <div className="rounded-xl border border-[#1D4ED8]/10 bg-[#F8FAFF] px-3 py-2">
                        <p className="text-xs font-medium uppercase tracking-[0.08em] text-[#7B8794]">
                          Size
                        </p>
                        <p className="mt-1 text-base font-semibold text-[#123B7A]">
                          {item.size || "—"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 rounded-xl border border-[#1D4ED8]/10 bg-[#FCFDFF] px-3 py-2 text-sm">
                      <p className="font-medium text-[#243B53]">
                        {item.shelf?.name ||
                          (item.shelfId ? `Shelf ${item.shelfId.slice(0, 8)}` : "Unassigned")}
                      </p>
                      {item.shelf?.locationDescription ? (
                        <p className="mt-1 text-xs text-[#6B7C93]">
                          {item.shelf.locationDescription}
                        </p>
                      ) : null}
                    </div>

                    <p className="mt-3 text-xs text-[#6B7C93]">
                      {formatTimestamp(item.updatedAt)}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-[#1D4ED8]/10 bg-white px-4 py-10 text-center text-[#6B7C93]">
              No inventory items match your current filters.
            </div>
          )}
        </section>

        <p className="text-sm text-[#6B7C93]">
          Live data source: /api/dataconnect/inventory-items
        </p>
      </main>
    </div>
  );
}