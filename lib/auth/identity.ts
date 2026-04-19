import "server-only";

import { executeDataConnect } from "@/lib/dataconnect";
import { extractEmailDomain, normalizeEmailDomain } from "@/lib/auth/hub-domain";
import type { HubSessionRole } from "@/lib/auth/session";

type UserDirectoryRow = {
  firebaseUid: string | null;
  email: string | null;
  role: string | null;
  username: string | null;
};

type ResolveIdentityInput = {
  uid: string;
  email: string | null;
  displayName: string | null;
};

export type ResolvedHubIdentity = {
  uid: string;
  email: string;
  role: HubSessionRole;
  hubDomain: string;
  displayName: string | null;
};

type ResolveIdentityResult =
  | { ok: true; identity: ResolvedHubIdentity }
  | { ok: false; status: number; error: string };

const USER_DIRECTORY_QUERY = `
query AuthUserDirectory {
  users(limit: 1000) {
    firebaseUid
    email
    role
    username
  }
}
`.trim();

function readString(value: unknown) {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed || null;
}

function normalizeRole(value: string | null | undefined) {
  const normalized = (value || "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized === "admin") {
    return "admin" as const;
  }

  return "student" as const;
}

function normalizeDirectoryRows(data: Record<string, unknown> | null) {
  if (!data) {
    return [] as UserDirectoryRow[];
  }

  const directRows = data.users;
  if (!Array.isArray(directRows)) {
    return [] as UserDirectoryRow[];
  }

  return directRows
    .map((value) => {
      if (!value || typeof value !== "object") {
        return null;
      }

      const row = value as Record<string, unknown>;
      return {
        firebaseUid: readString(row.firebaseUid),
        email: readString(row.email),
        role: readString(row.role),
        username: readString(row.username),
      } as UserDirectoryRow;
    })
    .filter((row): row is UserDirectoryRow => row !== null);
}

function collectAdminDomains(rows: UserDirectoryRow[]) {
  const domains = new Set<string>();

  for (const row of rows) {
    if (normalizeRole(row.role) !== "admin") {
      continue;
    }

    const domain = extractEmailDomain(row.email);
    if (domain) {
      domains.add(domain);
    }
  }

  return domains;
}

export async function resolveIdentityForLogin(
  input: ResolveIdentityInput
): Promise<ResolveIdentityResult> {
  const uid = input.uid.trim();
  if (!uid) {
    return { ok: false, status: 400, error: "Missing Firebase UID." };
  }

  const normalizedEmail = readString(input.email)?.toLowerCase() || null;
  const loginDomain = extractEmailDomain(normalizedEmail);

  if (!normalizedEmail || !loginDomain) {
    return {
      ok: false,
      status: 403,
      error: "A valid school email is required to access the Hub.",
    };
  }

  let directoryRows: UserDirectoryRow[] = [];
  try {
    const { data } = await executeDataConnect(USER_DIRECTORY_QUERY);
    directoryRows = normalizeDirectoryRows(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load user directory.";
    return {
      ok: false,
      status: 500,
      error: `Could not verify user role assignment. ${message}`,
    };
  }

  const adminDomains = collectAdminDomains(directoryRows);
  const matchingUidRow = directoryRows.find((row) => row.firebaseUid === uid) || null;
  const assignedRole = normalizeRole(matchingUidRow?.role);

  if (assignedRole === "admin") {
    const adminEmail = readString(matchingUidRow?.email)?.toLowerCase() || normalizedEmail;
    const adminDomain = normalizeEmailDomain(adminEmail) || loginDomain;

    if (!adminDomain) {
      return {
        ok: false,
        status: 403,
        error: "Admin account is missing a valid university email domain.",
      };
    }

    return {
      ok: true,
      identity: {
        uid,
        email: adminEmail,
        role: "admin",
        hubDomain: adminDomain,
        displayName:
          readString(input.displayName) ||
          readString(matchingUidRow?.username) ||
          null,
      },
    };
  }

  if (loginDomain === "gmail.com") {
    return {
      ok: true,
      identity: {
        uid,
        email: normalizedEmail,
        role: "student",
        hubDomain: "gmail.com",
        displayName: readString(input.displayName) || null,
      },
    };
  }

  if (!adminDomains.size) {
    return {
      ok: false,
      status: 403,
      error:
        "No admin hubs are configured yet. Ask an admin to be assigned first before student login.",
    };
  }

  if (!adminDomains.has(loginDomain)) {
    return {
      ok: false,
      status: 403,
      error:
        "Your school domain is not connected to a Hub yet. Ask an admin to register this university.",
    };
  }

  return {
    ok: true,
    identity: {
      uid,
      email: normalizedEmail,
      role: "student",
      hubDomain: loginDomain,
      displayName: readString(input.displayName) || null,
    },
  };
}
