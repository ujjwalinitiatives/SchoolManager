import type { Session } from "better-auth/types";
import { NextResponse, type NextRequest } from "next/server";

export default async function proxy(request: NextRequest) {
  // Edge runtime session fetch via standard fetch API or Better Auth endpoint
  const response = await fetch(new URL("/api/auth/get-session", request.nextUrl.origin), {
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
  });
  
  let session: Session | null = null;
  if (response.ok) {
    session = await response.json();
  }

  const { pathname } = request.nextUrl;

  // Protect dashboard routes
  if (!session && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // Redirect to dashboard if already logged in
  if (session && pathname === "/login") {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
