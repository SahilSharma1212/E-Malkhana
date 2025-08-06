import { NextResponse } from "next/server";
import supabase from "@/config/supabaseConnect";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("thana_rack_box_table")
      .select("thana");

    if (error) {
      return NextResponse.json({ success: false, message: "Error fetching thanas" }, { status: 500 });
    }

    const uniqueThanas = [...new Set(data.map((d) => d.thana))];

    return NextResponse.json({ success: true, message: "Fetched thanas", thanas: uniqueThanas }, { status: 200 });
  } catch (err) {
    console.error("Fetch thanas error:", err);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
