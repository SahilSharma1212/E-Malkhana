// /app/api/create-user/route.ts
import { NextResponse } from 'next/server';
import supabaseServer from '@/config/supabaseServer';
import { getAuthedOfficer, isAdmin, unauthorized, forbidden } from '@/lib/apiAuth';

export async function POST(req: Request) {
  try {
    const officer = await getAuthedOfficer();
    if (!officer) return unauthorized();
    if (!isAdmin(officer.role)) return forbidden();

    const body = await req.json();
    const { newusername, newuserEmail, newuserRole, newuserPhone, newuserThana } = body;

    if (!newusername || !newuserEmail || !newuserRole || !newuserPhone || !newuserThana) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const email = String(newuserEmail).trim().toLowerCase();
    const phone = String(newuserPhone).trim().toLowerCase();

    // Check email and phone separately with parameterized .eq() filters so user
    // input can't break out of a string-built PostgREST filter.
    const [{ data: byEmail, error: emailErr }, { data: byPhone, error: phoneErr }] =
      await Promise.all([
        supabaseServer.from('officer_table').select('id').eq('email_id', email).limit(1),
        supabaseServer.from('officer_table').select('id').eq('phone', phone).limit(1),
      ]);

    if (emailErr || phoneErr) {
      return NextResponse.json({ error: 'Error checking existing user.' }, { status: 500 });
    }

    if ((byEmail && byEmail.length > 0) || (byPhone && byPhone.length > 0)) {
      return NextResponse.json({ error: 'User with this email or phone already exists.' }, { status: 409 });
    }

    const { error: insertError } = await supabaseServer.from('officer_table').insert([
      {
        officer_name: String(newusername).toLowerCase(),
        email_id: email,
        phone,
        role: String(newuserRole).toLowerCase(),
        thana: String(newuserThana).toLowerCase(),
        updated_by: officer.email,
        updated_at: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User created successfully.' }, { status: 200 });
  } catch {
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}
