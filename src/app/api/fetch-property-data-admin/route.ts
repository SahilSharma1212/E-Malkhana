import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/config/supabaseServer';
import { getAuthedOfficer, isStationScoped, unauthorized } from '@/lib/apiAuth';

export async function GET(req: NextRequest) {
  const officer = await getAuthedOfficer();
  if (!officer) return unauthorized();

  // Station-scoped officers are locked to their own thana regardless of the
  // requested query param; admins may request any station.
  const requestedThana = req.nextUrl.searchParams.get("thana");
  const thana = isStationScoped(officer.role) ? officer.thana : requestedThana;

  if (!thana) {
    return NextResponse.json({ success: false, message: "Thana is required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabaseServer
      .from('property_table')
      .select('property_id, name_of_io, created_at, date_of_seizure, category_of_offence, type_of_seizure, fir_number, place_of_seizure, rack_number, box_number, serial_number_from_register')
      .eq('police_station', thana)
      .neq('property_id', '')
      .eq("isDismantled", false);

    if (error) {
      return NextResponse.json({ success: false, message: "Failed to fetch property data" }, { status: 500 });
    }

    if (!data || data.length === 0) {
      return NextResponse.json({ success: false, message: "No property items found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "Data fetched", data }, { status: 200 });
  } catch {
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
