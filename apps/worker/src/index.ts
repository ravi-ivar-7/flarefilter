import { Hono } from 'hono';
import { runCronTasks } from './cron';

// Shared Env bindings — only D1 is needed; BLOCKLIST KV removed (unused).
export interface Env {
    DB: D1Database;
}

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => c.text('FlareFilter Worker is running!'));

export default {
    // 1. Fetch event (Hono router for explicit API calls from outside the dashboard)
    fetch: app.fetch,

    // 2. Scheduled event (Cron trigger — runs every minute per wrangler.toml)
    async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
        console.log(`Cron triggered at ${new Date(event.scheduledTime).toISOString()}`);
        ctx.waitUntil(runCronTasks(env));
    },
};
