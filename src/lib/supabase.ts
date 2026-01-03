// src/app/lib/supabase.ts

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

// We assume the env vars are set correctly (both locally and in Vercel)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
