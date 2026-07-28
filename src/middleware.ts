import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import supabase from "@/config/supabaseConnect"; // ✅ your Supabase connection

const secret = new TextEncoder().encode(process.env.JWT_SECRET); // ✅ use .env secret

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const isLoginPage = (request.nextUrl.pathname === "/sign-in" || request.nextUrl.pathname === "/otp-login");
  const isHomePage = request.nextUrl.pathname === "/";
  const qrId = request.nextUrl.searchParams.get("qrId");

  // No token: allow the login pages, otherwise send to sign-in.
  if (!token) {
    if (isLoginPage) return NextResponse.next();
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Invalid/expired token: clear it so we don't loop, then show sign-in.
  let payload;
  try {
    ({ payload } = await jwtVerify(token, secret));
  } catch {
    const res = isLoginPage
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/sign-in", request.url));
    res.cookies.delete("token");
    return res;
  }

  // Validate the officer — case-insensitive to match how the session was minted,
  // and tolerant of transient DB errors so a blip can't mass-logout everyone.
  const { data: officer, error } = await supabase
    .from("officer_table")
    .select("officer_name, role, thana, email_id")
    .ilike("email_id", String(payload.email))
    .maybeSingle();

  // Genuinely not whitelisted (no error, no row): clear the stale cookie and
  // force sign-in. Clearing the cookie is what breaks the /admin ⇄ /sign-in loop.
  if (!error && !officer) {
    const res = isLoginPage
      ? NextResponse.next()
      : NextResponse.redirect(new URL("/sign-in", request.url));
    res.cookies.delete("token");
    return res;
  }

  // Valid session sitting on a login page → go to the console.
  if (isLoginPage) {
    return NextResponse.redirect(new URL("/admin", request.url));
  }

  // Homepage: resolve a scanned QR to its record when it's already filled.
  if (isHomePage && qrId) {
    const { data: property, error: propertyError } = await supabase
      .from("property_table")
      .select("qr_id, property_id")
      .ilike("qr_id", `%qrId=${qrId}`)
      .maybeSingle();

    if (propertyError) return NextResponse.next();
    if (property?.property_id) {
      return NextResponse.redirect(
        new URL(`/search-property/${property.property_id}`, request.url)
      );
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // apply only to pages, not API routes
    "/((?!api|_next|favicon.ico|.*\\..*).*)",
  ],
};
