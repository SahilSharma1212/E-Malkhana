import { NextResponse } from "next/server";
import supabaseServer from "@/config/supabaseServer";
import { getAuthedOfficer, isSuperAdmin, unauthorized, forbidden } from "@/lib/apiAuth";

export async function POST(req: Request) {
  try {
    const officer = await getAuthedOfficer();
    if (!officer) return unauthorized();
    if (!isSuperAdmin(officer.role)) return forbidden();

    const body = await req.json();
    const { name, district, pincode } = body;
    const userName = officer.email;

    if (!name || !district || !pincode) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    const lowerThana = name.trim().toLowerCase();
    const lowerDistrict = district.trim().toLowerCase();
    const lowerPincode = pincode.trim().toLowerCase();

    // 🔍 Step 1: Check if the thana already exists (case-insensitive)
    const { data: existing, error: checkError } = await supabaseServer
      .from("thana_rack_box_table")
      .select("thana")
      .eq("thana", lowerThana)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json(
        { success: false, message: "Error checking existing thana", details: checkError.message },
        { status: 500 }
      );
    }

    if (existing) {
      return NextResponse.json(
        { success: false, message: "A Thana with this name already exists" },
        { status: 400 }
      );
    }

    // ✅ Step 2: Insert new thana
    const { error } = await supabaseServer.from("thana_rack_box_table").insert({
      thana: lowerThana,
      racks: [],
      boxes: [],
      thana_created_by: userName,
      thana_name_updated_by: userName,
      district: lowerDistrict,
      pin_code: lowerPincode,
    });

    if (error) {
      return NextResponse.json(
        { success: false, message: "Error inserting new thana", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "Thana created successfully" });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error", details: error },
      { status: 500 }
    );
  }
}
