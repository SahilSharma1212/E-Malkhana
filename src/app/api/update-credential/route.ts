// app/api/update-credential/route.ts
import { NextRequest, NextResponse } from "next/server";
import supabaseServer from "@/config/supabaseServer";
import { getAuthedOfficer, isSuperAdmin, unauthorized, forbidden } from "@/lib/apiAuth";

type CredentialField = "phone" | "email_id";

export async function POST(req: NextRequest) {
  try {
    const officer = await getAuthedOfficer();
    if (!officer) return unauthorized();
    if (!isSuperAdmin(officer.role)) return forbidden();

    const body = await req.json();

    const {
      existingCredentialValue,
      newCredentialValue,
      newCredentialValueStyle,
    } = body;
    const updatedBy = officer.email;

    // ✅ Only allow specific fields
    if (!["phone", "email_id"].includes(newCredentialValueStyle)) {
      return NextResponse.json(
        { success: false, message: "Invalid credential field" },
        { status: 400 }
      );
    }

    const key = newCredentialValueStyle as CredentialField;

    // 🔍 Check if original credential exists
    const { data: targetRows, error: findError } = await supabaseServer
      .from("officer_table")
      .select("*")
      .eq(key, existingCredentialValue.trim().toLowerCase());

    if (findError) {
      return NextResponse.json(
        { success: false, message: "Database error while finding credential" },
        { status: 500 }
      );
    }

    if (!targetRows || targetRows.length === 0) {
      return NextResponse.json(
        { success: false, message: "Original credential not found" },
        { status: 404 }
      );
    }

    const targetOfficer = targetRows[0];

    // 🔁 Check if new value is already used by someone else
    const { data: conflictRows, error: conflictError } = await supabaseServer
      .from("officer_table")
      .select("*")
      .eq(key, newCredentialValue.trim().toLowerCase());

    if (conflictError) {
      return NextResponse.json(
        { success: false, message: "Failed to check for credential conflicts" },
        { status: 500 }
      );
    }

    const isTakenByAnother = conflictRows.some(
      (row) => row.id !== targetOfficer.id
    );

    if (isTakenByAnother) {
      return NextResponse.json(
        {
          success: false,
          message: "New credential already in use by another officer",
        },
        { status: 409 }
      );
    }

    // ✅ Perform update
    const { error: updateError } = await supabaseServer
      .from("officer_table")
      .update({
        [key]: newCredentialValue.trim().toLowerCase(),
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", targetOfficer.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, message: "Unable to update credentials" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Credentials updated successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
