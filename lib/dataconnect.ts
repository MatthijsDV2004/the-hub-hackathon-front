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
  const endpointRaw =
    process.env.FIREBASE_DATA_CONNECT_GRAPHQL_URL ||
    process.env.DATA_CONNECT_GRAPHQL_URL ||
    "";

  const endpoint = endpointRaw.trim();

  if (!endpoint) {
    return buildExecuteGraphqlEndpointFromResource();
  }

  // If this already looks like a concrete operation URL, use it as-is.
  if (/:executeGraphql\/?$/i.test(endpoint)) {
    return endpoint;
  }

  // If this is just the API host, construct the operation path from env resource IDs.
  if (/^https:\/\/firebasedataconnect\.googleapis\.com\/?$/i.test(endpoint)) {
    return buildExecuteGraphqlEndpointFromResource();
  }

  // If it starts with the API host but not the operation suffix, append it.
  if (endpoint.startsWith("https://firebasedataconnect.googleapis.com/")) {
    if (/\/v1(beta)?\/projects\//i.test(endpoint)) {
      return endpoint.replace(/\/?$/, "") + ":executeGraphql";
    }

    throw new Error(
      "FIREBASE_DATA_CONNECT_GRAPHQL_URL must be either the full executeGraphql URL or the API host with resource IDs configured."
    );
  }

  // Last resort: accept custom URLs (proxy/gateway) as-is.
  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  throw new Error(
    "FIREBASE_DATA_CONNECT_GRAPHQL_URL is not a valid URL."
  );
}

function buildExecuteGraphqlEndpointFromResource() {
  const project = process.env.FIREBASE_DATA_CONNECT_PROJECT_ID?.trim() || "";
  const location = process.env.FIREBASE_DATA_CONNECT_LOCATION?.trim() || "";
  const service = process.env.FIREBASE_DATA_CONNECT_SERVICE_ID?.trim() || "";
  const connector = process.env.FIREBASE_DATA_CONNECT_CONNECTOR_ID?.trim() || "";

  if (!project || !location || !service || !connector) {
    throw new Error(
      "Missing Data Connect endpoint config. Set FIREBASE_DATA_CONNECT_GRAPHQL_URL to full ...:executeGraphql URL, or set FIREBASE_DATA_CONNECT_PROJECT_ID, FIREBASE_DATA_CONNECT_LOCATION, FIREBASE_DATA_CONNECT_SERVICE_ID, and FIREBASE_DATA_CONNECT_CONNECTOR_ID."
    );
  }

  return `https://firebasedataconnect.googleapis.com/v1beta/projects/${project}/locations/${location}/services/${service}/connectors/${connector}:executeGraphql`;
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

  const privateKey = normalizePrivateKey(sa.private_key);
  if (!isPemPrivateKey(privateKey)) {
    throw new Error(
      "Service account private_key is not a valid PEM key. Ensure FIREBASE_SERVICE_ACCOUNT_JSON contains the full key with BEGIN/END markers and newline escapes."
    );
  }

  authClient = new JWT({
    email: sa.client_email,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/cloud-platform"],
  });

  return authClient;
}

function normalizePrivateKey(value: string) {
  const trimmed = value.trim().replace(/^"|"$/g, "");
  return trimmed.replace(/\\n/g, "\n");
}

function isPemPrivateKey(value: string) {
  return (
    value.includes("-----BEGIN PRIVATE KEY-----") &&
    value.includes("-----END PRIVATE KEY-----")
  );
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

  const hasResourceParts = Boolean(
    process.env.FIREBASE_DATA_CONNECT_PROJECT_ID &&
      process.env.FIREBASE_DATA_CONNECT_LOCATION &&
      process.env.FIREBASE_DATA_CONNECT_SERVICE_ID &&
      process.env.FIREBASE_DATA_CONNECT_CONNECTOR_ID
  );

  return {
    endpointSource,
    hasResourceParts,
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
      const endpointHint = endpoint.slice(0, 120);
      const commonHint =
        response.status === 404
          ? "The endpoint is likely not a full Data Connect executeGraphql URL. Use .../v1beta/projects/{project}/locations/{location}/services/{service}/connectors/{connector}:executeGraphql or provide project/location/service/connector env vars."
          : "";
      throw new Error(
        `Data Connect returned non-JSON response (${response.status}) from ${endpointHint}. ${commonHint} ${rawText.slice(
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
