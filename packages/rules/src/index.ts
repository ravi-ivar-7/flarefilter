import { addIpToListRules } from "@flarefilter/db/src/schema/zones";

export type RuleType = "add_ip_to_list" | "js_challenge" | "block_country";

export interface RuleBaseConfig {
    type: RuleType;
    name: string;
    description: string;
    table?: any; // Drizzle table
}

export const RULES_MANIFEST: Record<RuleType, RuleBaseConfig> = {
    'add_ip_to_list': {
        type: 'add_ip_to_list',
        name: "Add IP to List",
        description: "Automatically adds IPs to a Cloudflare IP List once they exceed a defined request threshold.",
        table: addIpToListRules
    },
    'js_challenge': {
        type: 'js_challenge',
        name: "Dynamic JS Challenge",
        description: "Issues a JS Challenge to requests matching specific pattern-based signatures.",
        // table: jsChallengeRules (future)
    },
    'block_country': {
        type: 'block_country',
        name: "Geographic Block",
        description: "Blocks traffic originating from specific countries.",
        // table: countryBlockRules (future)
    }
};
