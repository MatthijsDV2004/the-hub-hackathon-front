import { executeDataConnect } from "@/lib/dataconnect";
import { extractHubDomainMarker, isHubVisibleToDomain } from "@/lib/auth/hub-domain";
import { requireHubRole } from "@/lib/auth/request";

type ClaimBody = {
  itemId?: string;
  quantity?: number;
};

type ClaimInventoryRow = {
  id: string;
  name: string;
  brand: string;
  quantity: number;
  shelfLocationDescription: string | null;
};

const CLAIM_LIST_QUERY = `
query ClaimInventoryRows {
  inventoryItems(limit: 1000) {
    id
    name
    brand
    quantity
    shelf {
      locationDescription
    }
  }
}
`.trim();

const CLAIM_UPDATE_MUTATION = `
mutation ClaimInventoryItem(
  $id: UUID
  $quantity: Int
  $updatedAt: Timestamp
) {
  inventoryItem_update(
    id: $id
    data: {
      quantity: $quantity
      updatedAt: $updatedAt
    }
  )
}
`.trim();

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function readString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function readQuantity(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return 0;
  }

  return Math.max(0, Math.floor(parsed));
}

function normalizeItemId(value: string | null | undefined) {
  const trimmed = value?.trim() || "";
  if (!trimmed) {
    return null;
  }

  return UUID_PATTERN.test(trimmed) ? trimmed : null;
}

function extractRows(data: Record<string, unknown> | null) {
  if (!data || !Array.isArray(data.inventoryItems)) {
    return [] as ClaimInventoryRow[];
  }

  return data.inventoryItems
    .map((value) => {
      if (!value || typeof value !== "object") {
        return null;
      }

      const row = value as Record<string, unknown>;
      const id = readString(row.id);
      const name = readString(row.name);
      const brand = readString(row.brand);

      if (!id || !name || !brand) {
        return null;
      }

      return {
        id,
        name,
        brand,
        quantity: readQuantity(row.quantity),
        shelfLocationDescription:
          row.shelf && typeof row.shelf === "object"
            ? readString((row.shelf as Record<string, unknown>).locationDescription)
            : null,
      } as ClaimInventoryRow;
    })
    .filter((row): row is ClaimInventoryRow => row !== null);
}

function isRowVisibleToHub(row: ClaimInventoryRow, hubDomain: string) {
  const markerDomain = extractHubDomainMarker(row.shelfLocationDescription);
  return isHubVisibleToDomain(markerDomain, hubDomain);
}

export async function POST(request: Request) {
  try {
    const sessionResult = await requireHubRole(request, ["student", "admin"]);
    if (!sessionResult.ok) {
      return sessionResult.response;
    }

    const session = sessionResult.session;
    const body = (await request.json()) as ClaimBody;

    const itemId = normalizeItemId(body.itemId);
    if (!itemId) {
      return Response.json({ error: "Missing or invalid itemId." }, { status: 400 });
    }

    const requestedQuantity = readQuantity(body.quantity);
    if (requestedQuantity <= 0 || requestedQuantity > 25) {
      return Response.json(
        { error: "Quantity must be between 1 and 25." },
        { status: 400 }
      );
    }

    const { data } = await executeDataConnect(CLAIM_LIST_QUERY);
    const rows = extractRows(data);
    const target = rows.find((row) => row.id === itemId) || null;

    if (!target) {
      return Response.json({ error: "Inventory item not found." }, { status: 404 });
    }

    if (!isRowVisibleToHub(target, session.hubDomain)) {
      return Response.json(
        { error: "This item belongs to a different university hub." },
        { status: 403 }
      );
    }

    if (target.quantity <= 0) {
      return Response.json({ error: "This item is currently out of stock." }, { status: 409 });
    }

    const claimedQuantity = Math.min(target.quantity, requestedQuantity);
    const updatedQuantity = Math.max(0, target.quantity - claimedQuantity);

    await executeDataConnect(CLAIM_UPDATE_MUTATION, {
      id: target.id,
      quantity: updatedQuantity,
      updatedAt: new Date().toISOString(),
    });

    return Response.json({
      itemId: target.id,
      itemName: target.name,
      brand: target.brand,
      claimedQuantity,
      beforeQuantity: target.quantity,
      afterQuantity: updatedQuantity,
      message:
        claimedQuantity < requestedQuantity
          ? "Claimed remaining available quantity."
          : "Item successfully claimed.",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to claim inventory item.";

    return Response.json({ error: message }, { status: 500 });
  }
}
