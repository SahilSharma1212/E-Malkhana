import { NextRequest, NextResponse } from 'next/server';
import supabase from '@/config/supabaseConnect';

export async function GET(req: NextRequest) {
  const thana = req.nextUrl.searchParams.get("thana");

  if (!thana) {
    return NextResponse.json({ success: false, message: "Thana is required" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase
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
  } catch (err) {
    console.error("Fetch property data error:", err);
    return NextResponse.json({ success: false, message: "Internal Server Error" }, { status: 500 });
  }
}
