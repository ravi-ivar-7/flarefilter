import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("dashboard", "routes/dashboard.tsx"),
    route("auth", "routes/auth.tsx"),
    route("api/auth/*", "routes/api.auth.ts"),
    route("api/cloudflare", "routes/api.cloudflare.ts"),
] satisfies RouteConfig;
