import { randomUUID } from "crypto";
import { executeDataConnect } from "@/lib/dataconnect";
import {
  extractHubDomainMarker,
  isHubVisibleToDomain,
  stripHubDomainMarker,
  withHubDomainMarker,
} from "@/lib/auth/hub-domain";
import { requireAdminHubSession, requireHubSession } from "@/lib/auth/request";

type InventoryItemRow = {
  id?: string | null;
  shelfId?: string | null;
  sku?: string | null;
  brand?: string;
  name?: string;
  quantity?: number;
  size?: string;
  "package-size"?: string;
  category?: string;
  type?: string;
  description?: string;
  photoUrl?: string;
  locationCenterX?: number | null;
  locationCenterY?: number | null;
  locationRadius?: number | null;
  imageWidth?: number | null;
  imageHeight?: number | null;
};

type SaveInventoryItemsBody = {
  items?: InventoryItemRow[];
  shelfId?: string | null;
  shelfTag?: string | null;
  shelfName?: string;
  shelfLocationDescription?: string;
};

type ShelfSummary = {
  id: string;
  name: string | null;
  locationDescription: string | null;
  shelfTag?: string | null;
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

type NormalizedRow = {
  id: string;
  shelfId: string | null;
  name: string;
  brand: string;
  quantity: number;
  size: string | null;
  category: string | null;
  type: string | null;
  description: string | null;
  photoUrl: string;
  createdAt: string;
  updatedAt: string;
  location: ItemLocation | null;
};

const DEFAULT_INSERT_MUTATION = `
mutation InsertInventoryItem(
  $id: UUID
  $shelfId: UUID
  $name: String
  $brand: String
  $quantity: Int
  $size: String
  $category: String
  $type: String
  $description: String
  $photoUrl: String
  $locationCenterX: Float
  $locationCenterY: Float
  $locationRadius: Float
  $imageWidth: Float
  $imageHeight: Float
  $createdAt: Timestamp
  $updatedAt: Timestamp
) {
  inventoryItem_insert(
    data: {
      id: $id
      shelfId: $shelfId
      name: $name
      brand: $brand
      quantity: $quantity
      size: $size
      category: $category
      type: $type
      description: $description
      photoUrl: $photoUrl
      locationCenterX: $locationCenterX
      locationCenterY: $locationCenterY
      locationRadius: $locationRadius
      imageWidth: $imageWidth
      imageHeight: $imageHeight
      createdAt: $createdAt
      updatedAt: $updatedAt
    }
  )
}
`.trim();

const LEGACY_INSERT_MUTATION = `
mutation InsertInventoryItem(
  $id: UUID
  $shelfId: UUID
  $name: String
  $brand: String
  $quantity: Int
  $size: String
  $category: String
  $description: String
  $photoUrl: String
  $createdAt: Timestamp
  $updatedAt: Timestamp
) {
  inventoryItem_insert(
    data: {
      id: $id
      shelfId: $shelfId
      name: $name
      brand: $brand
      quantity: $quantity
      size: $size
      category: $category
      description: $description
      photoUrl: $photoUrl
      createdAt: $createdAt
      updatedAt: $updatedAt
    }
  )
}
`.trim();

const DEFAULT_SHELF_INSERT_MUTATION = `
mutation InsertShelf(
  $id: UUID
  $name: String
  $locationDescription: String
  $createdAt: Timestamp
  $updatedAt: Timestamp
) {
  shelf_insert(
    data: {
      id: $id
      name: $name
      locationDescription: $locationDescription
      createdAt: $createdAt
      updatedAt: $updatedAt
    }
  )
}
`.trim();

const DEFAULT_SHELF_LIST_QUERY = `
query ListShelves {
  shelves(limit: 1000) {
    id
    name
    locationDescription
  }
}
`.trim();

const DEFAULT_LIST_QUERY = `
query StudentInventory {
  inventoryItems(limit: __LIMIT__) {
    id
    shelfId
    shelf {
      id
      name
      locationDescription
    }
    name
    brand
    quantity
    category
    type
    createdAt
    updatedAt
    description
    photoUrl
    size
    locationCenterX
    locationCenterY
    locationRadius
    imageWidth
    imageHeight
  }
}
`.trim();

const LEGACY_LIST_QUERY = `
query StudentInventory {
  inventoryItems(limit: __LIMIT__) {
    id
    shelfId
    shelf {
      id
      name
      locationDescription
    }
    name
    brand
    quantity
    category
    createdAt
    updatedAt
    description
    photoUrl
    size
  }
}
`.trim();

const DEFAULT_DELETE_SINGLE_MUTATION = `
mutation DeleteInventoryItem($id: UUID) {
  inventoryItem_delete(id: $id)
}
`.trim();

const DEFAULT_UPDATE_MUTATION = `
mutation UpdateInventoryItem(
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
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// Firebase Data Connect returns UUIDs as 32 hex chars with no hyphens
const COMPACT_UUID_PATTERN = /^[0-9a-f]{32}$/i;

const LOCATION_MARKER_PREFIX = "[[LOC]]";
const SHELF_TAG_MARKER_PREFIX = "[[SHELF_TAG]]";
const LOCATION_SCHEMA_FIELDS = [
  "locationCenterX",
  "locationCenterY",
  "locationRadius",
  "imageWidth",
  "imageHeight",
];

const TYPE_SCHEMA_FIELDS = ["type"];

function normalizeUuid(value: string | null | undefined) {
  const trimmed = value?.trim() || "";
  if (!trimmed) {
    return null;
  }
  if (UUID_PATTERN.test(trimmed) || COMPACT_UUID_PATTERN.test(trimmed)) {
    return trimmed;
  }
  return null;
}

function normalizeText(value: string | null | undefined) {
  return (value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeShelfTag(value: string | null | undefined) {
  const trimmed = (value || "").trim();
  if (!trimmed) {
    return null;
  }

  return trimmed.slice(0, 160);
}

function extractShelfTagMarker(locationDescription: string | null) {
  if (!locationDescription) {
    return null;
  }

  const markerIndex = locationDescription.lastIndexOf(SHELF_TAG_MARKER_PREFIX);
  if (markerIndex < 0) {
    return null;
  }

  const markerValue = locationDescription
    .slice(markerIndex + SHELF_TAG_MARKER_PREFIX.length)
    .trim();
  return normalizeShelfTag(markerValue);
}

function stripShelfTagMarker(locationDescription: string | null) {
  if (!locationDescription) {
    return null;
  }

  const markerIndex = locationDescription.lastIndexOf(SHELF_TAG_MARKER_PREFIX);
  if (markerIndex < 0) {
    return locationDescription;
  }

  const trimmed = locationDescription.slice(0, markerIndex).trim();
  return trimmed || null;
}

function appendShelfTagMarker(locationDescription: string, shelfTag: string | null) {
  if (!shelfTag) {
    return locationDescription;
  }

  const baseDescription = stripShelfTagMarker(locationDescription) || "";
  return `${baseDescription}\n${SHELF_TAG_MARKER_PREFIX}${shelfTag}`.trim();
}

function normalizeNumber(value: unknown) {
  if (value == null) {
    return null;
  }

  if (typeof value === "string" && value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    return null;
  }
  return parsed;
}

function normalizeLocationFromInput(item: InventoryItemRow): ItemLocation | null {
  const centerX = normalizeNumber(item.locationCenterX);
  const centerY = normalizeNumber(item.locationCenterY);
  const radius = normalizeNumber(item.locationRadius);
  const imageWidth = normalizeNumber(item.imageWidth);
  const imageHeight = normalizeNumber(item.imageHeight);

  if (
    centerX == null ||
    centerY == null ||
    radius == null ||
    imageWidth == null ||
    imageHeight == null ||
    radius <= 0 ||
    imageWidth <= 0 ||
    imageHeight <= 0
  ) {
    return null;
  }

  return {
    centerX,
    centerY,
    radius,
    imageWidth,
    imageHeight,
  };
}

function extractLocationMarker(description: string | null) {
  if (!description) {
    return {
      description: null,
      location: null as ItemLocation | null,
    };
  }

  const markerIndex = description.lastIndexOf(LOCATION_MARKER_PREFIX);
  if (markerIndex < 0) {
    return {
      description,
      location: null as ItemLocation | null,
    };
  }

  const rawJson = description.slice(markerIndex + LOCATION_MARKER_PREFIX.length).trim();
  const baseDescription = description.slice(0, markerIndex).trim() || null;

  try {
    const parsed = JSON.parse(rawJson) as Record<string, unknown>;
    const location = normalizeLocationFromInput({
      locationCenterX: normalizeNumber(parsed.centerX),
      locationCenterY: normalizeNumber(parsed.centerY),
      locationRadius: normalizeNumber(parsed.radius),
      imageWidth: normalizeNumber(parsed.imageWidth),
      imageHeight: normalizeNumber(parsed.imageHeight),
    });

    return {
      description: baseDescription,
      location,
    };
  } catch {
    return {
      description,
      location: null as ItemLocation | null,
    };
  }
}

function appendLocationMarker(description: string | null, location: ItemLocation | null) {
  if (!location) {
    return description;
  }

  const markerPayload = JSON.stringify({
    centerX: Number(location.centerX.toFixed(2)),
    centerY: Number(location.centerY.toFixed(2)),
    radius: Number(location.radius.toFixed(2)),
    imageWidth: Number(location.imageWidth.toFixed(2)),
    imageHeight: Number(location.imageHeight.toFixed(2)),
  });

  if (!description) {
    return `${LOCATION_MARKER_PREFIX}${markerPayload}`;
  }

  return `${description}\n${LOCATION_MARKER_PREFIX}${markerPayload}`;
}

function isLocationSchemaMismatch(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || "");
  const mentionsKnownField = [...LOCATION_SCHEMA_FIELDS, ...TYPE_SCHEMA_FIELDS].some((field) =>
    message.includes(field)
  );

  if (!mentionsKnownField) {
    return false;
  }

  return /(Cannot query field|Unknown argument|Unknown field|not defined by type|not found in type)/i.test(
    message
  );
}

function buildPlaceholderPhotoUrl(id: string, name: string) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const safeSlug = slug || "inventory-item";
  return `https://images.example.com/hub-inventory/${safeSlug}-${id}.jpg`;
}

function normalizeItem(item: InventoryItemRow): NormalizedRow | null {
  const name = item.name?.trim() || "";
  if (!name) {
    return null;
  }

  const id = normalizeUuid(item.id) || randomUUID();
  const shelfId = normalizeUuid(item.shelfId);
  const size = item.size?.trim() || item["package-size"]?.trim() || null;
  const category = item.category?.trim() || null;
  const type = item.type?.trim() || null;
  const sku = item.sku?.trim() || "";
  const explicitBrand = item.brand?.trim() || "";
  const quantityRaw = Number(item.quantity);
  const quantity = Number.isFinite(quantityRaw) && quantityRaw > 0 ? Math.floor(quantityRaw) : 0;
  const photoUrl = item.photoUrl?.trim() || buildPlaceholderPhotoUrl(id, name);
  const location = normalizeLocationFromInput(item);
  const cleanDescription = item.description?.trim() || null;
  const nowIso = new Date().toISOString();

  return {
    id,
    shelfId,
    name,
    brand: explicitBrand || sku || "Unknown",
    quantity,
    size,
    category,
    type,
    description: cleanDescription,
    photoUrl,
    createdAt: nowIso,
    updatedAt: nowIso,
    location,
  };
}

function inferSavedCount(data: Record<string, unknown> | null, fallbackCount: number) {
  if (!data) {
    return fallbackCount;
  }

  for (const value of Object.values(data)) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (Array.isArray(value)) {
      return value.length;
    }
  }

  for (const value of Object.values(data)) {
    if (!value || typeof value !== "object") {
      continue;
    }

    const record = value as Record<string, unknown>;
    const candidateKeys = ["affectedCount", "insertedCount", "count", "totalCount"];

    for (const key of candidateKeys) {
      const candidate = record[key];
      if (typeof candidate === "number" && Number.isFinite(candidate)) {
        return candidate;
      }
    }
  }

  return fallbackCount;
}

function normalizeListLimit(value: string | null) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 250;
  }
  return Math.min(1000, Math.floor(parsed));
}

function readString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }
  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeShelf(value: unknown): ShelfSummary | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const shelf = value as Record<string, unknown>;
  const id = readString(shelf.id);
  if (!id) {
    return null;
  }

  return {
    id,
    name: readString(shelf.name),
    locationDescription: readString(shelf.locationDescription),
  };
}

function sanitizeShelfForClient(shelf: ShelfSummary | null) {
  if (!shelf) {
    return null;
  }

  const noDomainMarker = stripHubDomainMarker(shelf.locationDescription);
  const shelfTag = extractShelfTagMarker(noDomainMarker);

  return {
    ...shelf,
    shelfTag,
    locationDescription: stripShelfTagMarker(noDomainMarker),
  };
}

function sanitizeItemForClient(item: StudentInventoryItem): StudentInventoryItem {
  return {
    ...item,
    shelf: sanitizeShelfForClient(item.shelf),
  };
}

function isItemVisibleToHub(item: StudentInventoryItem, hubDomain: string) {
  const markerDomain = extractHubDomainMarker(item.shelf?.locationDescription || null);
  return isHubVisibleToDomain(markerDomain, hubDomain);
}

function filterItemsByHubDomain(items: StudentInventoryItem[], hubDomain: string) {
  return items.filter((item) => isItemVisibleToHub(item, hubDomain));
}

function normalizeStudentInventoryItem(value: unknown): StudentInventoryItem | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;
  const name = readString(row.name);
  if (!name) {
    return null;
  }

  const quantityRaw = Number(row.quantity);
  const quantity = Number.isFinite(quantityRaw) ? Math.max(0, Math.floor(quantityRaw)) : 0;

  const parsedShelf = normalizeShelf(row.shelf);
  const shelfId = readString(row.shelfId) || parsedShelf?.id || null;
  const locationFromColumns = normalizeLocationFromInput({
    locationCenterX: normalizeNumber(row.locationCenterX),
    locationCenterY: normalizeNumber(row.locationCenterY),
    locationRadius: normalizeNumber(row.locationRadius),
    imageWidth: normalizeNumber(row.imageWidth),
    imageHeight: normalizeNumber(row.imageHeight),
  });
  const parsedDescription = extractLocationMarker(readString(row.description));

  return {
    id: readString(row.id) || randomUUID(),
    shelfId,
    shelf: parsedShelf,
    name,
    brand: readString(row.brand) || "Unknown",
    quantity,
    category: readString(row.category),
    type: readString(row.type),
    createdAt: readString(row.createdAt),
    updatedAt: readString(row.updatedAt),
    description: parsedDescription.description,
    photoUrl: readString(row.photoUrl),
    size: readString(row.size),
    location: locationFromColumns || parsedDescription.location,
  };
}

function toEpoch(value: string | null) {
  if (!value) {
    return 0;
  }
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

function extractItemRows(data: Record<string, unknown> | null) {
  if (!data) {
    return [];
  }

  const direct = data.inventoryItems;
  if (Array.isArray(direct)) {
    return direct;
  }

  for (const value of Object.values(data)) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function extractShelfRows(data: Record<string, unknown> | null) {
  if (!data) {
    return [];
  }

  const direct = data.shelves;
  if (Array.isArray(direct)) {
    return direct;
  }

  for (const [key, value] of Object.entries(data)) {
    if (Array.isArray(value) && key.toLowerCase().includes("shelf")) {
      return value;
    }
  }

  for (const value of Object.values(data)) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function filterItems(
  items: StudentInventoryItem[],
  search: string,
  shelfId: string | null,
  hubDomain: string
) {
  const normalizedSearch = normalizeText(search);
  const normalizedShelfId = normalizeUuid(shelfId);

  return items.filter((item) => {
    if (!isItemVisibleToHub(item, hubDomain)) {
      return false;
    }

    if (normalizedShelfId && item.shelfId !== normalizedShelfId) {
      return false;
    }

    if (!normalizedSearch) {
      return true;
    }

    const haystack = normalizeText(
      [
        item.name,
        item.brand,
        item.category,
        item.type,
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
}

async function ensureUploadShelf(body: SaveInventoryItemsBody, hubDomain: string) {
  const providedShelfId = normalizeUuid(body.shelfId);
  const providedShelfTag = normalizeShelfTag(body.shelfTag);
  if (providedShelfId) {
    return {
      shelfId: providedShelfId,
      shelf: {
        id: providedShelfId,
        name: null,
        locationDescription: null,
      } as ShelfSummary,
    };
  }

  if (providedShelfTag) {
    const { data } = await executeDataConnect(DEFAULT_SHELF_LIST_QUERY);
    const shelves = extractShelfRows(data)
      .map(normalizeShelf)
      .filter((row): row is ShelfSummary => row !== null);

    const matchedShelf = shelves.find((shelf) => {
      const shelfDomain = extractHubDomainMarker(shelf.locationDescription);
      if (!isHubVisibleToDomain(shelfDomain, hubDomain)) {
        return false;
      }

      return extractShelfTagMarker(shelf.locationDescription) === providedShelfTag;
    });

    if (matchedShelf) {
      return {
        shelfId: matchedShelf.id,
        shelf: sanitizeShelfForClient(matchedShelf) as ShelfSummary,
      };
    }
  }

  const nowIso = new Date().toISOString();
  const shelfId = randomUUID();
  const shelfName =
    body.shelfName?.trim() ||
    (providedShelfTag
      ? `Shelf ${providedShelfTag.slice(Math.max(0, providedShelfTag.length - 8))}`
      : `Upload ${nowIso.slice(0, 16).replace("T", " ")}`);
  const locationSeed =
    body.shelfLocationDescription?.trim() ||
    (providedShelfTag
      ? `Linked from shelf QR ${providedShelfTag}`
      : "Generated from inventory photo upload");
  const withShelfTag = appendShelfTagMarker(locationSeed, providedShelfTag);
  const shelfLocationDescription = withHubDomainMarker(
    withShelfTag,
    hubDomain
  );

  await executeDataConnect(DEFAULT_SHELF_INSERT_MUTATION, {
    id: shelfId,
    name: shelfName,
    locationDescription: shelfLocationDescription,
    createdAt: nowIso,
    updatedAt: nowIso,
  });

  return {
    shelfId,
    shelf: {
      id: shelfId,
      name: shelfName,
      locationDescription: stripShelfTagMarker(
        stripHubDomainMarker(shelfLocationDescription)
      ),
    } as ShelfSummary,
  };
}

async function listAllInventoryItems() {
  const customQuery = process.env.FIREBASE_DATA_CONNECT_LIST_QUERY?.trim() || null;
  const { data } = await executeInventoryListQuery(1000, customQuery);

  return extractItemRows(data)
    .map(normalizeStudentInventoryItem)
    .filter((row): row is StudentInventoryItem => row !== null);
}

function buildKnownShelfDomainMap(items: StudentInventoryItem[]) {
  const map = new Map<string, string | null>();

  for (const item of items) {
    if (!item.shelfId) {
      continue;
    }

    const markerDomain = extractHubDomainMarker(item.shelf?.locationDescription || null);
    if (markerDomain) {
      map.set(item.shelfId, markerDomain);
      continue;
    }

    if (!map.has(item.shelfId)) {
      map.set(item.shelfId, null);
    }
  }

  return map;
}

function buildListQuery(limit: number, includeLocationFields: boolean) {
  const template = includeLocationFields ? DEFAULT_LIST_QUERY : LEGACY_LIST_QUERY;
  return template.replace("__LIMIT__", String(limit));
}

async function executeInventoryListQuery(limit: number, customQuery: string | null) {
  if (customQuery) {
    try {
      return await executeDataConnect(customQuery);
    } catch (error) {
      if (!isLocationSchemaMismatch(error)) {
        throw error;
      }
    }
  }

  try {
    return await executeDataConnect(buildListQuery(limit, true));
  } catch (error) {
    if (!isLocationSchemaMismatch(error)) {
      throw error;
    }

    return executeDataConnect(buildListQuery(limit, false));
  }
}

async function executeDefaultInsertWithFallback(rowsWithShelf: NormalizedRow[]) {
  let savedCount = 0;
  let useLegacyMutation = false;

  for (const row of rowsWithShelf) {
    const baseVariables = {
      id: row.id,
      shelfId: row.shelfId,
      name: row.name,
      brand: row.brand,
      quantity: row.quantity,
      size: row.size,
      category: row.category,
      type: row.type,
      photoUrl: row.photoUrl,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };

    if (useLegacyMutation) {
      await executeDataConnect(LEGACY_INSERT_MUTATION, {
        ...baseVariables,
        description: appendLocationMarker(row.description, row.location),
      });
      savedCount += 1;
      continue;
    }

    try {
      await executeDataConnect(DEFAULT_INSERT_MUTATION, {
        ...baseVariables,
        description: row.description,
        locationCenterX: row.location?.centerX ?? null,
        locationCenterY: row.location?.centerY ?? null,
        locationRadius: row.location?.radius ?? null,
        imageWidth: row.location?.imageWidth ?? null,
        imageHeight: row.location?.imageHeight ?? null,
      });
    } catch (error) {
      if (!isLocationSchemaMismatch(error)) {
        throw error;
      }

      useLegacyMutation = true;
      await executeDataConnect(LEGACY_INSERT_MUTATION, {
        ...baseVariables,
        description: appendLocationMarker(row.description, row.location),
      });
    }

    savedCount += 1;
  }

  return {
    savedCount,
    persistenceMode: useLegacyMutation ? "description-marker" : "location-columns",
  } as const;
}

export async function GET(request: Request) {
  try {
    const sessionResult = await requireHubSession(request);
    if (!sessionResult.ok) {
      return sessionResult.response;
    }

    const session = sessionResult.session;
    const url = new URL(request.url);
    const limit = normalizeListLimit(url.searchParams.get("limit"));
    const search = url.searchParams.get("search") || "";
    const shelfId = url.searchParams.get("shelfId");

    const customQuery = process.env.FIREBASE_DATA_CONNECT_LIST_QUERY?.trim() || null;
    const { data } = await executeInventoryListQuery(limit, customQuery);
    const allItems = extractItemRows(data)
      .map(normalizeStudentInventoryItem)
      .filter((row): row is StudentInventoryItem => row !== null)
      .sort((a, b) => toEpoch(b.updatedAt) - toEpoch(a.updatedAt));

    const scopedItems = filterItemsByHubDomain(allItems, session.hubDomain);
    const items = filterItems(scopedItems, search, shelfId, session.hubDomain).map(
      sanitizeItemForClient
    );

    const shelfMap = new Map<string, ShelfSummary>();
    for (const item of scopedItems) {
      if (!item.shelfId) {
        continue;
      }

      if (item.shelf) {
        shelfMap.set(item.shelfId, sanitizeShelfForClient(item.shelf) as ShelfSummary);
        continue;
      }

      if (!shelfMap.has(item.shelfId)) {
        shelfMap.set(item.shelfId, {
          id: item.shelfId,
          name: null,
          locationDescription: null,
        });
      }
    }

    return Response.json({
      items,
      count: items.length,
      shelves: Array.from(shelfMap.values()),
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to fetch inventory items from Data Connect.";

    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const sessionResult = await requireAdminHubSession(request);
    if (!sessionResult.ok) {
      return sessionResult.response;
    }

    const session = sessionResult.session;
    const body = (await request.json()) as SaveInventoryItemsBody;
    const rows = Array.isArray(body.items) ? body.items : [];

    if (!rows.length) {
      return Response.json({ error: "No items supplied." }, { status: 400 });
    }

    const normalizedRows = rows
      .map(normalizeItem)
      .filter((row): row is NormalizedRow => row !== null);

    if (!normalizedRows.length) {
      return Response.json({ error: "No valid items with names to save." }, { status: 400 });
    }

    const { shelfId: uploadShelfId, shelf } = await ensureUploadShelf(body, session.hubDomain);

    const rowsWithShelf = normalizedRows.map((row) => ({
      ...row,
      shelfId: normalizeUuid(row.shelfId) || uploadShelfId,
    }));
    const withLocationCount = rowsWithShelf.filter((row) => Boolean(row.location)).length;

    const existingItems = await listAllInventoryItems();
    const shelfDomainMap = buildKnownShelfDomainMap(existingItems);
    shelfDomainMap.set(uploadShelfId, session.hubDomain);

    for (const row of rowsWithShelf) {
      if (!row.shelfId) {
        continue;
      }

      if (row.shelfId !== uploadShelfId && !shelfDomainMap.has(row.shelfId)) {
        return Response.json(
          { error: `Unknown shelfId: ${row.shelfId}` },
          { status: 400 }
        );
      }

      const shelfDomain = shelfDomainMap.get(row.shelfId);
      if (!isHubVisibleToDomain(shelfDomain, session.hubDomain)) {
        return Response.json(
          {
            error:
              "You can only save inventory into shelves that belong to your university hub.",
          },
          { status: 403 }
        );
      }
    }

    const customMutation = process.env.FIREBASE_DATA_CONNECT_INSERT_MUTATION?.trim();

    if (customMutation) {
      const customMutationSupportsLocationColumns = LOCATION_SCHEMA_FIELDS.every((field) =>
        customMutation.includes(field)
      );

      const customMutationItems = rowsWithShelf.map((row) => ({
        id: row.id,
        shelfId: row.shelfId,
        name: row.name,
        brand: row.brand,
        quantity: row.quantity,
        size: row.size,
        category: row.category,
        type: row.type,
        description: customMutationSupportsLocationColumns
          ? row.description
          : appendLocationMarker(row.description, row.location),
        photoUrl: row.photoUrl,
        locationCenterX: row.location?.centerX ?? null,
        locationCenterY: row.location?.centerY ?? null,
        locationRadius: row.location?.radius ?? null,
        imageWidth: row.location?.imageWidth ?? null,
        imageHeight: row.location?.imageHeight ?? null,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      }));

      try {
        const { data } = await executeDataConnect(customMutation, {
          items: customMutationItems,
        });
        return Response.json({
          savedCount: inferSavedCount(data, rowsWithShelf.length),
          shelf,
          metadata: {
            requestedCount: rowsWithShelf.length,
            withLocationCount,
              persistenceMode: customMutationSupportsLocationColumns
                ? "custom-mutation-location-columns"
                : "custom-mutation-description-marker",
          },
        });
      } catch (error) {
        if (!isLocationSchemaMismatch(error)) {
          throw error;
        }
      }
    }

    const insertResult = await executeDefaultInsertWithFallback(rowsWithShelf);

    return Response.json({
      savedCount: insertResult.savedCount,
      shelf,
      metadata: {
        requestedCount: rowsWithShelf.length,
        withLocationCount,
        persistenceMode: insertResult.persistenceMode,
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to save inventory items through Data Connect.";

    return Response.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const sessionResult = await requireAdminHubSession(request);
    if (!sessionResult.ok) {
      return sessionResult.response;
    }

    const session = sessionResult.session;
    const body = (await request.json()) as {
      itemId?: string;
      quantity?: number;
      updatedAt?: string;
    };

    const itemId = normalizeUuid(body.itemId);
    if (!itemId) {
      return Response.json({ error: "Missing or invalid itemId." }, { status: 400 });
    }

    const allItems = await listAllInventoryItems();
    const target = allItems.find((row) => row.id === itemId) || null;

    if (!target) {
      return Response.json({ error: "Item not found." }, { status: 404 });
    }

    if (!isItemVisibleToHub(target, session.hubDomain)) {
      return Response.json(
        { error: "You cannot edit items from a different hub." },
        { status: 403 }
      );
    }

    const quantityRaw = body.quantity != null ? Number(body.quantity) : null;
    const quantity =
      quantityRaw != null && Number.isFinite(quantityRaw) && quantityRaw >= 0
        ? Math.floor(quantityRaw)
        : target.quantity;

    const updatedAtRaw = body.updatedAt?.trim() || null;
    const updatedAt = updatedAtRaw && Number.isFinite(Date.parse(updatedAtRaw))
      ? new Date(updatedAtRaw).toISOString()
      : new Date().toISOString();

    await executeDataConnect(DEFAULT_UPDATE_MUTATION, {
      id: itemId,
      quantity,
      updatedAt,
    });

    return Response.json({ itemId, quantity, updatedAt });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to update inventory item through Data Connect.";

    return Response.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const sessionResult = await requireAdminHubSession(request);
    if (!sessionResult.ok) {
      return sessionResult.response;
    }

    const session = sessionResult.session;
    const url = new URL(request.url);
    const scope = (url.searchParams.get("scope") || "").toLowerCase();

    if (!scope) {
      return Response.json(
        { error: "Missing scope. Use scope=item|shelf|all." },
        { status: 400 }
      );
    }

    if (scope === "all") {
      const allItems = await listAllInventoryItems();
      const scopedItems = filterItemsByHubDomain(allItems, session.hubDomain);

      let deletedCount = 0;
      for (const row of scopedItems) {
        await executeDataConnect(DEFAULT_DELETE_SINGLE_MUTATION, {
          id: row.id,
        });
        deletedCount += 1;
      }

      return Response.json({
        scope,
        deletedCount,
      });
    }

    if (scope === "item") {
      const itemId = normalizeUuid(url.searchParams.get("itemId"));
      if (!itemId) {
        return Response.json({ error: "Missing or invalid itemId." }, { status: 400 });
      }

      const allItems = await listAllInventoryItems();
      const target = allItems.find((row) => row.id === itemId) || null;

      if (!target) {
        return Response.json({ error: "Item not found." }, { status: 404 });
      }

      if (!isItemVisibleToHub(target, session.hubDomain)) {
        return Response.json(
          { error: "You cannot delete items from a different hub." },
          { status: 403 }
        );
      }

      const { data } = await executeDataConnect(DEFAULT_DELETE_SINGLE_MUTATION, {
        id: itemId,
      });

      const rawValue = data ? Object.values(data)[0] : null;
      const deletedCount = rawValue == null ? 0 : 1;

      return Response.json({
        scope,
        itemId,
        deletedCount,
      });
    }

    if (scope === "shelf") {
      const shelfId = normalizeUuid(url.searchParams.get("shelfId"));
      if (!shelfId) {
        return Response.json({ error: "Missing or invalid shelfId." }, { status: 400 });
      }

      const allItems = await listAllInventoryItems();

      const shelfItems = allItems
        .filter((row) => row.shelfId === shelfId);

      if (!shelfItems.length) {
        return Response.json({ scope, shelfId, deletedCount: 0 });
      }

      const shelfDomain = extractHubDomainMarker(
        shelfItems.find((row) => row.shelf?.locationDescription)?.shelf?.locationDescription ||
          null
      );

      if (!isHubVisibleToDomain(shelfDomain, session.hubDomain)) {
        return Response.json(
          { error: "You cannot delete shelves from a different hub." },
          { status: 403 }
        );
      }

      let deletedCount = 0;
      for (const row of shelfItems) {
        await executeDataConnect(DEFAULT_DELETE_SINGLE_MUTATION, {
          id: row.id,
        });
        deletedCount += 1;
      }

      return Response.json({
        scope,
        shelfId,
        deletedCount,
      });
    }

    return Response.json(
      { error: "Unsupported scope. Use scope=item|shelf|all." },
      { status: 400 }
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to delete inventory items through Data Connect.";

    return Response.json({ error: message }, { status: 500 });
  }
}
