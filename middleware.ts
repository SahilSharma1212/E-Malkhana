import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import supabase from "@/supabaseConfig/supabaseConnect";
export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const fullUrl = request.nextUrl.href;

  // If it's empty or root
  if (pathname == "/") {

    // Query Supabase
    const { data, error } = await supabase
      .from("property_table")
      .select("property_id")
      .eq("qr_id", fullUrl)
      .single();

    if (error || !data || !data.property_id) return NextResponse.next();

    // Redirect to the specific property search page
    return NextResponse.redirect(
      new URL(`/search-property/${data.property_id}`, request.url)
    );
  }
}
