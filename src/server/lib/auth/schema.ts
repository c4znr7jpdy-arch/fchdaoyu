import { boolean, pgSchema, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core';

const betterAuthSchema = pgSchema(
  process.env.BETTER_AUTH_DB_SCHEMA?.trim() || 'better_auth',
);

export const authUsers = betterAuthSchema.table('user', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  emailVerified: boolean('emailVerified').notNull(),
  image: text('image'),
  wxOpenid: text('wxOpenid'),
  createdAt: timestamp('createdAt', { mode: 'date' }).notNull(),
  updatedAt: timestamp('updatedAt', { mode: 'date' }).notNull(),
}, (table) => [
  uniqueIndex('auth_users_wx_openid_unique').on(table.wxOpenid),
]);
