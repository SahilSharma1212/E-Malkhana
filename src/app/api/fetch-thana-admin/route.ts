import { NextResponse } from "next/server";
import supabaseServer from "@/config/supabaseServer";
import { getAuthedOfficer, unauthorized } from "@/lib/apiAuth";

export async function GET() {
  try {
    const officer = await getAuthedOfficer();
    if (!officer) return unauthorized();

    const { data, error } = await supabaseServer
      .from("thana_rack_box_table")
      .select("thana");

    if (error) {
      return NextResponse.json({ success: false, message: "Error fetching thanas" }, { status: 500 });
    }

    const uniqueThanas = [...new Set(data.map((d) => d.thana))];

    return NextResponse.json({ success: true, message: "Fetched thanas", thanas: uniqueThanas }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
