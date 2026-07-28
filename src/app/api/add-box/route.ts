// /app/api/add-box/route.ts
import { NextResponse } from 'next/server';
import supabaseServer from '@/config/supabaseServer';
import { getAuthedOfficer, isAdmin, unauthorized, forbidden } from '@/lib/apiAuth';

export async function POST(req: Request) {
  try {
    const officer = await getAuthedOfficer();
    if (!officer) return unauthorized();
    if (!isAdmin(officer.role)) return forbidden();

    const body = await req.json();
    const { boxInput, policeStation } = body;

    if (!boxInput?.trim() || !policeStation) {
      return NextResponse.json({ error: 'Missing box name or thana' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('thana_rack_box_table')
      .select('boxes')
      .eq('thana', policeStation)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Thana not found' }, { status: 404 });
    }

    const normalizedInput = boxInput.trim().toLowerCase();
    const existingBoxes = (data.boxes || []).map((b: string) => b.trim().toLowerCase());

    if (existingBoxes.includes(normalizedInput)) {
      return NextResponse.json({ error: 'Box already exists' }, { status: 409 });
    }

    const updatedBoxes = [...(data.boxes || []), normalizedInput];

    const { error: updateError } = await supabaseServer
      .from('thana_rack_box_table')
      .update({
        boxes: updatedBoxes,
        thana_box_updated_by: officer.email,
        thana_box_updated_at: new Date().toISOString(),
      })
      .eq('thana', policeStation);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update box' }, { status: 500 });
    }

    return NextResponse.json({ message: 'Box added successfully' }, { status: 200 });

  } catch {
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 });
  }
}
