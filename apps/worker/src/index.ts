import { Hono } from 'hono';

// Shared Env bindings
export interface Env {
    DB: D1Database;
    BLOCKLIST: KVNamespace;
}

const app = new Hono<{ Bindings: Env }>();

app.get('/', (c) => c.text('FlareFilter Worker is running!'));

import { runCronTasks } from './cron';

export default {
    // 1. Fetch event (Hono router for explicit API calls, if any needed from outside the dashboard)
    fetch: app.fetch,

    // 2. Scheduled event (Cron trigger)
    async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
        console.log(`Cron triggered at ${new Date(event.scheduledTime).toISOString()}`);
        // Run our dynamic tenant-based logic
        await runCronTasks(env, ctx);
    },
};
