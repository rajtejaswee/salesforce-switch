import jsforce from "jsforce";
import { Session } from "./session";

export function getOAuth2() {
  const clientId = process.env.SF_CLIENT_ID;
  const clientSecret = process.env.SF_CLIENT_SECRET;
  const loginUrl = process.env.SF_LOGIN_URL || "https://login.salesforce.com";
  const appUrl = process.env.APP_URL || "http://localhost:3000";

  if (!clientId || !clientSecret) {
    throw new Error("SF_CLIENT_ID / SF_CLIENT_SECRET missing in env");
  }

  return new jsforce.OAuth2({
    clientId,
    clientSecret,
    redirectUri: `${appUrl}/api/auth/callback`,
    loginUrl,
  });
}

export function connFromSession(session: Session) {
  return new jsforce.Connection({
    instanceUrl: session.instanceUrl,
    accessToken: session.accessToken,
  });
}
