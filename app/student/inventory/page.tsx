"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type StudentInventoryItem = {
  id: string;
  shelfId: string | null;
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
  if (!value) {
    return "-";
  }

  const parsed = Date.parse(value);
  if (!Number.isFinite(parsed)) {
    return value;
  }

  return new Date(parsed).toLocaleString();
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

export default function StudentInventoryPage() {
  const [items, setItems] = useState<StudentInventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/dataconnect/inventory-items?limit=250", {
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

  const inventorySummary = useMemo(() => {
    const totalUnits = items.reduce((sum, item) => sum + item.quantity, 0);
    return {
      totalItems: items.length,
      totalUnits,
    };
  }, [items]);

  return (
    <div className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100 md:px-8">
      <main className="mx-auto w-full max-w-5xl space-y-5 rounded-3xl border border-white/10 bg-slate-900/50 p-5 shadow-2xl md:p-8">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="inline-flex rounded-full border border-cyan-300/40 bg-cyan-300/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-cyan-100">
              Student View
            </p>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white md:text-4xl">
              Current Hub Inventory
            </h1>
            <p className="mt-2 text-sm text-slate-300 md:text-base">
              Updated from staff shelf photos so you can check stock before you visit The Hub.
            </p>
            <p className="mt-2 text-xs text-slate-400">
              {isLoading
                ? "Loading latest inventory..."
                : `${inventorySummary.totalItems} items • ${inventorySummary.totalUnits} units total`}
            </p>
          </div>
          <nav className="flex flex-wrap gap-2 text-xs">
            <Link href="/" className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:border-cyan-300/60">
              Home
            </Link>
            <Link href="/hours" className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:border-cyan-300/60">
              Hours
            </Link>
            <Link href="/events" className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:border-cyan-300/60">
              Events
            </Link>
            <button
              type="button"
              onClick={() => void loadInventory()}
              className="rounded-lg border border-white/15 px-3 py-1.5 text-slate-200 hover:border-cyan-300/60"
            >
              Refresh
            </button>
          </nav>
        </header>

        {error ? (
          <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        <section className="rounded-2xl border border-white/10 bg-slate-950/40 p-4">
          <div className="overflow-auto rounded-xl border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-slate-800/70 text-slate-200">
                <tr>
                  <th className="px-3 py-2 font-semibold">Brand</th>
                  <th className="px-3 py-2 font-semibold">Item</th>
                  <th className="px-3 py-2 font-semibold">Category</th>
                  <th className="px-3 py-2 font-semibold">Qty</th>
                  <th className="px-3 py-2 font-semibold">Size</th>
                  <th className="px-3 py-2 font-semibold">Last Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-slate-900/60 text-slate-200">
                {items.length ? (
                  items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">{item.brand}</td>
                      <td className="px-3 py-2 text-slate-100">{item.name}</td>
                      <td className="px-3 py-2">{item.category || "other"}</td>
                      <td className="px-3 py-2">{item.quantity}</td>
                      <td className="px-3 py-2">{item.size || "-"}</td>
                      <td className="px-3 py-2 text-emerald-200">{formatTimestamp(item.updatedAt)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-3 py-5 text-center text-slate-400">
                      {isLoading ? "Loading inventory..." : "No inventory items found yet."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <p className="text-sm text-slate-400">
          Live data source: /api/dataconnect/inventory-items
        </p>
      </main>
    </div>
  );
}
