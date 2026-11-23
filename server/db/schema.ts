import { foreignKey, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import type { Issue } from '../../shared/types/analysis'
import { user } from './auth-schema'

export * from './auth-schema'

export const analyses = pgTable('analyses', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: text('user_id').notNull().references(() => user.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  originalHtml: text('original_html').notNull(),
  issues: jsonb('issues').$type<Issue[]>().notNull(),
  aiSuggestions: jsonb('ai_suggestions'),
  aiStatus: text('ai_status').notNull().default('idle'),
  aiModel: text('ai_model'),
  sourceAnalysisId: uuid('source_analysis_id'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
}, table => [
  index('analyses_user_history_idx').on(table.userId, table.createdAt.desc(), table.id.desc()),
  foreignKey({ columns: [table.sourceAnalysisId], foreignColumns: [table.id] }).onDelete('set null'),
])
