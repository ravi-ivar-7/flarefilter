import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLocation,
} from "react-router";
import { useState } from "react";

import type { Route } from "./+types/root";
import "./app.css";
import { Header } from "~/components/Header";
import { Sidebar } from "~/components/Sidebar";
import { authClient } from "~/lib/auth-client";

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
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { data: session } = authClient.useSession();
  const location = useLocation();

  // Sidebar only shows when: user is authenticated AND not on the home page
  const isHomePage = location.pathname === "/";
  const showSidebar = !!session?.user && !isHomePage;

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900 overflow-hidden font-sans selection:bg-indigo-500/30">
      {/* Background glow */}
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top,_var(--tw-gradient-stops))] from-indigo-200/30 via-gray-50 to-gray-50 -z-10 pointer-events-none" />

      {/* Sidebar — only rendered when authenticated + not home */}
      {showSidebar && (
        <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      )}

      {/* Right column: Header + scrollable page content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto overflow-x-hidden relative">
        {/* Header — always shown */}
        <Header
          onToggleSidebar={showSidebar ? () => setIsSidebarOpen(!isSidebarOpen) : undefined}
        />

        {/* Page content */}
        <main className="flex-1">
          <Outlet />
        </main>
      </div>
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
