import { NextResponse } from "next/server";
import supabaseServer from "@/config/supabaseServer";
import { admin } from "@/lib/firebaseAdmin";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req: Request) {
  try {
    if (!JWT_SECRET) {
      return NextResponse.json(
        { allowed: false, error: "Server auth is not configured" },
        { status: 500 }
      );
    }

    const { idToken } = await req.json();

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json(
        { allowed: false, error: "No ID token provided" },
        { status: 400 }
      );
    }

    // Verify the Firebase ID token. The email is taken from the *verified*
    // token, never from the request body — this is what prevents a caller from
    // minting a session for an arbitrary officer email.
    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(idToken);
    } catch {
      return NextResponse.json(
        { allowed: false, error: "Invalid or expired sign-in" },
        { status: 401 }
      );
    }

    const email = decoded.email;
    if (!email || decoded.email_verified === false) {
      return NextResponse.json(
        { allowed: false, error: "Email not verified" },
        { status: 403 }
      );
    }

    // The email must belong to a whitelisted officer.
    const { data, error } = await supabaseServer
      .from("officer_table")
      .select("officer_name, role, thana, created_at, phone")
      .ilike("email_id", email)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ allowed: false }, { status: 403 });
    }

    const payload = {
      name: data.officer_name,
      role: data.role,
      thana: data.thana,
      email,
      created_at: data.created_at,
      phone: data.phone,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "15d" });

    const response = NextResponse.json({
      allowed: true,
      name: data.officer_name,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 15,
    });
    return response;
  } catch (err) {
    console.error("verify-user error:", err instanceof Error ? err.message : "unknown");
    return NextResponse.json(
      { allowed: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
