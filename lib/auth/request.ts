import {
  HUB_SESSION_COOKIE_NAME,
  type HubSession,
  type HubSessionRole,
  verifyHubSessionToken,
} from "@/lib/auth/session";

type SessionCheckSuccess = {
  ok: true;
  session: HubSession;
};

type SessionCheckFailure = {
  ok: false;
  response: Response;
};

type SessionCheckResult = SessionCheckSuccess | SessionCheckFailure;

function readCookieValue(cookieHeader: string | null, name: string) {
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";");
  for (const cookie of cookies) {
    const [rawName, ...rawValue] = cookie.split("=");
    if (rawName?.trim() !== name) {
      continue;
    }

    const value = rawValue.join("=").trim();
    if (!value) {
      return null;
    }

    try {
      return decodeURIComponent(value);
    } catch {
      return value;
    }
  }

  return null;
}

export function readHubSessionTokenFromRequest(request: Request) {
  return readCookieValue(request.headers.get("cookie"), HUB_SESSION_COOKIE_NAME);
}

export async function getHubSessionFromRequest(request: Request) {
  const token = readHubSessionTokenFromRequest(request);
  return verifyHubSessionToken(token);
}

export async function requireHubSession(request: Request): Promise<SessionCheckResult> {
  const session = await getHubSessionFromRequest(request);
  if (!session) {
    return {
      ok: false,
      response: Response.json(
        {
          error: "You must be signed in to continue.",
        },
        { status: 401 }
      ),
    };
  }

  return {
    ok: true,
    session,
  };
}

export async function requireHubRole(
  request: Request,
  allowedRoles: HubSessionRole[]
): Promise<SessionCheckResult> {
  const sessionResult = await requireHubSession(request);
  if (!sessionResult.ok) {
    return sessionResult;
  }

  if (!allowedRoles.includes(sessionResult.session.role)) {
    return {
      ok: false,
      response: Response.json(
        {
          error: "You do not have permission to access this resource.",
        },
        { status: 403 }
      ),
    };
  }

  return sessionResult;
}

export async function requireAdminHubSession(request: Request) {
  return requireHubRole(request, ["admin"]);
}
