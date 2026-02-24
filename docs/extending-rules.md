# Extending Rules in FlareFilter

FlareFilter uses a **Registry-Driven Architecture** that allows you to add new mitigation rules with minimal changes to the core engine and dashboard.

## Overview of the Architecture

The system is split into three layers to ensure performance and isolation:

1.  **The Manifest (`packages/rules`)**: The "Contract" between the Dashboard and Worker. No UI code here.
2.  **The Registry (`apps/dashboard`)**: Hydrates the lean Manifest with UI decorations (Icons, Modals, Details).
3.  **The Engine (`apps/worker`)**: Executes handlers based on the Manifest.

---

## Step-by-Step: Adding a New Rule

Let's say you want to add a new rule type called `rate_limit_path`.

### 1. Database Schema
First, define a new table for your rule in `packages/db/src/schema/zones.ts`.
```typescript
export const rateLimitPathRules = sqliteTable('rate_limit_path_rules', {
    id: text('id').primaryKey(),
    zoneConfigId: text('zone_config_id').notNull().references(() => zoneConfigs.id),
    path: text('path').notNull(),
    threshold: integer('threshold').default(100),
    isActive: integer('is_active', { mode: 'boolean' }).default(true),
    // ... other fields
});
```

### 2. The Shared Manifest
Add your rule to `packages/rules/src/index.ts`. This tells the Worker and Dashboard that the rule exists.
```typescript
export type RuleType = "add_ip_to_list" | "rate_limit_path";

export const RULES_MANIFEST: Record<RuleType, RuleBaseConfig> = {
    'rate_limit_path': {
        type: 'rate_limit_path',
        name: "Path-Based Rate Limit",
        description: "Monitors specific paths for request volume.",
        table: rateLimitPathRules // Reference the Drizzle table
    },
    // ...
};
```

### 3. Dashboard Registry
"Decorate" the rule in `apps/dashboard/app/lib/rules/registry.tsx`. This adds the UI components.
```typescript
const UI_DECORATIONS: Record<RuleType, RuleUIDefinition> = {
    'rate_limit_path': {
        icon: <PathIcon />,
        enabled: true,
        tag: "Beta",
        tagClasses: "bg-blue-100 text-blue-700 border-blue-200",
        addComponent: AddRateLimitModal, // Your modal component
        renderDetails: (rule) => (
            <div>Monitoring: {rule.path}</div>
        )
    },
    // ...
};
```

### 4. Worker Handler
Create a handler in `apps/worker/src/rules/` and register it in `apps/worker/src/rules/index.ts`.
```typescript
export const RuleHandlers: Record<string, RuleHandler> = {
    'rate_limit_path': async ({ zone, rule, cf, actionLogger }) => {
        // Your logic here:
        // 1. Fetch analytics from CF
        // 2. Compare against rule.threshold
        // 3. Log action if exceeded
    },
    // ...
};
```

---

## Benefits of this Approach

- **Zero-Touch Analytics**: The Dashboard loader automatically fetches rules from any table registered in the manifest.
- **Generic Actions**: The "Toggle Status" and "Delete" actions in the dashboard look up the correct Drizzle table using the Registry.
- **Worker Scalability**: The Worker Engine automatically iterates over all tables described in the manifest. You never have to touch `engine.ts`.
- **Environment Isolation**: Background Worker tasks never accidentally load React or SVG code because UI decorations are isolated in the Dashboard Registry.
