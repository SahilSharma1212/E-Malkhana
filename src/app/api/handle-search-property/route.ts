import { NextRequest, NextResponse } from "next/server";
import supabaseServer from "@/config/supabaseServer";
import { getAuthedOfficer, isStationScoped, unauthorized } from "@/lib/apiAuth";

type SearchRequest = {
  searchValue: string;
  searchCategory: string;
  column: string;
  rackBoxType?: string; // Optional, only for rackbox category
};

// Only these columns may be used in a free-text (ilike) filter. Anything else
// is rejected so a caller can't probe arbitrary columns of property_table.
const SEARCHABLE_COLUMNS = new Set([
  "property_id",
  "fir_number",
  "serial_number_from_register",
  "name_of_io",
  "category_of_offence",
  "type_of_seizure",
  "place_of_seizure",
  "court_name",
  "police_station",
  "rack_number",
  "box_number",
  "under_section",
  "batch_number",
]);

export async function POST(req: NextRequest) {
  try {
    const officer = await getAuthedOfficer();
    if (!officer) return unauthorized();

    const body: SearchRequest = await req.json();
    const { searchValue, searchCategory, column, rackBoxType } = body;

    if (!searchValue || !searchCategory || !column) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    let query = supabaseServer
      .from("property_table")
      .select("*")
      .not("property_id", "is", null)
      .neq("property_id", "")
      .eq("isDismantled", false);

    if (searchCategory === "offence") {
      if (searchValue === "other") {
        query = query.ilike("category_of_offence", "other%"); // Match records starting with "other"
      } else {
        query = query.ilike("category_of_offence", `%${searchValue}%`);
      }
    } else if (searchCategory === "io") {
      query = query.ilike("name_of_io", `%${searchValue}%`);
    } else if (searchCategory === "rackbox") {
      // Handle the combined rack/box search
      if (rackBoxType === "rack") {
        if (searchValue === "Special Place") {
          query = query.ilike("rack_number", "Special Place%");
        } else {
          query = query.eq("rack_number", searchValue);
        }
      } else if (rackBoxType === "box") {
        if (searchValue === "Special Place") {
          query = query.ilike("box_number", "Special Place%");
        } else {
          query = query.eq("box_number", searchValue);
        }
      } else {
        return NextResponse.json({ error: "Invalid rack/box type" }, { status: 400 });
      }
    } else if (
      searchCategory === "created_at" ||
      searchCategory === "seizuredate"
    ) {
      const from = new Date(searchValue);
      const to = new Date(searchValue);
      to.setDate(to.getDate() + 1);

      // Use property_actually_added_at for created_at category, date_of_seizure for seizuredate
      const columnToSearch = searchCategory === "created_at" ? "property_actually_added_at" : "date_of_seizure";

      query = query
        .gte(columnToSearch, from.toISOString())
        .lt(columnToSearch, to.toISOString());
    } else {
      if (!SEARCHABLE_COLUMNS.has(column)) {
        return NextResponse.json({ error: "Invalid search column" }, { status: 400 });
      }
      query = query.ilike(column, `%${searchValue.trim()}%`);
    }

    // Station-scoped officers only ever see their own thana's records.
    if (isStationScoped(officer.role)) {
      query = query.eq("police_station", officer.thana);
    }

    const { data, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ data }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
