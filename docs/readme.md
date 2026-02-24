# FlareFilter
FlareFilter is an intelligent, edge-native IP reputation and automated blocking system built specifically for the Cloudflare ecosystem. It monitors traffic patterns in real-time, identifies high-velocity activity, and synchronizes lists across the global edge using Cloudflare Workers, D1, and KV.

## Architecture
FlareFilter operates on a "Analyze-Store-Enforce" loop:

### Cron Worker: A scheduled TypeScript worker that queries the Cloudflare GraphQL Analytics API. **The execution interval and analysis logic are 100% dynamic**, fetched from D1 to support multi-tenant configurations with safe defaults.

### Cloudflare D1: A SQLite database that stores historical traffic data, allowing for trend analysis and persistent reputation scoring. Drizzle ORM

### Workers KV: High-speed key-value storage used to distribute the "Active Blocklist" to every Cloudflare data center globally with sub-10ms latency.

### Next.js: A sleek dashboard to visualize mitigations, manage thresholds, and manually override blocks.

## Tech Stack

- Runtime: Cloudflare Workers (v8 interface)
- Database: Cloudflare D1 (SQLite at the edge)
- Storage: Workers KV (Low-latency key-value)
- Framework: Next.js (Admin Dashboard)
- Auth: Better-Auth (for multi-tenant SaaS authentication)
- Language: TypeScript
- Analysis: Cloudflare GraphQL Analytics API

## Features

- **SaaS-Ready:** No hardcoded settings. Every client's thresholds, execution frequencies, and **Cloudflare API keys** are managed via the dashboard and stored in D1 (No `.env` files for tenant configs).
- **V1 Focus:** Uses the Cloudflare GraphQL Analytics API as a data source to efficiently query: *"Give me all IPs that made > [Threshold] requests in the last hour,"* rather than fetching and processing every single log line manually. (Full, granular analytics parsing is planned for future versions).
- Automated Rate Detection: Catch "low and slow" or "burst" activity that standard WAF rules might miss.
- Historical Lookback: Don't just block for minutes—analyze patterns over days or weeks using D1.
- Zero-Latency Enforcement: Blocking happens at the edge, before your origin server is even touched.
- Admin Dashboard: Real-time visualization of mitigations and manual "VIP" allow-listing.

## Documentation

- [Setup Guide](./setup.md) - How to get started locally.
- [Extending Rules](./extending-rules.md) - How to add new rule types and handlers.
- [TODO](./todo.md) - Roadmap and pending features.