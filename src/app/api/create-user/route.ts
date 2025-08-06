// /app/api/create-user/route.ts
import { NextResponse } from 'next/server';
import supabase from '@/config/supabaseConnect';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { newusername, newuserEmail, newuserRole, newuserPhone, newuserThana, updatedBy } = body;

    if (!newusername || !newuserEmail || !newuserRole || !newuserPhone || !newuserThana || !updatedBy) {
      return NextResponse.json({ error: 'Missing required fields.' }, { status: 400 });
    }

    const { data: existingUsers, error: checkError } = await supabase
      .from('officer_table')
      .select('*')
      .or(`email_id.eq.${newuserEmail},phone.eq.${newuserPhone}`);

    if (checkError) {
      console.error('Check error:', checkError.message);
      return NextResponse.json({ error: 'Error checking existing user.' }, { status: 500 });
    }

    if (existingUsers && existingUsers.length > 0) {
      return NextResponse.json({ error: 'User with this email or phone already exists.' }, { status: 409 });
    }

    const { error: insertError } = await supabase.from('officer_table').insert([
      {
        officer_name: newusername.toLowerCase(),
        email_id: newuserEmail.trim(),
        phone: newuserPhone.trim().toLowerCase(),
        role: newuserRole.toLowerCase(),
        thana: newuserThana.toLowerCase(),
        updated_by: updatedBy,
        updated_at: new Date().toISOString(),
      },
    ]);

    if (insertError) {
      console.error('Insert error:', insertError.message);
      return NextResponse.json({ error: 'Failed to create user.' }, { status: 500 });
    }

    return NextResponse.json({ message: 'User created successfully.' }, { status: 200 });
  } catch (err) {
    console.error('Unexpected error:', err);
    return NextResponse.json({ error: 'Unexpected server error.' }, { status: 500 });
  }
}
