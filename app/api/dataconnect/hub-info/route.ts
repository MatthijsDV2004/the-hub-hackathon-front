import { NextRequest, NextResponse } from "next/server";
import { executeDataConnect } from "@/lib/dataconnect";

type HubInfoRow = {
  id: string;
  name: string;
  hoursOfOperation: string;
  description: string | null;
  location: string | null;
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_HUB_INFO_LIST_QUERY = `
query ListHubInfo {
  hubInfos(limit: 10) {
    id
    name
    hoursOfOperation
    description
    location
    createdAt
    updatedAt
  }
}
`.trim();

const DEFAULT_HUB_INFO_INSERT_MUTATION = `
mutation InsertHubInfo(
  $name: String!
  $hoursOfOperation: String!
  $createdAt: Timestamp!
  $updatedAt: Timestamp!
  $description: String
  $location: String
) {
  hubInfo_insert(data: {
    name: $name
    hoursOfOperation: $hoursOfOperation
    createdAt: $createdAt
    updatedAt: $updatedAt
    description: $description
    location: $location
  })
}
`.trim();

const DEFAULT_HUB_INFO_UPDATE_MUTATION = `
mutation UpdateHubInfo(
  $id: UUID
  $name: String
  $hoursOfOperation: String
  $updatedAt: Timestamp
  $description: String
  $location: String
) {
  hubInfo_update(
    id: $id
    data: {
      name: $name
      hoursOfOperation: $hoursOfOperation
      updatedAt: $updatedAt
      description: $description
      location: $location
    }
  )
}
`.trim();

function readText(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function extractHubInfoRows(data: Record<string, unknown> | null) {
  if (!data) {
    return [] as unknown[];
  }

  const directRows = data.hubInfos;
  if (Array.isArray(directRows)) {
    return directRows;
  }

  for (const value of Object.values(data)) {
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [] as unknown[];
}

function normalizeHubInfoRow(value: unknown): HubInfoRow | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const row = value as Record<string, unknown>;

  const id = readText(row.id);
  const name = readText(row.name);
  const hoursOfOperation = readText(row.hoursOfOperation);
  const createdAt = readText(row.createdAt);
  const updatedAt = readText(row.updatedAt);

  if (!id || !name || !hoursOfOperation || !createdAt || !updatedAt) {
    return null;
  }

  return {
    id,
    name,
    hoursOfOperation,
    description: readText(row.description),
    location: readText(row.location),
    createdAt,
    updatedAt,
  };
}

export async function GET() {
  try {
    const listQuery =
      process.env.FIREBASE_DATA_CONNECT_HUB_INFO_LIST_QUERY?.trim() ||
      DEFAULT_HUB_INFO_LIST_QUERY;

    const { data } = await executeDataConnect(listQuery);

    const rows = extractHubInfoRows(data)
      .map(normalizeHubInfoRow)
      .filter((row): row is HubInfoRow => row !== null);

    const hub = rows[0] ?? null;

    return NextResponse.json({ hub });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to load HubInfo.",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const id = readText(body.id);
    const name = readText(body.name);
    const description = readText(body.description);
    const location = readText(body.location);

    const hoursOfOperation =
      typeof body.hoursOfOperation === "string"
        ? body.hoursOfOperation
        : JSON.stringify(body.hoursOfOperation ?? []);

    if (!name || !hoursOfOperation) {
      return NextResponse.json(
        { error: "Missing required fields." },
        { status: 400 }
      );
    }

    const timestamp = new Date().toISOString();

    if (id) {
      const updateMutation =
        process.env.FIREBASE_DATA_CONNECT_HUB_INFO_UPDATE_MUTATION?.trim() ||
        DEFAULT_HUB_INFO_UPDATE_MUTATION;

      await executeDataConnect(updateMutation, {
        id,
        name,
        hoursOfOperation,
        updatedAt: timestamp,
        description,
        location,
      });

      return NextResponse.json({
        success: true,
        mode: "update",
        id,
        message: "HubInfo updated successfully.",
      });
    }

    const insertMutation =
      process.env.FIREBASE_DATA_CONNECT_HUB_INFO_INSERT_MUTATION?.trim() ||
      DEFAULT_HUB_INFO_INSERT_MUTATION;

    await executeDataConnect(insertMutation, {
      name,
      hoursOfOperation,
      createdAt: timestamp,
      updatedAt: timestamp,
      description,
      location,
    });

    return NextResponse.json({
      success: true,
      mode: "insert",
      message: "HubInfo created successfully.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to save HubInfo.",
      },
      { status: 500 }
    );
  }
}