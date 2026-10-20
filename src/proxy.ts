import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isConfigured, publicEnv } from "@/lib/supabase/env";
import type { Database } from "@/lib/database.types";

export async function proxy(request: NextRequest) {
  // A streamed Server Component redirect produces an HTML 200 plus a
  // client-side meta refresh. Redirect the unconfigured entry point here so
  // the browser receives a normal HTTP redirect before rendering the shell.
  if (request.nextUrl.pathname === "/" && !isConfigured()) {
    return NextResponse.redirect(new URL("/setup", request.url));
  }
  if (!isConfigured()) return NextResponse.next();
  let response = NextResponse.next({ request });
  const { url, key } = publicEnv();
  const supabase = createServerClient<Database>(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(values) {
        values.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        values.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });
  await supabase.auth.getUser();
  response.headers.set("Cache-Control", "private, no-store");
  return response;
}
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
