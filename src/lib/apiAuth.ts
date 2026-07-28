// Central API authentication/authorization guard.
//
// Every API route handler that reads or mutates data must call
// `getAuthedOfficer()` first and reject the request when it returns null.
// Role and thana are taken from the *verified* session JWT here — never from
// the request body — so a caller cannot escalate privileges or read another
// station's data by editing what they POST.
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export type AuthedOfficer = {
  email: string;
  role: string;
  thana: string;
  name?: string;
};

/**
 * Reads the `token` cookie, verifies the session JWT, and returns the officer
 * identity it encodes. Returns null when there is no token, the token is
 * invalid/expired, or the secret is misconfigured.
 */
export async function getAuthedOfficer(): Promise<AuthedOfficer | null> {
  if (!JWT_SECRET) return null;

  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return null;

    const decoded = jwt.verify(token, JWT_SECRET) as jwt.JwtPayload;
    if (!decoded || typeof decoded.email !== "string") return null;

    return {
      email: decoded.email,
      role: typeof decoded.role === "string" ? decoded.role : "",
      thana: typeof decoded.thana === "string" ? decoded.thana : "",
      name: typeof decoded.name === "string" ? decoded.name : undefined,
    };
  } catch {
    return null;
  }
}

export function isAdmin(role: string): boolean {
  return role === "admin" || role === "super admin";
}

export function isSuperAdmin(role: string): boolean {
  return role === "super admin";
}

/** Officers scoped to a single station (must be filtered by their thana). */
export function isStationScoped(role: string): boolean {
  return role === "viewer" || role === "thana admin";
}

export function unauthorized(message = "Unauthorized") {
  return NextResponse.json({ error: message }, { status: 401 });
}

export function forbidden(message = "Forbidden") {
  return NextResponse.json({ error: message }, { status: 403 });
}
