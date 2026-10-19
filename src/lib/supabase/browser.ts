"use client";
import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/lib/database.types";
import { publicEnv } from "./env";
export function createClient() {
  const { url, key } = publicEnv();
  return createBrowserClient<Database>(url, key);
}
