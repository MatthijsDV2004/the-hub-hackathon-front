"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import LoadingAnimation from "@/components/LoadingAnimation";
import HexPanel from "../../components/HexPanel";

type ShelfSummary = {
  id: string;
  name: string | null;
  locationDescription: string | null;
};

type InventoryItem = {
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

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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

type EditingCell = {
  itemId: string;
  field: "quantity" | "updatedAt";
  value: string;
};

export default function AdminStockPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedShelfId, setSelectedShelfId] = useState("all");
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

  const loadInventory = useCallback(async () => {
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/dataconnect/inventory-items?limit=500", {
        method: "GET",
      });

      const { json, text } = await readInventoryPayload(response);
      const payload = (json || {}) as {
        items?: InventoryItem[];
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
          : "Could not load admin inventory right now."
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

  const filteredItems = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);

    return items.filter((item) => {
      if (selectedShelfId !== "all") {
        const itemShelf = item.shelfId || "unassigned";
        if (itemShelf !== selectedShelfId) {
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
  }, [items, searchTerm, selectedShelfId]);

  const summary = useMemo(() => {
    const totalUnits = filteredItems.reduce((sum, item) => sum + item.quantity, 0);
    return {
      totalItems: filteredItems.length,
      totalUnits,
    };
  }, [filteredItems]);

  const runDelete = useCallback(
    async (scope: "all" | "item" | "shelf", value?: string) => {
      if (isDeleting) {
        return;
      }

      setError("");
      setStatus("");

      if (scope === "all") {
        const confirmed = window.confirm(
          "Delete ALL inventory items? This action cannot be undone."
        );
        if (!confirmed) {
          return;
        }
      }

      if (scope === "item" && value) {
        const confirmed = window.confirm("Delete this inventory item?");
        if (!confirmed) {
          return;
        }
      }

      if (scope === "shelf" && value && value !== "unassigned") {
        const confirmed = window.confirm(
          "Delete all inventory items in this shelf group?"
        );
        if (!confirmed) {
          return;
        }
      }

      if (scope === "shelf" && value === "unassigned") {
        const confirmed = window.confirm(
          "Delete all unassigned inventory items?"
        );
        if (!confirmed) {
          return;
        }
      }

      setIsDeleting(true);
      try {
        const query =
          scope === "all"
            ? "scope=all"
            : scope === "item"
              ? `scope=item&itemId=${encodeURIComponent(value || "")}`
              : value === "unassigned"
                ? "scope=shelf&shelfId="
                : `scope=shelf&shelfId=${encodeURIComponent(value || "")}`;

        if (scope === "shelf" && value === "unassigned") {
          const ids = items.filter((item) => !item.shelfId).map((item) => item.id);
          let deleted = 0;

          for (const id of ids) {
            const response = await fetch(
              `/api/dataconnect/inventory-items?scope=item&itemId=${encodeURIComponent(id)}`,
              { method: "DELETE" }
            );

            if (response.ok) {
              deleted += 1;
            }
          }

          await loadInventory();
          setStatus(`Deleted ${deleted} unassigned item${deleted === 1 ? "" : "s"}.`);
          return;
        }

        const response = await fetch(`/api/dataconnect/inventory-items?${query}`, {
          method: "DELETE",
        });

        const { json, text } = await readInventoryPayload(response);
        const payload = (json || {}) as {
          deletedCount?: number;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(payload.error || text.slice(0, 160) || "Delete request failed.");
        }

        await loadInventory();
        const deletedCount = payload.deletedCount ?? 0;
        setStatus(`Deleted ${deletedCount} item${deletedCount === 1 ? "" : "s"}.`);
      } catch (deleteError) {
        setError(
          deleteError instanceof Error
            ? deleteError.message
            : "Failed to delete inventory items."
        );
      } finally {
        setIsDeleting(false);
      }
    },
    [isDeleting, items, loadInventory]
  );

  const startEdit = useCallback((item: InventoryItem, field: "quantity" | "updatedAt") => {
    if (field === "quantity") {
      setEditingCell({ itemId: item.id, field, value: String(item.quantity) });
    } else {
      const iso = item.updatedAt ? new Date(item.updatedAt).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16);
      setEditingCell({ itemId: item.id, field, value: iso });
    }
    setError("");
    setStatus("");
  }, []);

  const saveEdit = useCallback(async () => {
    if (!editingCell || isSaving) return;
    const { itemId, field, value } = editingCell;

    setIsSaving(true);
    setError("");
    setStatus("");

    try {
      const body: Record<string, unknown> = { itemId };
      if (field === "quantity") {
        const q = Number(value);
        if (!Number.isFinite(q) || q < 0) {
          setError("Quantity must be a non-negative number.");
          setIsSaving(false);
          return;
        }
        body.quantity = Math.floor(q);
      } else {
        if (!value) {
          setError("Please enter a valid date and time.");
          setIsSaving(false);
          return;
        }
        body.updatedAt = new Date(value).toISOString();
      }

      const response = await fetch("/api/dataconnect/inventory-items", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const json = (await response.json()) as { error?: string; quantity?: number; updatedAt?: string };

      if (!response.ok) {
        throw new Error(json.error || "Failed to update item.");
      }

      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== itemId) return item;
          return {
            ...item,
            quantity: json.quantity ?? item.quantity,
            updatedAt: json.updatedAt ?? item.updatedAt,
          };
        })
      );

      setEditingCell(null);
      setStatus(`Updated ${field === "quantity" ? "quantity" : "timestamp"} successfully.`);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Failed to save changes.");
    } finally {
      setIsSaving(false);
    }
  }, [editingCell, isSaving]);

  const cancelEdit = useCallback(() => setEditingCell(null), []);

  const navLink = { padding: "8px 14px", borderRadius: 10, border: "1px solid var(--fp-panel-border)", color: "var(--fp-text-secondary)", fontSize: 13, fontWeight: 600, textDecoration: "none", background: "var(--fp-input-bg)" } as React.CSSProperties;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--fp-page-bg)", padding: "32px 24px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>

        <HexPanel contentStyle={{ padding: "20px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--fp-text-muted)", margin: "0 0 4px" }}>Admin Inventory</p>
            <h1 style={{ color: "var(--fp-text-primary)", fontSize: "clamp(22px, 5vw, 30px)", fontWeight: 800, margin: "0 0 4px" }}>Inventory Group Manager</h1>
            <p style={{ color: "var(--fp-text-secondary)", fontSize: 14, margin: "0 0 4px" }}>Search inventory, jump to a shelf group, and delete single items, shelf groups, or all inventory.</p>
            <p style={{ color: "var(--fp-text-muted)", fontSize: 12, margin: 0 }}>
              {isLoading ? "Loading inventory..." : `${summary.totalItems} items • ${summary.totalUnits} units shown`}
            </p>
          </div>
          <nav style={{ display: "flex", gap: 8 }}>
            <Link href="/admin" style={navLink}>Admin Dashboard</Link>
            <Link href="/inventory" style={navLink}>AI Upload</Link>
          </nav>
        </HexPanel>

        <HexPanel fill="var(--fp-surface-secondary)" contentStyle={{ padding: "20px 24px" }}>
          <div className="grid gap-3 md:grid-cols-[1.3fr_1fr_auto]">
            <label className="text-sm font-semibold text-slate-200">
              Search inventory
              <input
                type="search"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search by item, brand, category, shelf..."
                className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-300/60"
              />
            </label>

            <label className="text-sm font-semibold text-slate-200">
              Shelf group
              <select
                value={selectedShelfId}
                onChange={(event) => setSelectedShelfId(event.target.value)}
                className="mt-1 w-full rounded-lg border border-white/20 bg-slate-900 px-3 py-2 text-sm text-white outline-none transition focus:border-emerald-300/60"
              >
                <option value="all">All shelves</option>
                {shelfGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.label} ({group.itemCount})
                  </option>
                ))}
              </select>
            </label>

            <div className="flex items-end">
              <button
                type="button"
                disabled={isDeleting || isLoading || items.length === 0}
                onClick={() => void runDelete("all")}
                className="w-full rounded-lg border border-red-300/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-100 transition hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Delete All Items
              </button>
            </div>
          </div>

          {shelfGroups.length ? (
            <div className="mt-4 grid gap-2 md:grid-cols-2">
              {shelfGroups.map((group) => (
                <div
                  key={group.id}
                  className="rounded-lg border border-white/10 bg-slate-900/70 px-3 py-2"
                >
                  <p className="text-sm font-semibold text-emerald-100">{group.label}</p>
                  <p className="mt-1 text-xs text-slate-300">
                    {group.itemCount} items • {group.totalUnits} units
                    {group.location ? ` • ${group.location}` : ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedShelfId(group.id)}
                      className="rounded-md border border-white/20 px-2.5 py-1 text-xs text-slate-200 hover:border-emerald-300/60"
                    >
                      View Group
                    </button>
                    <button
                      type="button"
                      disabled={isDeleting}
                      onClick={() => void runDelete("shelf", group.id)}
                      className="rounded-md border border-red-300/40 bg-red-500/10 px-2.5 py-1 text-xs text-red-100 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Delete Group
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </HexPanel>

        {error ? (
          <div style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(220,38,38,0.4)", background: "rgba(220,38,38,0.08)", color: "#fca5a5", fontSize: 13 }}>
            {error}
          </div>
        ) : null}

        {status ? (
          <div style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(104,148,102,0.4)", background: "rgba(104,148,102,0.08)", color: "#86efac", fontSize: 13 }}>
            {status}
          </div>
        ) : null}

        <HexPanel fill="var(--fp-surface-secondary)" contentStyle={{ padding: "20px 24px" }}>
          <div className="overflow-auto rounded-lg border border-white/10">
            <table className="min-w-full divide-y divide-white/10 text-left text-sm">
              <thead className="bg-slate-800/70 text-slate-200">
                <tr>
                  <th className="px-3 py-2 font-semibold">Shelf</th>
                  <th className="px-3 py-2 font-semibold">Photo</th>
                  <th className="px-3 py-2 font-semibold">Brand</th>
                  <th className="px-3 py-2 font-semibold">Item</th>
                  <th className="px-3 py-2 font-semibold">Category</th>
                  <th className="px-3 py-2 font-semibold">Qty</th>
                  <th className="px-3 py-2 font-semibold">Updated</th>
                  <th className="px-3 py-2 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 bg-slate-900/60 text-slate-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={8} className="px-3 py-5 text-center text-slate-400">
                      <LoadingAnimation
                        message="Loading inventory..."
                        className="py-2"
                        iconClassName="h-20 w-20"
                        messageClassName="mt-2 text-sm font-medium text-slate-300"
                      />
                    </td>
                  </tr>
                ) : filteredItems.length ? (
                  filteredItems.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2 text-emerald-100">
                        {item.shelf?.name || (item.shelfId ? `Shelf ${item.shelfId.slice(0, 8)}` : "Unassigned")}
                      </td>
                      <td className="px-3 py-2">
                        {item.photoUrl ? (
                          <Image
                            src={item.photoUrl}
                            alt={`${item.name} photo`}
                            width={52}
                            height={52}
                            className="h-12 w-12 rounded-md border border-white/10 object-cover"
                          />
                        ) : (
                          <span className="text-xs text-slate-500">-</span>
                        )}
                      </td>
                      <td className="px-3 py-2">{item.brand}</td>
                      <td className="px-3 py-2 text-slate-100">{item.name}</td>
                      <td className="px-3 py-2">{item.category || "other"}</td>
                      <td className="px-3 py-2">
                        {editingCell?.itemId === item.id && editingCell.field === "quantity" ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min={0}
                              value={editingCell.value}
                              onChange={(e) => setEditingCell((c) => c ? { ...c, value: e.target.value } : null)}
                              onKeyDown={(e) => { if (e.key === "Enter") void saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                              className="w-20 rounded border border-emerald-300/50 bg-slate-800 px-1.5 py-0.5 text-sm text-white outline-none"
                              autoFocus
                            />
                            <button type="button" onClick={() => void saveEdit()} disabled={isSaving} className="rounded bg-emerald-600/80 px-1.5 py-0.5 text-xs text-white hover:bg-emerald-500 disabled:opacity-50">✓</button>
                            <button type="button" onClick={cancelEdit} className="rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300 hover:bg-slate-600">✕</button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(item, "quantity")}
                            className="rounded px-1 text-left hover:bg-emerald-900/40 hover:text-emerald-200"
                            title="Click to edit quantity"
                          >
                            {item.quantity}
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-2 text-slate-300">
                        {editingCell?.itemId === item.id && editingCell.field === "updatedAt" ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="datetime-local"
                              value={editingCell.value}
                              onChange={(e) => setEditingCell((c) => c ? { ...c, value: e.target.value } : null)}
                              onKeyDown={(e) => { if (e.key === "Enter") void saveEdit(); if (e.key === "Escape") cancelEdit(); }}
                              className="rounded border border-emerald-300/50 bg-slate-800 px-1.5 py-0.5 text-xs text-white outline-none"
                              autoFocus
                            />
                            <button type="button" onClick={() => void saveEdit()} disabled={isSaving} className="rounded bg-emerald-600/80 px-1.5 py-0.5 text-xs text-white hover:bg-emerald-500 disabled:opacity-50">✓</button>
                            <button type="button" onClick={cancelEdit} className="rounded bg-slate-700 px-1.5 py-0.5 text-xs text-slate-300 hover:bg-slate-600">✕</button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => startEdit(item, "updatedAt")}
                            className="rounded px-1 text-left hover:bg-emerald-900/40 hover:text-emerald-200"
                            title="Click to edit timestamp"
                          >
                            {formatTimestamp(item.updatedAt)}
                          </button>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          disabled={isDeleting}
                          onClick={() => void runDelete("item", item.id)}
                          className="rounded-md border border-red-300/40 bg-red-500/10 px-2.5 py-1 text-xs text-red-100 hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-3 py-5 text-center text-slate-400">
                      No inventory items match your filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </HexPanel>

        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <Link href="/admin" style={navLink}>Admin Dashboard</Link>
          <Link href="/inventory" style={navLink}>AI Inventory Upload</Link>
        </div>
      </div>
    </div>
  );
}
