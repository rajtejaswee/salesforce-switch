import { NextResponse } from "next/server";
import { getOAuth2 } from "@/lib/salesforce";

export async function GET() {
  const oauth2 = getOAuth2();
  const url = oauth2.getAuthorizationUrl({
    scope: "api refresh_token id",
  });
  return NextResponse.redirect(url);
}
