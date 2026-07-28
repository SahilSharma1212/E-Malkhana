// app/api/add-rack/route.ts
import { NextRequest, NextResponse } from 'next/server';
import supabaseServer from '@/config/supabaseServer';
import { getAuthedOfficer, isAdmin, unauthorized, forbidden } from '@/lib/apiAuth';

export async function POST(req: NextRequest) {
  try {
    const officer = await getAuthedOfficer();
    if (!officer) return unauthorized();
    if (!isAdmin(officer.role)) return forbidden();

    const { rackInput, policeStation } = await req.json();

    if (!rackInput || !policeStation) {
      return NextResponse.json({ error: 'Missing fields.' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('thana_rack_box_table')
      .select('racks')
      .eq('thana', policeStation)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Thana not found.' }, { status: 404 });
    }

    const normalizedInput = rackInput.trim().toLowerCase();
    const existingRacks = (data.racks || []).map((r: string) => r.trim().toLowerCase());

    if (existingRacks.includes(normalizedInput)) {
      return NextResponse.json({ error: 'Rack already exists.' }, { status: 409 });
    }

    const updatedRacks = [...(data.racks || []), normalizedInput];

    const { error: updateError } = await supabaseServer
      .from('thana_rack_box_table')
      .update({
        racks: updatedRacks,
        thana_rack_updated_by: officer.email,
        thana_rack_updated_at: new Date().toISOString(),
      })
      .eq('thana', policeStation);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update rack.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Rack added successfully.' });
  } catch {
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}
