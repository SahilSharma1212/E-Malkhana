import { NextRequest, NextResponse } from "next/server";
import supabase from "@/config/supabaseConnect";

type FetchRackBoxRequest = {
  thana: string;
};

export async function POST(req: NextRequest) {
  try {
    console.log("📥 Rack/Box API called");
    
    const body: FetchRackBoxRequest = await req.json();
    console.log("📋 Request body:", body);
    
    const { thana } = body;

    if (!thana) {
      console.log("❌ No thana provided");
      return NextResponse.json({ error: "Thana is required" }, { status: 400 });
    }

    console.log("🔍 Querying thana_rack_box_table for thana:", thana);

    const { data, error } = await supabase
      .from("thana_rack_box_table")
      .select("racks, boxes")
      .eq("thana", thana);

    console.log("📊 Supabase response - Data:", data);
    console.log("📊 Supabase response - Error:", error);

    if (error) {
      console.log("❌ Supabase error:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    console.log("✅ Successfully fetched rack/box data");
    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    console.log("❌ Catch block error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}