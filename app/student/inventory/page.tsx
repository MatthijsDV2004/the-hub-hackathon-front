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

type ItemLocation = {
  centerX: number;
  centerY: number;
  radius: number;
  imageWidth: number;
  imageHeight: number;
};

type StudentInventoryItem = {
  id: string;
  shelfId: string | null;
  shelf: ShelfSummary | null;
  name: string;
  brand: string;
  quantity: number;
  category: string | null;
  type: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  description: string | null;
  photoUrl: string | null;
  size: string | null;
  location: ItemLocation | null;
};

type ClaimResponse = {
  message?: string;
  error?: string;
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

function normalizeUnknownDisplayValue(value: string | null | undefined) {
  const text = (value || "").trim();
  if (!text) {
    return "";
  }

  const withoutUnknownPrefix = text.replace(/^unknown[\s:-]*/i, "").trim();
  const normalizedOriginal = normalizeText(text);
  const normalizedCleaned = normalizeText(withoutUnknownPrefix);

  if (
    normalizedOriginal === "unknown" ||
    normalizedOriginal === "unknown brand" ||
    normalizedOriginal === "unknown item" ||
    normalizedCleaned === "unknown" ||
    normalizedCleaned === "unknown brand" ||
    normalizedCleaned === "unknown item"
  ) {
    return "";
  }

  return withoutUnknownPrefix || text;
}

function toTitleCase(value: string) {
  return value
    .split(" ")
    .filter(Boolean)
    .map((word) =>
      word.length > 2
        ? word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
        : word.toLowerCase()
    )
    .join(" ");
}

function buildDisplayProductTitle(item: Pick<StudentInventoryItem, "brand" | "name">) {
  const rawBrand = (item.brand || "").trim();
  const rawName = (item.name || "").trim();
  const cleanBrand = normalizeUnknownDisplayValue(rawBrand);
  const cleanName = normalizeUnknownDisplayValue(rawName);

  const nameStartedAsUnknown = /^unknown\b/i.test(rawName);
  const displayName =
    cleanName && nameStartedAsUnknown ? toTitleCase(cleanName) : cleanName;

  const combined = [cleanBrand, displayName].filter(Boolean).join(" ").trim();
  return combined || "Unknown item";
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function isCloudinaryUrl(url: string | null | undefined): boolean {
  if (!url) {
    return false;
  }
  return /res\.cloudinary\.com\//i.test(url) && /\/image\/upload\//i.test(url);
}

function isPreCroppedCloudinaryUrl(url: string | null | undefined): boolean {
  if (!isCloudinaryUrl(url)) {
    return false;
  }
  return /\/image\/upload\/[^/]*\bc_crop\b/i.test(url as string);
}

function buildCloudinaryCropUrl(
  photoUrl: string | null,
  location: ItemLocation | null,
  options: {
    padding?: number;
    minSize?: number;
    outputSize?: number;
    maxFraction?: number;
  } = {}
): string | null {
  if (!photoUrl || !isCloudinaryUrl(photoUrl)) {
    return null;
  }
  if (isPreCroppedCloudinaryUrl(photoUrl)) {
    return photoUrl;
  }
  if (!location) {
    return null;
  }

  const { centerX, centerY, radius, imageWidth, imageHeight } = location;
  if (
    !Number.isFinite(centerX) ||
    !Number.isFinite(centerY) ||
    !Number.isFinite(radius) ||
    !Number.isFinite(imageWidth) ||
    !Number.isFinite(imageHeight) ||
    imageWidth <= 0 ||
    imageHeight <= 0 ||
    radius <= 0
  ) {
    return null;
  }

  const padding = options.padding ?? 1.2;
  const minSize = options.minSize ?? 96;
  const outputSize = options.outputSize ?? 480;
  const maxFraction = options.maxFraction ?? 0.45;

  const smallerSide = Math.min(imageWidth, imageHeight);
  const hardMax = Math.max(minSize, Math.floor(smallerSide * maxFraction));
  const boxFromRadius = radius * 2 * padding;
  const cropSize = Math.max(
    1,
    Math.min(
      Math.round(Math.max(boxFromRadius, minSize)),
      hardMax,
      Math.floor(smallerSide)
    )
  );

  const maxX = Math.max(0, Math.floor(imageWidth) - cropSize);
  const maxY = Math.max(0, Math.floor(imageHeight) - cropSize);
  const cropX = clamp(Math.round(centerX - cropSize / 2), 0, maxX);
  const cropY = clamp(Math.round(centerY - cropSize / 2), 0, maxY);

  const transforms = [
    `c_crop,x_${cropX},y_${cropY},w_${cropSize},h_${cropSize}`,
    `c_fill,w_${outputSize},h_${outputSize}`,
    "q_auto,f_auto",
  ].join("/");

  return (photoUrl as string).replace(/\/image\/upload\//, `/image/upload/${transforms}/`);
}

function resolveItemImageUrl(
  item: Pick<StudentInventoryItem, "photoUrl" | "location">,
  options?: {
    outputSize?: number;
    padding?: number;
    minSize?: number;
    maxFraction?: number;
  }
): { src: string | null; isServerCropped: boolean } {
  const cloudinaryCrop = buildCloudinaryCropUrl(item.photoUrl, item.location, options);
  if (cloudinaryCrop) {
    return { src: cloudinaryCrop, isServerCropped: true };
  }
  return { src: item.photoUrl ?? null, isServerCropped: false };
}

function effectiveLocation(item: {
  photoUrl: string | null;
  location: ItemLocation | null;
}): ItemLocation | null {
  if (isPreCroppedCloudinaryUrl(item.photoUrl)) {
    return null;
  }
  if (isCloudinaryUrl(item.photoUrl) && item.location) {
    return null;
  }
  return item.location;
}

function initialZoomLevelFor(item: {
  photoUrl: string | null;
  location: ItemLocation | null;
}): number {
  return effectiveLocation(item) ? 1.35 : 1.8;
}

function buildZoomStyle(location: ItemLocation | null) {
  if (!location) {
    return {
      objectPosition: "50% 50%",
      transformOrigin: "50% 50%",
      transform: "scale(1)",
    } as const;
  }

  const xPct = clamp((location.centerX / location.imageWidth) * 100, 0, 100);
  const yPct = clamp((location.centerY / location.imageHeight) * 100, 0, 100);
  const diameter = Math.max(1, location.radius * 2);
  const reference = Math.max(1, Math.min(location.imageWidth, location.imageHeight));
  const zoomScale = clamp((reference / diameter) * 0.65, 1.2, 3.6);

  return {
    objectPosition: `${xPct}% ${yPct}%`,
    transformOrigin: `${xPct}% ${yPct}%`,
    transform: `scale(${zoomScale.toFixed(2)})`,
  } as const;
}

function buildModalZoomStyle(location: ItemLocation | null, zoomLevel: number) {
  if (!location) {
    return {
      objectPosition: "50% 50%",
      transformOrigin: "50% 50%",
      transform: `scale(${zoomLevel.toFixed(2)})`,
    } as const;
  }

  const baseStyle = buildZoomStyle(location);
  const baseScaleMatch = baseStyle.transform.match(/scale\(([^)]+)\)/);
  const baseScale = baseScaleMatch?.[1] ? Number(baseScaleMatch[1]) : 1;
  const effectiveScale = clamp(baseScale * zoomLevel, 1, 8);

  return {
    objectPosition: baseStyle.objectPosition,
    transformOrigin: baseStyle.transformOrigin,
    transform: `scale(${effectiveScale.toFixed(2)})`,
  } as const;
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
  const [claimStatus, setClaimStatus] = useState("");
  const [claimError, setClaimError] = useState("");
  const [claimingItemId, setClaimingItemId] = useState<string | null>(null);
  const [zoomItem, setZoomItem] = useState<StudentInventoryItem | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1.8);
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

  const onClaimItem = useCallback(
    async (itemId: string) => {
      setClaimError("");
      setClaimStatus("");
      setClaimingItemId(itemId);

      try {
        const response = await fetch("/api/dataconnect/claim", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ itemId, quantity: 1 }),
        });

        const { json, text } = await readInventoryPayload(response);
        const payload = (json || {}) as ClaimResponse;

        if (!response.ok) {
          const details =
            payload.error ||
            (text.trim().startsWith("<!DOCTYPE")
              ? "Received HTML instead of JSON from claim API."
              : text.slice(0, 160));
          throw new Error(details || `Claim failed (${response.status}).`);
        }

        setClaimStatus(payload.message || "Item claimed.");
        await loadInventory();
      } catch (claimRequestError) {
        setClaimError(
          claimRequestError instanceof Error
            ? claimRequestError.message
            : "Could not claim this item right now."
        );
      } finally {
        setClaimingItemId(null);
      }
    },
    [loadInventory]
  );

  const filteredItems = useMemo(() => {
    const normalizedSearch = normalizeText(searchTerm);

    if (!normalizedSearch) {
      return items;
    }

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
          item.type,
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
    const missingLocation = filteredItems.filter(
      (item) => !isPreCroppedCloudinaryUrl(item.photoUrl) && !item.location
    ).length;
    return {
      totalItems: filteredItems.length,
      totalUnits,
      missingLocation,
    };
  }, [filteredItems]);

  const closeZoomModal = () => {
    setZoomItem(null);
    setZoomLevel(1.8);
  };

  const navLink = { padding: "8px 14px", borderRadius: 10, border: "1px solid var(--fp-panel-border)", color: "var(--fp-text-secondary)", fontSize: 13, fontWeight: 600, textDecoration: "none", background: "var(--fp-input-bg)" } as React.CSSProperties;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--fp-page-bg)", padding: "32px 24px", boxSizing: "border-box" }}>
      <div style={{ maxWidth: 1400, margin: "0 auto", display: "flex", flexDirection: "column", gap: 20 }}>
        <HexPanel contentStyle={{ padding: "20px 24px", display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 14 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.14em", color: "var(--fp-text-muted)", margin: "0 0 4px" }}>Student · Pantry</p>
            <h1 style={{ color: "var(--fp-text-primary)", fontSize: "clamp(22px, 5vw, 30px)", fontWeight: 800, margin: "0 0 4px" }}>Available Inventory</h1>
            <p style={{ color: "var(--fp-text-secondary)", fontSize: 14, margin: 0 }}>Browse what&rsquo;s on the shelves right now and claim an item.</p>
          </div>
          <nav style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            <Link href="/" style={navLink}>Home</Link>
            <Link href="/hours" style={navLink}>Hours</Link>
            <Link href="/events" style={navLink}>Events</Link>
            <Link href="/login" style={navLink}>Login</Link>
          </nav>
        </HexPanel>
        <div className="space-y-5">

        {error ? (
          <div style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(220,38,38,0.4)", background: "rgba(220,38,38,0.08)", color: "#fca5a5", fontSize: 13 }}>
            {error}
          </div>
        ) : null}

        {claimError ? (
          <div style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(220,38,38,0.4)", background: "rgba(220,38,38,0.08)", color: "#fca5a5", fontSize: 13 }}>
            {claimError}
          </div>
        ) : null}

        {claimStatus ? (
          <div style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid rgba(104,148,102,0.4)", background: "rgba(104,148,102,0.08)", color: "#86efac", fontSize: 13 }}>
            {claimStatus}
          </div>
        ) : null}

        <HexPanel fill="var(--fp-surface-secondary)" contentStyle={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>
          <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--fp-text-secondary)" }}>
            Search
            <input
              type="search"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by product, brand, type, size..."
              style={{ marginTop: 6, width: "100%", boxSizing: "border-box", padding: "10px 14px", borderRadius: 10, border: "1px solid var(--fp-input-border)", background: "var(--fp-input-bg)", color: "var(--fp-text-primary)", fontSize: 14, outline: "none" }}
            />
          </label>

          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <p style={{ fontSize: 13, color: "var(--fp-text-secondary)", margin: "0 0 2px" }}>
                {isLoading
                  ? "Loading latest inventory..."
                  : `${inventorySummary.totalItems} item${inventorySummary.totalItems === 1 ? "" : "s"}${
                      searchTerm.trim() ? ` for "${searchTerm.trim()}"` : ""
                    }`}
              </p>
              <p style={{ fontSize: 11, color: "var(--fp-text-muted)", margin: 0 }}>
                {inventorySummary.totalUnits} unit{inventorySummary.totalUnits === 1 ? "" : "s"} available
                {inventorySummary.missingLocation
                  ? ` · ${inventorySummary.missingLocation} without per-item coordinates`
                  : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadInventory()}
              disabled={isLoading}
              style={{ padding: "8px 16px", borderRadius: 10, border: "1px solid var(--fp-input-border)", background: "var(--fp-input-bg)", color: "var(--fp-text-secondary)", fontSize: 13, fontWeight: 600, cursor: isLoading ? "not-allowed" : "pointer", opacity: isLoading ? 0.6 : 1 }}
            >
              Refresh
            </button>
          </div>
        </HexPanel>

        {filteredItems.length ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {filteredItems.map((item) => {
              const productTitle = buildDisplayProductTitle(item);
              const displayType =
                normalizeUnknownDisplayValue(item.type) ||
                normalizeUnknownDisplayValue(item.category) ||
                "other";
              const isOutOfStock = item.quantity <= 0;
              const isClaimingThisItem = claimingItemId === item.id;
              const { src: cardImageSrc, isServerCropped: cardUsesServerCrop } =
                resolveItemImageUrl(item, { outputSize: 480, padding: 1.2, minSize: 96 });
              const cardZoomStyle = cardUsesServerCrop
                ? buildZoomStyle(null)
                : buildZoomStyle(effectiveLocation(item));
              const hasLocation = Boolean(item.location);
              const isPreCropped = isPreCroppedCloudinaryUrl(item.photoUrl);
              const focusLabel = cardUsesServerCrop
                ? isPreCropped
                  ? "Item photo"
                  : "Per-item crop"
                : hasLocation
                  ? "Shelf photo"
                  : "No location";
              const focusClass = cardUsesServerCrop
                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                : hasLocation
                  ? "border-amber-200 bg-amber-50 text-amber-700"
                  : "border-slate-200 bg-white text-slate-500";

              return (
                <article
                  key={item.id}
                  className="flex flex-col overflow-hidden rounded-2xl border shadow-sm transition hover:shadow-md"
                  style={{ borderColor: "var(--fp-panel-border)", background: "var(--fp-surface-secondary)" }}
                >
                  <div className="relative flex h-40 items-center justify-center p-2" style={{ borderBottom: "1px solid var(--fp-panel-border)", background: "var(--fp-surface-primary)" }}>
                    <span className="absolute left-2 top-2 rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide" style={{ border: "1px solid var(--fp-input-border)", background: "var(--fp-input-bg)", color: "var(--fp-text-muted)" }}>
                      {displayType}
                    </span>
                    <span
                      title={focusLabel}
                      className={`absolute left-2 bottom-2 rounded-full border px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide ${focusClass}`}
                    >
                      {focusLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setZoomItem(item);
                        setZoomLevel(initialZoomLevelFor(item));
                      }}
                      className="absolute right-2 top-2 rounded-full border border-slate-300 bg-white/95 px-2 py-0.5 text-[10px] font-semibold text-slate-700 transition hover:bg-white"
                    >
                      Zoom
                    </button>

                    {cardImageSrc ? (
                      <div className="h-full w-full overflow-hidden rounded-lg bg-white">
                        <Image
                          src={cardImageSrc}
                          alt={`${productTitle} photo`}
                          width={300}
                          height={220}
                          unoptimized={cardUsesServerCrop}
                          className="h-full w-full object-contain"
                          style={cardZoomStyle}
                        />
                      </div>
                    ) : (
                      <div className="flex h-full w-full items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white text-xs text-slate-400">
                        No photo
                      </div>
                    )}
                  </div>

                  <div className="flex flex-1 flex-col gap-1 p-3">
                    <h2 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5" style={{ color: "var(--fp-text-primary)" }}>
                      {productTitle}
                    </h2>
                    <p className="text-xs" style={{ color: "var(--fp-text-muted)" }}>{item.size || "Size not listed"}</p>
                    <p className="text-xs font-medium" style={{ color: "var(--fp-text-secondary)" }}>
                      Qty: {item.quantity}
                      {isOutOfStock ? " · Out of stock" : ""}
                    </p>
                    <p className="text-[10px]" style={{ color: "var(--fp-text-muted)" }}>
                      Updated {formatTimestamp(item.updatedAt)}
                    </p>

                    <button
                      type="button"
                      disabled={isOutOfStock || isClaimingThisItem}
                      onClick={() => void onClaimItem(item.id)}
                      style={{ marginTop: "auto", width: "100%", padding: "8px 12px", borderRadius: 8, border: "none", background: isOutOfStock ? "var(--fp-input-bg)" : "var(--fp-button-accent)", color: "white", fontSize: 13, fontWeight: 700, cursor: isOutOfStock || isClaimingThisItem ? "not-allowed" : "pointer", opacity: isOutOfStock || isClaimingThisItem ? 0.6 : 1 }}
                    >
                      {isClaimingThisItem ? "Claiming..." : isOutOfStock ? "Unavailable" : "Claim"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div style={{ borderRadius: 16, border: "1px solid var(--fp-panel-border)", background: "var(--fp-surface-secondary)", padding: "40px 16px", textAlign: "center" }}>
            {isLoading ? (
              <LoadingAnimation
                message="Loading latest inventory..."
                className="py-2"
                iconClassName="h-20 w-20"
                messageClassName="mt-2 text-sm font-medium text-slate-300"
              />
            ) : (
              <p style={{ fontSize: 15, fontWeight: 600, color: "var(--fp-text-primary)" }}>No items match your search.</p>
            )}
            {!isLoading ? (
              <p style={{ marginTop: 4, fontSize: 13, color: "var(--fp-text-muted)" }}>
                Try searching for chips, cereal, pasta, or clearing the search box.
              </p>
            ) : null}
          </div>
        )}

        {zoomItem && zoomItem.photoUrl ? (() => {
          const { src: modalImageSrc, isServerCropped: modalUsesServerCrop } =
            resolveItemImageUrl(zoomItem, {
              outputSize: 1200,
              padding: 1.35,
              minSize: 160,
              maxFraction: 0.6,
            });
          const modalSrc = modalImageSrc ?? zoomItem.photoUrl;
          const modalStyle = modalUsesServerCrop
            ? { objectPosition: "50% 50%", transformOrigin: "50% 50%", transform: `scale(${zoomLevel.toFixed(2)})` }
            : buildModalZoomStyle(effectiveLocation(zoomItem), zoomLevel);
          const autoFocused = modalUsesServerCrop || Boolean(effectiveLocation(zoomItem));

          return (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4 py-6" style={{ background: "rgba(10,18,30,0.85)" }}>
            <div className="w-full max-w-4xl rounded-2xl p-4 shadow-2xl" style={{ border: "1px solid var(--fp-panel-border)", background: "var(--fp-surface-primary)" }}>
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: "var(--fp-text-primary)", margin: 0 }}>
                    {buildDisplayProductTitle(zoomItem)}
                  </p>
                  <p style={{ fontSize: 11, color: "var(--fp-text-muted)", margin: 0 }}>
                    {autoFocused
                      ? "Auto-focused on the item. Use the slider to zoom further."
                      : "Showing the product photo. Use the slider to zoom in."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeZoomModal}
                  style={{ padding: "8px 16px", borderRadius: 8, border: "1px solid var(--fp-input-border)", background: "var(--fp-input-bg)", color: "var(--fp-text-secondary)", fontSize: 13, fontWeight: 600, cursor: "pointer" }}
                >
                  Close
                </button>
              </div>

              <div className="relative h-[68vh] overflow-hidden rounded-xl p-4" style={{ border: "1px solid var(--fp-panel-border)", background: "var(--fp-surface-secondary)" }}>
                <Image
                  src={modalSrc}
                  alt={`${buildDisplayProductTitle(zoomItem)} zoomed photo`}
                  width={1600}
                  height={1200}
                  unoptimized={modalUsesServerCrop}
                  className="h-full w-full object-contain transition-transform duration-150"
                  style={modalStyle}
                />
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-3">
                <label style={{ display: "flex", flex: 1, alignItems: "center", gap: 12, fontSize: 12, fontWeight: 600, color: "var(--fp-text-secondary)" }}>
                  Zoom
                  <input
                    type="range"
                    min={1}
                    max={4}
                    step={0.05}
                    value={zoomLevel}
                    onChange={(event) => setZoomLevel(Number(event.target.value))}
                    style={{ flex: 1 }}
                  />
                </label>
                <span style={{ width: 56, borderRadius: 6, border: "1px solid var(--fp-input-border)", background: "var(--fp-input-bg)", padding: "4px 8px", textAlign: "center", fontSize: 11, color: "var(--fp-text-secondary)" }}>
                  {zoomLevel.toFixed(2)}x
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(initialZoomLevelFor(zoomItem))}
                  style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--fp-input-border)", background: "var(--fp-input-bg)", color: "var(--fp-text-secondary)", fontSize: 12, fontWeight: 600, cursor: "pointer" }}
                >
                  Reset
                </button>
              </div>
            </div>
          </div>
          );
        })() : null}

        <p style={{ fontSize: 11, color: "var(--fp-text-muted)" }}>Live data source: /api/dataconnect/inventory-items</p>
        </div>
      </div>
    </div>
  );
}