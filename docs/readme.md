# FlareStack

FlareStack is a tool that runs on Cloudflare Workers to automatically block IPs that are hitting your site too hard. 

Instead of processing every single request in real-time (which gets expensive), it runs on a cron schedule, asks the Cloudflare GraphQL Analytics API "who made too many requests recently?", and then automatically shoves those IPs into a Cloudflare WAF Custom List to drop them at the edge.

## How it Works

The system is split into three main parts:

1. **Cloudflare Worker:** A cron schedule that wakes up every minute, reads your rules from the database, and queries the Cloudflare Analytics GraphQL API to find IPs that crossed your thresholds. If an IP is being abusive, it uses the Cloudflare API to add it to a WAF Custom List.
2. **Cloudflare D1:** A serverless SQLite database. This stores your Cloudflare API tokens, which zones you are monitoring, and your actual mitigation rules (e.g. "Block any IP that makes > 10,000 requests in 5 minutes").
3. **Dashboard:** A React UI to add your Cloudflare accounts, create new rules, and view the audit log of which IPs were blocked recently.

## Tech Stack

- **Worker:** Cloudflare Workers + TypeScript
- **Database:** Cloudflare D1 + Drizzle ORM
- **Dashboard:** React Router v7 + Tailwind CSS
- **Auth:** Better-Auth (using SQLite)

## Current Features

Currently, FlareStack supports one primary rule type: **Add IP to List**.

You configure a threshold (e.g., 5,000 requests) and a time window (e.g., 5 minutes). The worker will find any IP that exceeded that limit within the window and automatically append it to a Cloudflare Custom List of your choosing.

Because it updates actual Cloudflare WAF lists, the blocking happens natively at Cloudflare's edge with absolutely zero added latency to your origin server.

## Documentation

- [Setup Guide](./setup.md) - How to run it locally or deploy it to your own Cloudflare account using GitHub actions or Wrangler.
- [Extending Rules](./extending-rules.md) - How to add new types of mitigation rules to the engine.
- [TODO](./todo.md) - Upcoming features.