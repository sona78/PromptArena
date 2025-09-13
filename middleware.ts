// Simplified middleware - no auth redirects, handled client-side
import { type NextRequest, NextResponse } from "next/server";

export function middleware(request: NextRequest) {
  return NextResponse.next();
}
