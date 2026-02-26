import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/d1";
import { organization } from "better-auth/plugins";
import * as schema from "@flarefilter/db/src/schema/index";

export const getAuth = (env: any) => {
    if (!env.BETTER_AUTH_SECRET) {
        throw new Error("BETTER_AUTH_SECRET is not set — refusing to start with an insecure configuration.");
    }

    const db = drizzle(env.DB, { schema });

    return betterAuth({
        baseURL: env.BETTER_AUTH_BASE_URL,
        database: drizzleAdapter(db, {
            provider: "sqlite",
        }),
        emailAndPassword: {
            enabled: true,
        },
        plugins: [organization()],
    });
};
