import { getPostgresPool } from "@/lib/postgres";

type InventoryItemRow = {
  sku?: string | null;
  name?: string;
  quantity?: number;
  "package-size"?: string;
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
  description: string | null;
};

function normalizeItem(item: InventoryItemRow): NormalizedRow | null {
  const name = item.name?.trim() || "";
  if (!name) {
    return null;
  }

  const size = item["package-size"]?.trim() || null;
  const sku = item.sku?.trim() || "";
  const quantityRaw = Number(item.quantity);
  const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? Math.floor(quantityRaw) : 0;

  return {
    name,
    brand: sku || "Unknown",
    quantity,
    size,
    description: item.description?.trim() || null,
  };
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

    const pool = getPostgresPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      for (const item of normalized) {
        await client.query(
          `INSERT INTO "InventoryItem" ("name", "brand", "quantity", "createdAt", "updatedAt", "description", "size")
           VALUES ($1, $2, $3, NOW(), NOW(), $4, $5)`,
          [item.name, item.brand, item.quantity, item.description, item.size]
        );
      }

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }

    return Response.json({ savedCount: normalized.length });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to save inventory items to Data Connect Postgres.";
    return Response.json({ error: message }, { status: 500 });
  }
}
