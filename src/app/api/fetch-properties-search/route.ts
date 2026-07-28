import { NextResponse } from "next/server";
import supabaseServer from "@/config/supabaseServer";
import { getAuthedOfficer, isStationScoped, unauthorized } from "@/lib/apiAuth";

export async function POST() {
  try {
    const officer = await getAuthedOfficer();
    if (!officer) return unauthorized();

    let query = supabaseServer
      .from("property_table")
      .select("*")
      .not("property_id", "is", null)
      .neq("property_id", "")
      .eq("isDismantled", false);

    // Scope is derived from the verified session, never the request body.
    if (isStationScoped(officer.role)) {
      query = query.eq("police_station", officer.thana);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
