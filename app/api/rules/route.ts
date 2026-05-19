import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connFromSession } from "@/lib/salesforce";

type Rule = {
  Id: string;
  ValidationName: string;
  Active: boolean;
  Description: string | null;
  ErrorMessage: string | null;
};

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "not logged in" }, { status: 401 });
  }

  const conn = connFromSession(session);

  try {
    const result = await conn.tooling.query<Rule>(
      "SELECT Id, ValidationName, Active, Description, ErrorMessage " +
        "FROM ValidationRule " +
        "WHERE EntityDefinition.DeveloperName = 'Account'"
    );
    return NextResponse.json({ rules: result.records });
  } catch (e: any) {
    console.error("rules query failed", e);
    return NextResponse.json(
      { error: e?.message || "failed to fetch rules" },
      { status: 500 }
    );
  }
}
