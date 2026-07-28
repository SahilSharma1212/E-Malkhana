import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client for privileged reads/writes inside API route
// handlers. Uses the service-role key when it is configured (bypassing RLS for
// trusted server code) and falls back to the anon key otherwise so the app
// keeps working in environments where the service-role key is not set.
//
// NEVER import this from a client component — the service-role key must not be
// bundled into browser JS. Use `@/config/supabaseConnect` (anon) on the client.
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseServer = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  serviceRoleKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

export default supabaseServer;
