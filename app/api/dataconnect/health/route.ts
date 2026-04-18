import { executeDataConnect, resolveDataConnectSource } from "@/lib/dataconnect";

export async function GET() {
  const source = resolveDataConnectSource();
  const healthQuery =
    process.env.FIREBASE_DATA_CONNECT_HEALTH_QUERY?.trim() ||
    "query DataConnectHealth { __typename }";

  try {
    await executeDataConnect(healthQuery);
    return Response.json({
      ok: true,
      source,
      message: "Data Connect GraphQL endpoint reachable with service account.",
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Could not reach Data Connect GraphQL endpoint.";

    return Response.json(
      {
        ok: false,
        source,
        message,
      },
      { status: 500 }
    );
  }
}
