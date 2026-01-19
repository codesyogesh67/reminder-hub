import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/sso-callback(.*)",
  "/api/webhooks/clerk",
]);

// Protect only real app pages that require auth
const isProtectedRoute = createRouteMatcher([
  "/dashboard(.*)",
  "/settings(.*)",
  "/areas(.*)",
  "/reminders(.*)",
  // add more protected pages here
]);

export default clerkMiddleware(async (auth, req) => {
  // 1️⃣ Allow public routes
  if (isPublicRoute(req)) {
    return NextResponse.next();
  }

  // 2️⃣ API routes → JSON 401 (NO redirect)
  if (req.nextUrl.pathname.startsWith("/api")) {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.next();
  }

  // 3️⃣ Protected pages → Clerk handles redirect
  if (isProtectedRoute(req)) {
    await auth.protect(); // ✅ auto redirect to /sign-in
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
