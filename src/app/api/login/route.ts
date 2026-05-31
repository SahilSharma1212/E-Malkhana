import { NextResponse } from "next/server";
import supabase from "@/config/supabaseConnect";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("officer_table")
      .select(
        "officer_name, role, thana, created_at, phone, email_id, password"
      )
      .ilike("email_id", email.trim())
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!data.password) {
      return NextResponse.json(
        {
          success: false,
          message:
            "No password set for this account. Please contact an admin to set your password.",
        },
        { status: 401 }
      );
    }

    if (data.password !== password) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      );
    }

    const payload = {
      name: data.officer_name,
      role: data.role,
      thana: data.thana,
      email: data.email_id,
      created_at: data.created_at,
      phone: data.phone,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "15d" });

    const response = NextResponse.json({
      success: true,
      name: data.officer_name,
    });

    response.cookies.set("token", token, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 15,
    });

    return response;
  } catch (err) {
    console.error("Login API error:", err);
    return NextResponse.json(
      { success: false, message: "Internal Server Error" },
      { status: 500 }
    );
  }
}
