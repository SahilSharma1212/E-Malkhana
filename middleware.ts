import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import supabase from "@/supabaseConfig/supabaseConnect";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const fullUrl = request.nextUrl.href;

  console.log("🛂 Middleware triggered");
  console.log("📍 Pathname:", pathname);
  console.log("🔗 Full URL:", fullUrl);

  if (pathname === "/") {
    console.log("✅ Home page detected. Proceeding to check Supabase...");

    const { data, error } = await supabase
      .from("property_table")
      .select("property_id")
      .eq("qr_id", fullUrl)
      .single();

    if (error) {
      console.error("❌ Supabase error:", error);
    }

    if (!data || !data.property_id) {
      console.log("⚠️ No matching property_id found. Continuing to home page.");
      return NextResponse.next();
    }

    console.log("🏠 Found property_id:", data.property_id);
    console.log(`➡️ Redirecting to /search-property/${data.property_id}`);

    return NextResponse.redirect(
      new URL(`/search-property/${data.property_id}`, request.url)
    );
  }

  console.log("🚫 Not home page. Skipping middleware logic.");
  return NextResponse.next();
}

export const config = {
  matcher: '/',
};
