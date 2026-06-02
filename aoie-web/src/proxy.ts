import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const needsUsername =
      !!req.nextauth.token
        ?.usernameSetupRequired;
    const pathname =
      req.nextUrl.pathname;

    if (
      needsUsername &&
      pathname !== "/complete-profile"
    ) {
      return NextResponse.redirect(
        new URL(
          "/complete-profile",
          req.url
        )
      );
    }

    if (
      !needsUsername &&
      pathname === "/complete-profile"
    ) {
      return NextResponse.redirect(
        new URL("/feed", req.url)
      );
    }
  },
  {
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/profile/:path*",
    "/settings/:path*",
    "/upload/:path*",
    "/saved/:path*",
    "/collections/:path*",
    "/liked/:path*",
    "/complete-profile/:path*",
  ],
};
