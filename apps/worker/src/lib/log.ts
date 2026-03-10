/**
 * Lightweight conditional logger for the Worker runtime.
 *
 * Call `initLogger(true)` once at the top of the cron handler to enable
 * verbose logging. When disabled (default), only `console.error` calls
 * (which are NOT routed through this module) will reach Cloudflare's logpush.
 *
 * This saves CPU time and logpush bandwidth in production.
 */
let _debug = false;

export function initLogger(debug: boolean): void {
    _debug = debug;
}

export function log(...args: unknown[]): void {
    if (_debug) console.log(...args);
}
