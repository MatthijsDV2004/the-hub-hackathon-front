import { Auth0Client } from "@auth0/nextjs-auth0/server";

// Pass domain (and client id) as strings when present so the SDK uses
// static domain mode instead of the lazy env resolver used for standalone
// builds — that resolver surfaces as DomainResolutionError in proxy.
const domain = process.env.AUTH0_DOMAIN;
const clientId = process.env.AUTH0_CLIENT_ID;

export const auth0 = new Auth0Client({
  ...(domain ? { domain } : {}),
  ...(clientId ? { clientId } : {}),
});
