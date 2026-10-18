// Client-side bearer token attacher for protected server functions.
// Reads the local Supabase session and returns headers to attach to the
// outgoing server-function request. The server validates the bearer token
// independently (requireSupabaseAuth middleware).
import { supabase } from "./client";

export async function attachSupabaseAuth(): Promise<HeadersInit | undefined> {
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) return undefined;
  return { Authorization: `Bearer ${token}` };
}
