import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

const SECRET_KEY = process.env.JWT_SECRET!; // Add this to .env file

export async function GET(request: Request) {
  const cookieHeader = request.headers.get('cookie');
  const token = cookieHeader?.match(/token=([^;]+)/)?.[1];

  if (!token) {
    return NextResponse.json({ authenticated: false });
  }

  try {
    const decoded = jwt.verify(token, SECRET_KEY); // verify and decode
    return NextResponse.json({ authenticated: true, user: decoded });
  } catch (err) {
    console.log('error - ', err)
    return NextResponse.json({ authenticated: false });
  }
}
