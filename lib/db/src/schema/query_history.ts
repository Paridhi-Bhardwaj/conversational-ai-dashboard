import { pgTable, text, serial, timestamp } from "drizzle-orm/pg-core";

export const queryHistory = pgTable("query_history", {
  id: serial("id").primaryKey(),
  query: text("query").notNull(),
  sql: text("sql").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type QueryHistory = typeof queryHistory.$inferSelect;
