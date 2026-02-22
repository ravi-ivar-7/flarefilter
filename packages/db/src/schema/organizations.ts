import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';
import { user } from './auth';

// Better-Auth organization / multi-tenancy tables

export const organization = sqliteTable("organization", {
    id: text("id").primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').unique(),
    logo: text('logo'),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
    metadata: text('metadata'), // JSON string
});

export const member = sqliteTable("member", {
    id: text("id").primaryKey(),
    organizationId: text('organizationId').notNull().references(() => organization.id),
    userId: text('userId').notNull().references(() => user.id),
    email: text('email'),
    role: text('role').notNull(),
    createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
});

export const invitation = sqliteTable("invitation", {
    id: text("id").primaryKey(),
    organizationId: text('organizationId').notNull().references(() => organization.id),
    email: text('email').notNull(),
    role: text('role'),
    status: text('status').notNull(),
    expiresAt: integer('expiresAt', { mode: 'timestamp' }).notNull(),
    inviterId: text('inviterId').notNull().references(() => user.id),
});
