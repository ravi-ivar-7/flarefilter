import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
    index("routes/home.tsx"),
    route("dashboard/:tab?", "routes/dashboard.tsx"),
    route("auth", "routes/auth.tsx"),
    route("api/auth/*", "routes/api.auth.ts"),
    route("api/cloudflare", "routes/api.cloudflare.ts"),
    route("api/logs", "routes/api.logs.ts"),
] satisfies RouteConfig;
