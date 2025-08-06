import { NextRequest, NextResponse } from "next/server";
import supabase from "@/config/supabaseConnect";

export async function POST(req: NextRequest) {
  try {
    const { role, thana } = await req.json();

    let query = supabase
      .from("property_table")
      .select("*")
      .not("property_id", "is", null)
      .neq("property_id", "");

    if (role === "viewer" || role === "thana admin") {
      query = query.eq("police_station", thana);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch (err) {
    console.error("❌ Server Error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
