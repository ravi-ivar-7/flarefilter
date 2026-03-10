import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import * as schema from "@flarestack/db/src/schema/index";
import { sendVerificationEmail } from "./email";

/** Minimum env bindings required to initialise Better Auth. */
export interface AuthEnv {
    DB: D1Database;
    BETTER_AUTH_SECRET: string;
    BETTER_AUTH_BASE_URL: string;
    RESEND_API_KEY?: string;
    RESEND_FROM?: string;
}

export const getAuth = (env: AuthEnv) => {
    if (!env.BETTER_AUTH_SECRET) {
        throw new Error("BETTER_AUTH_SECRET is not set — refusing to start with an insecure configuration.");
    }
    if (!env.BETTER_AUTH_BASE_URL) {
        throw new Error("BETTER_AUTH_BASE_URL is not set — email verification links and OAuth callbacks will be broken without it.");
    }

    const db = drizzle(env.DB, { schema });

    // Graceful degradation: only enable email verification if Resend is configured.
    // We check for both existence and non-empty string.
    const emailEnabled = !!(env.RESEND_API_KEY && env.RESEND_API_KEY.length > 0);

    return betterAuth({
        baseURL: env.BETTER_AUTH_BASE_URL,
        secret: env.BETTER_AUTH_SECRET,

        database: drizzleAdapter(db, {
            provider: "sqlite",
            schema: {
                user: schema.user,
                session: schema.session,
                account: schema.account,
                verification: schema.verification,
                rateLimit: schema.rateLimit
            }
        }),

        emailAndPassword: {
            enabled: true,
            // Only gate sign-in behind verification when we can actually send emails.
            requireEmailVerification: emailEnabled,
        },

        // Email verification — only wired up when Resend is configured.
        ...(emailEnabled && {
            emailVerification: {
                sendVerificationEmail: async ({ user, url }: { user: any; url: string }) => {
                    await sendVerificationEmail(
                        { RESEND_API_KEY: env.RESEND_API_KEY!, RESEND_FROM: env.RESEND_FROM, BETTER_AUTH_BASE_URL: env.BETTER_AUTH_BASE_URL },
                        user.email,
                        url
                    );
                },
                sendOnSignUp: true,
                autoSignInAfterVerification: true,
            },
        }),

        databaseHooks: {
            user: {
                create: {
                    before: async (user) => {
                        // If we aren't using email verification (e.g. local dev without Resend), 
                        // force all new users to be verified so they don't get stuck.
                        if (!emailEnabled) {
                            return { data: { ...user, emailVerified: true } };
                        }
                        return { data: user };
                    }
                }
            }
        },

        // Rate limiting — always enabled, stored in D1 (safe for serverless/edge).
        // NOTE: Better Auth skips rate limiting entirely when it can't detect an IP.
        // In production, Cloudflare always injects CF-Connecting-IP so this works automatically.
        // In local dev (Vite), there's no CF-Connecting-IP, so we fall back to 127.0.0.1
        // to ensure rate limiting is exercised during testing.
        rateLimit: {
            window: 60,  // 60-second baseline window
            max: 30,     // 30 requests/min general limit
            storage: "memory",
            customRules: {
                // Sign-in: 5 attempts per minute (brute-force protection)
                "/sign-in/email": { window: 60, max: 5 },
                // Sign-up: 3 per minute (bot/spam protection)
                "/sign-up/email": { window: 60, max: 3 },
                // Password reset & verification emails: 3 per minute (abuse protection)
                "/forget-password": { window: 60, max: 3 },
                "/send-verification-email": { window: 60, max: 3 },
                // Session checks are called on every page load — never rate limit these.
                "/get-session": false,
            },
        },

        advanced: {
            ipAddress: {
                // In production (Cloudflare), CF-Connecting-IP is always set.
                // In local dev (Vite), none of these are set.
                ipAddressHeaders: ["cf-connecting-ip", "x-forwarded-for", "x-real-ip"],
            },
        },
    });
};
