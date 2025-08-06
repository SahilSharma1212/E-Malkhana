// app/api/update-thana-name/route.ts

import { NextResponse } from "next/server";
import supabase from "@/config/supabaseConnect";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { selectedThana, newThanaName, userName } = body;

    if (!selectedThana || !newThanaName || !userName) {
      return NextResponse.json({ success: false, message: "Missing required fields" }, { status: 400 });
    }

    const lowerNewName = newThanaName.toLowerCase();

    // 1. Check if new name already exists
    const { data: existingThana, error: checkError } = await supabase
      .from("thana_rack_box_table")
      .select("thana")
      .eq("thana", lowerNewName)
      .maybeSingle();

    if (checkError) {
      return NextResponse.json({ success: false, message: "Error checking existing thana", details: checkError.message }, { status: 500 });
    }

    if (existingThana) {
      return NextResponse.json({ success: false, message: "A Thana with this name already exists" }, { status: 400 });
    }

    // 2. Update in thana_rack_box_table
    const { error: updateRackBoxError } = await supabase
      .from("thana_rack_box_table")
      .update({
        thana: lowerNewName,
        thana_name_updated_by: userName,
        thana_name_updated_at: new Date().toISOString()
      })
      .eq("thana", selectedThana);

    if (updateRackBoxError) {
      return NextResponse.json({ success: false, message: "Error updating in thana_rack_box_table", details: updateRackBoxError.message }, { status: 500 });
    }

    // 3. Update in officer_table
    const { error: officerError } = await supabase
      .from("officer_table")
      .update({ thana: lowerNewName })
      .eq("thana", selectedThana);

    if (officerError) {
      return NextResponse.json({ success: false, message: "Error updating in officer_table", details: officerError.message }, { status: 500 });
    }

    // 4. Update in property_table
    const { error: propertyError } = await supabase
      .from("property_table")
      .update({ police_station: lowerNewName })
      .eq("police_station", selectedThana);

    if (propertyError) {
      return NextResponse.json({ success: false, message: "Error updating in Property Table", details: propertyError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Thana name updated successfully across all tables" });

  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error", details: error }, { status: 500 });
  }
}
