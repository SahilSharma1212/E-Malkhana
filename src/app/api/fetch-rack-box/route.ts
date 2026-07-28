import { NextRequest, NextResponse } from "next/server";
import supabaseServer from "@/config/supabaseServer";
import { getAuthedOfficer, unauthorized } from "@/lib/apiAuth";

type FetchRackBoxRequest = {
  thana: string;
};

export async function POST(req: NextRequest) {
  try {
    const officer = await getAuthedOfficer();
    if (!officer) return unauthorized();

    const body: FetchRackBoxRequest = await req.json();
    const { thana } = body;

    if (!thana) {
      return NextResponse.json({ error: "Thana is required" }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from("thana_rack_box_table")
      .select("racks, boxes")
      .eq("thana", thana);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
