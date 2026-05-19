import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { connFromSession } from "@/lib/salesforce";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "not logged in" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const active = Boolean(body.active);

  const conn = connFromSession(session);

  try {
    // ValidationRule.Active (top-level column) is read-only.
    // The writable copy lives inside Metadata, and Salesforce wants the
    // full Metadata object back on update, not just the changed field.
    const existing: any = await conn.tooling
      .sobject("ValidationRule")
      .retrieve(id);

    await conn.tooling.sobject("ValidationRule").update({
      Id: id,
      Metadata: { ...existing.Metadata, active },
    });

    return NextResponse.json({ ok: true, active });
  } catch (e: any) {
    console.error("rule update failed", e);
    return NextResponse.json(
      { error: e?.message || "failed to update rule" },
      { status: 500 }
    );
  }
}
