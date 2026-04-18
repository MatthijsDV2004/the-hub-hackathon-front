import { executeDataConnect } from "@/lib/dataconnect";

type InventoryItemRow = {
  sku?: string | null;
  name?: string;
  quantity?: number;
  "package-size"?: string;
  category?: string;
  description?: string;
};

type SaveInventoryItemsBody = {
  items?: InventoryItemRow[];
};

type NormalizedRow = {
  name: string;
  brand: string;
  quantity: number;
  size: string | null;
  category: string | null;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_INSERT_MUTATION = `
mutation InsertInventoryItem(
  $name: String
  $brand: String
  $quantity: Int
  $size: String
  $category: String
  $description: String
  $createdAt: Timestamp
  $updatedAt: Timestamp
) {
  inventoryItem_insert(
    data: {
      name: $name
      brand: $brand
      quantity: $quantity
      size: $size
      category: $category
      description: $description
      createdAt: $createdAt
      updatedAt: $updatedAt
    }
  )
}
`.trim();

function normalizeItem(item: InventoryItemRow): NormalizedRow | null {
  const name = item.name?.trim() || "";
  if (!name) {
    return null;
  }

  const size = item["package-size"]?.trim() || null;
  const category = item.category?.trim() || null;
  const sku = item.sku?.trim() || "";
  const quantityRaw = Number(item.quantity);
  const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? Math.floor(quantityRaw) : 0;
  const nowIso = new Date().toISOString();

  return {
    name,
    brand: sku || "Unknown",
    quantity,
    size,
    category,
    description: item.description?.trim() || null,
    createdAt: nowIso,
    updatedAt: nowIso,
  };
}

function inferSavedCount(data: Record<string, unknown> | null, fallbackCount: number) {
  if (!data) {
    return fallbackCount;
  }

  for (const value of Object.values(data)) {
    if (Array.isArray(value)) {
      return value.length;
    }
  }

  for (const value of Object.values(data)) {
    if (!value || typeof value !== "object") {
      continue;
    }

    const record = value as Record<string, unknown>;
    const candidateKeys = [
      "affectedCount",
      "insertedCount",
      "count",
      "totalCount",
    ];

    for (const key of candidateKeys) {
      const candidate = record[key];
      if (typeof candidate === "number" && Number.isFinite(candidate)) {
        return candidate;
      }
    }
  }

  return fallbackCount;
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as SaveInventoryItemsBody;
    const rows = Array.isArray(body.items) ? body.items : [];

    if (!rows.length) {
      return Response.json({ error: "No items supplied." }, { status: 400 });
    }

    const normalized = rows.map(normalizeItem).filter((row): row is NormalizedRow => row !== null);
    if (!normalized.length) {
      return Response.json(
        { error: "No valid items with names to save." },
        { status: 400 }
      );
    }

    const customMutation = process.env.FIREBASE_DATA_CONNECT_INSERT_MUTATION?.trim();

    if (customMutation) {
      const { data } = await executeDataConnect(customMutation, {
        items: normalized,
      });
      return Response.json({ savedCount: inferSavedCount(data, normalized.length) });
    }

    let savedCount = 0;
    for (const row of normalized) {
      await executeDataConnect(DEFAULT_INSERT_MUTATION, {
        name: row.name,
        brand: row.brand,
        quantity: row.quantity,
        size: row.size,
        category: row.category,
        description: row.description,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      });
      savedCount += 1;
    }

    return Response.json({ savedCount });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to save inventory items through Data Connect.";

    return Response.json({ error: message }, { status: 500 });
  }
}
