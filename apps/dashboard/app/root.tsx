import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import { Header } from "~/components/Header";
import { Footer } from "~/components/Footer";

export const meta: Route.MetaFunction = () => [
  { title: "FlareFilter - Automated Cloudflare IP Protection" },
  { name: "description", content: "FlareFilter automatically detects and blocks abusive IP addresses on Cloudflare using real-time analytics. Protect your zones without lifting a finger." },
  { name: "theme-color", content: "#4f46e5" },
  { property: "og:type", content: "website" },
  { property: "og:site_name", content: "FlareFilter" },
  { property: "og:title", content: "FlareFilter - Automated Cloudflare IP Protection" },
  { property: "og:description", content: "Detect and block abusive IPs on Cloudflare automatically. Real-time analytics, configurable thresholds, and zero manual intervention." },
  { property: "og:image", content: "/welcome/og-image.png" },
  { name: "robots", content: "noindex, nofollow" }, // dashboard is private
];

export const links: Route.LinksFunction = () => [
  // Fonts
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
  { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap" },

  // Favicons
  { rel: "icon", type: "image/x-icon", href: "/favicon.ico" },
  { rel: "icon", type: "image/png", sizes: "16x16", href: "/welcome/favicon-16x16.png" },
  { rel: "icon", type: "image/png", sizes: "32x32", href: "/welcome/favicon-32x32.png" },
  { rel: "icon", type: "image/png", sizes: "48x48", href: "/welcome/favicon-48x48.png" },

  // Apple / iOS
  { rel: "apple-touch-icon", sizes: "180x180", href: "/welcome/apple-touch-icon.png" },

  // Web manifest (Android, PWA)
  { rel: "manifest", href: "/welcome/site.webmanifest" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-200 selection:text-slate-900 flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
