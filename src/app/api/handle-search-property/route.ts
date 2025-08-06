// /app/api/search/route.ts
import { NextRequest, NextResponse } from "next/server";
import supabase from "@/config/supabaseConnect";

type SearchRequest = {
  searchValue: string;
  searchCategory: string;
  column: string;
  userData: {
    role: string;
    thana: string;
  };
};


export async function POST(req: NextRequest) {
  try {
    const body: SearchRequest = await req.json();
    const { searchValue, searchCategory, column, userData } = body;

    if (!searchValue || !searchCategory || !column || !userData?.role || !userData?.thana) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }


    let query = supabase
      .from("property_table")
      .select("*")
      .not("property_id", "is", null)
      .neq("property_id", "");

    if (searchCategory === "offence") {
      if (searchValue === "other") {
        query = query
          .not("category_of_offence", "in", [
            "body offence",
            "property offence",
            "offence related to c/w",
          ])
          .neq("category_of_offence", "");
      } else {
        query = query.eq("category_of_offence", searchValue);
      }
    } else if (searchCategory === "io") {
      query = query.ilike("name_of_io", `%${searchValue}%`);
    } else if (
      searchCategory === "created_at" ||
      searchCategory === "seizuredate"
    ) {
      const from = new Date(searchValue);
      const to = new Date(searchValue);
      to.setDate(to.getDate() + 1);
      query = query
        .gte("created_at", from.toISOString())
        .lt("created_at", to.toISOString());
    } else {
      query = query.eq(column, searchValue.trim());
    }

    if (userData.role === "viewer" || userData.role === "thana admin") {
      query = query.eq("police_station", userData.thana);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch (err) {
    return NextResponse.json({ error: err || "Unknown error" }, { status: 500 });
  }
}
