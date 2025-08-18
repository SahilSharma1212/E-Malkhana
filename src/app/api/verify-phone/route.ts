import { NextRequest, NextResponse } from "next/server";
import supabase from "@/config/supabaseConnect"; // Adjust path
import jwt from "jsonwebtoken";
import { admin } from "@/lib/firebaseAdmin"; // Adjust path

const JWT_SECRET = process.env.JWT_SECRET;

export async function POST(req: NextRequest) {
  console.log("🚨 verify-phone route hit");

  try {
    const { idToken } = await req.json();
    if (!idToken) {
      return NextResponse.json({ allowed: false, error: "No ID token provided" }, { status: 400 });
    }

    // Verify Firebase ID token
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const phone = decodedToken.phone_number; // e.g., "+91XXXXXXXXXX"
    if (!phone) {
      return NextResponse.json({ allowed: false, error: "No phone number in token" }, { status: 400 });
    }

    console.log("Verified phone:", phone);

    // Query Supabase
    const { data, error } = await supabase
      .from("officer_table")
      .select("officer_name, role, thana, created_at, email_id, phone")
      .eq("phone", phone) // Assuming exact match; use .ilike if case-insensitive
      .maybeSingle();

    if (error || !data) {
      console.log("❌ Supabase error or user not found:", error);
      return NextResponse.json({ allowed: false }, { status: 403 });
    }

    console.log("data - ", data);
    const payload = {
      name: data.officer_name,
      role: data.role,
      thana: data.thana,
      email: data.email_id,
      created_at: data.created_at,
      phone: data.phone,
    };

    const token = jwt.sign(payload, JWT_SECRET!, { expiresIn: "15d" });

    const response = NextResponse.json({
      allowed: true,
      name: data.officer_name,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 15,
    });

    // Optional: Sign out from Firebase if you don't need it persisted
    // But since it's auth, you might want to keep it or sign out.

    return response;
  } catch (err) {
    console.error("🔥 API error:", err);
    return NextResponse.json({ allowed: false, error: "Internal Server Error" }, { status: 500 });
  }
}