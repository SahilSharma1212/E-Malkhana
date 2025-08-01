import { NextResponse } from "next/server";
import supabase from "@/config/supabaseConnect";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!; // make sure this is in your .env.local

export async function POST(req: Request) {
  console.log("🚨 verify-user route hit");

  try {
    const { email } = await req.json();
    console.log("Received email:", email);

    if (!email) {
      return NextResponse.json({ allowed: false, error: "No email provided" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("officer_table")
      .select("officer_name, role, thana")
      .ilike("email_id", email)
      .maybeSingle();

    if (error || !data) {
      console.log("❌ Supabase error or user not found:", error);
      return NextResponse.json({ allowed: false }, { status: 403 });
    }



    const payload = {
      name: data.officer_name,
      role: data.role,
      thana: data.thana,
      email,
    };

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "30d" });

    const response = NextResponse.json({
      allowed:true,
      name:data.officer_name
    })

    response.cookies.set("token",token,{
      httpOnly:true
    })
    return response;

  } catch (err) {
    console.error("🔥 API error:", err);
    return NextResponse.json({ allowed: false, error: "Internal Server Error" }, { status: 500 });
  }
}
