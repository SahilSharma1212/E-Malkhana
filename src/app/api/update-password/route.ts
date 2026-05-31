import { NextRequest, NextResponse } from "next/server";
import supabase from "@/config/supabaseConnect";

export async function POST(req: NextRequest) {
  try {
    const { targetEmail, newPassword, updatedBy } = await req.json();

    if (!targetEmail || !newPassword || !updatedBy) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    if (typeof newPassword !== "string" || newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const { data: officer, error: findError } = await supabase
      .from("officer_table")
      .select("id")
      .ilike("email_id", targetEmail.trim())
      .maybeSingle();

    if (findError) {
      return NextResponse.json(
        { success: false, message: "Database error while finding user" },
        { status: 500 }
      );
    }

    if (!officer) {
      return NextResponse.json(
        { success: false, message: "No user found with that email" },
        { status: 404 }
      );
    }

    const { error: updateError } = await supabase
      .from("officer_table")
      .update({
        password: newPassword,
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      })
      .eq("id", officer.id);

    if (updateError) {
      return NextResponse.json(
        { success: false, message: "Unable to update password" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Password updated successfully" },
      { status: 200 }
    );
  } catch (err) {
    console.error("update-password API error:", err);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
