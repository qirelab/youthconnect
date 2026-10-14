import createMiddleware from "next-intl/middleware";
import { locales, defaultLocale } from "@/i18n/config";

export default createMiddleware({
  locales,
  defaultLocale,
  localePrefix: "as-needed", // Only add locale prefix when not default
});

export const config = {
  // Match all pathnames except for API routes, static files, etc.
  matcher: [
    "/",
    "/(ru|en|uk|be|pl|de|fr|es|it|pt|nl|ro|cs|sk|hu|bg|hr|sr|sl|lt|lv|et|fi|sv|da|el|kk|uz|hy|ka|az)/:path*",
    "/((?!api|_next|_vercel|images|.*\\..*).*)",
  ],
};
