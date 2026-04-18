import { JWT } from "google-auth-library";

type ServiceAccount = {
  client_email?: string;
  private_key?: string;
  project_id?: string;
};

type DataConnectResult = {
  data: Record<string, unknown> | null;
};

let authClient: JWT | null = null;

function getServiceAccount(): ServiceAccount {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON || "";
  if (!raw.trim()) {
    throw new Error(
      "Missing FIREBASE_SERVICE_ACCOUNT_JSON. Add your service account JSON as a single-line env var."
    );
  }

  try {
    return JSON.parse(raw) as ServiceAccount;
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON.");
  }
}

function getGraphqlEndpoint() {
  const endpoint =
    process.env.FIREBASE_DATA_CONNECT_GRAPHQL_URL ||
    process.env.DATA_CONNECT_GRAPHQL_URL ||
    "";

  if (!endpoint.trim()) {
    throw new Error(
      "Missing FIREBASE_DATA_CONNECT_GRAPHQL_URL. Set it to your Data Connect GraphQL endpoint URL."
    );
  }

  return endpoint.trim();
}

function getAuthClient() {
  if (authClient) {
    return authClient;
  }

  const sa = getServiceAccount();
  if (!sa.client_email || !sa.private_key) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is missing client_email or private_key."
    );
  }

  authClient = new JWT({
    email: sa.client_email,
    key: sa.private_key,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  return authClient;
}

async function getAccessToken() {
  const client = getAuthClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse?.token;

  if (!token) {
    throw new Error("Could not acquire Google access token from service account.");
  }

  return token;
}

export function resolveDataConnectSource() {
  const endpointSource = process.env.FIREBASE_DATA_CONNECT_GRAPHQL_URL
    ? "FIREBASE_DATA_CONNECT_GRAPHQL_URL"
    : process.env.DATA_CONNECT_GRAPHQL_URL
      ? "DATA_CONNECT_GRAPHQL_URL"
      : "none";

  return {
    endpointSource,
    hasServiceAccount: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT_JSON),
  };
}

export async function executeDataConnect(
  query: string,
  variables?: Record<string, unknown>
): Promise<DataConnectResult> {
  const endpoint = getGraphqlEndpoint();
  const token = await getAccessToken();

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ query, variables }),
  });

  const rawText = await response.text();
  let payload: {
    data?: Record<string, unknown>;
    errors?: Array<{ message?: string }>;
  } = {};

  if (rawText.trim()) {
    try {
      payload = JSON.parse(rawText) as {
        data?: Record<string, unknown>;
        errors?: Array<{ message?: string }>;
      };
    } catch {
      throw new Error(
        `Data Connect returned non-JSON response (${response.status}): ${rawText.slice(
          0,
          160
        )}`
      );
    }
  }

  if (!response.ok) {
    const apiError = payload.errors?.map((e) => e.message).filter(Boolean).join(" | ");
    throw new Error(
      apiError ||
        `Data Connect request failed (${response.status}): ${rawText.slice(0, 160)}`
    );
  }

  if (payload.errors?.length) {
    const message = payload.errors
      .map((error) => error.message || "Unknown GraphQL error")
      .join(" | ");
    throw new Error(message);
  }

  return { data: payload.data || null };
}
