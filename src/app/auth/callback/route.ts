import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isConfigured } from "@/lib/supabase/env";
import { safeNext } from "@/lib/forms";
export async function GET(request: NextRequest) {
  if (!isConfigured())
    return NextResponse.redirect(new URL("/setup", request.url));
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error)
      return NextResponse.redirect(
        new URL(
          safeNext(request.nextUrl.searchParams.get("next")),
          request.url,
        ),
      );
  }
  return NextResponse.redirect(
    new URL(
      "/login?error=This%20link%20is%20invalid%20or%20expired.%20Request%20a%20new%20one.",
      request.url,
    ),
  );
}
