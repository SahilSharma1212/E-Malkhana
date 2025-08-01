import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";
import supabase from "@/config/supabaseConnect"; // ✅ your Supabase connection

const secret = new TextEncoder().encode(process.env.JWT_SECRET); // ✅ use .env secret

export async function middleware(request: NextRequest) {
  const token = request.cookies.get("token")?.value;
  const isLoginPage = request.nextUrl.pathname === "/sign-in";
  const isHomePage = request.nextUrl.pathname === "/";
  const fullUrl = request.url; // Get the entire URL

  console.log("🍪 Token from cookie:", token);

  // Step 1 & 3: No token handling
  if (!token) {
    if (isLoginPage) return NextResponse.next();
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // Step 2: Token exists
  try {
    const { payload } = await jwtVerify(token, secret);
    console.log("🧾 JWT payload after decode:", payload);

    // 🔍 Supabase check — validate email is legit
    const { data: officer, error } = await supabase
      .from("officer_table")
      .select("officer_name, role, thana, email_id")
      .eq("email_id", payload.email)
      .single();

    if (!officer || error) {
      console.error("🚫 Supabase verification failed:", error || "Officer not found");
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    console.log("✅ Officer verified in DB:", officer);

    // Redirect from sign-in to admin if token exists
    if (isLoginPage) {
      return NextResponse.redirect(new URL("/admin", request.url));
    }

    // Step 4: Special logic for homepage
    if (isHomePage) {
      // Query property_table for qr_id matching the full URL
      const { data: property, error: propertyError } = await supabase
        .from("property_table")
        .select("qr_id, property_id")
        .eq("qr_id", fullUrl)
        .single();

      if (propertyError) {
        console.error("🚫 Property table query failed:", propertyError);
        // Continue to homepage if query fails (optional: could redirect to error page)
        return NextResponse.next();
      }

      if (property) {
        // Check if property_id exists
        if (property.property_id) {
          // Redirect to /search-property/{property_id}
          return NextResponse.redirect(
            new URL(`/search-property/${property.property_id}`, request.url)
          );
        }
        // If property_id is empty, stay on homepage
        return NextResponse.next();
      }
      // If no matching qr_id, stay on homepage
      return NextResponse.next();
    }

    // Allow access to all other routes
    return NextResponse.next();

  } catch (err) {
    console.error("❌ Invalid token. Redirecting to /sign-in.", err);
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }
}

export const config = {
  matcher: [
    // apply only to pages, not API routes
    "/((?!api|_next|favicon.ico|.*\\..*).*)",
  ],
};