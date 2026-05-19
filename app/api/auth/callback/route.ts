import { NextRequest, NextResponse } from "next/server";
import jsforce from "jsforce";
import { getOAuth2 } from "@/lib/salesforce";
import { setSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");
  const oauthError = req.nextUrl.searchParams.get("error");

  if (oauthError) {
    return NextResponse.redirect(
      new URL(`/?error=${encodeURIComponent(oauthError)}`, req.url)
    );
  }
  if (!code) {
    return NextResponse.redirect(new URL("/?error=missing_code", req.url));
  }

  const conn = new jsforce.Connection({ oauth2: getOAuth2() });

  try {
    await conn.authorize(code);
  } catch (e) {
    console.error("oauth exchange failed", e);
    return NextResponse.redirect(new URL("/?error=auth_failed", req.url));
  }

  const identity = await conn.identity();
  const orgRes = await conn.query<{ Name: string }>(
    "SELECT Name FROM Organization LIMIT 1"
  );
  const orgName = orgRes.records[0]?.Name ?? "Unknown Org";

  await setSession({
    accessToken: conn.accessToken!,
    instanceUrl: conn.instanceUrl,
    username: identity.username,
    orgName,
  });

  return NextResponse.redirect(new URL("/", req.url));
}
