import { drizzle } from "drizzle-orm/d1";

/**
 * Returns a Drizzle D1 client for the given environment.
 * Centralises the DB instantiation so the adapter/binding never needs
 * changing in multiple route files.
 */
export function getDb(env: { DB: D1Database }) {
    return drizzle(env.DB);
}
