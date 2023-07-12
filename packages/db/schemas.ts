import {
  pgTable,
  index,
  varchar,
  timestamp,
  uniqueIndex, 
} from 'drizzle-orm/pg-core';
import {InferModel} from 'drizzle-orm'

export const idCol = (col='id') => varchar(col).notNull().primaryKey()
export const tsCol = (col: string) => timestamp(col, {withTimezone: true}).defaultNow()

export const users = pgTable('users', {
  id: idCol(),
  email: varchar("email").notNull(),
  cognito_id: varchar("cognito_id"),
  created_at: tsCol("created_at"),
  updated_at: tsCol("updated_at"),
}, (t) => {
  return {
    ix_users_cognito_id: uniqueIndex("ix_users_cognito_id").on(t.cognito_id),
    ix_users_created_at: index("ix_users_created_at").on(t.created_at),
    ix_users_updated_at: index("ix_users_updated_at").on(t.updated_at),
    ix_users_email: uniqueIndex("ix_users_email").on(t.email),
  }
})
export type User = InferModel<typeof users>

export const notes = pgTable('notes', {
  id: idCol(),
  title: varchar("title").notNull(),
  text: varchar("text").notNull(),
  user_id: varchar("user_id").notNull().references(() => users.id, {onDelete: 'cascade'}),
  created_at: tsCol("created_at"),
  updated_at: tsCol("updated_at"),
}, (t) => {
  return {
    ix_notes_user_id: index("ix_notes_user_id").on(t.user_id),
    ix_notes_created_at: index("ix_notes_created_at").on(t.created_at),
    ix_notes_updated_at: index("ix_notes_updated_at").on(t.updated_at),
  }
})
export type Note = InferModel<typeof notes>