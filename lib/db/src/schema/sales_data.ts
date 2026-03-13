import { pgTable, text, real, integer, serial } from "drizzle-orm/pg-core";

export const salesData = pgTable("sales_data", {
  id: serial("id").primaryKey(),
  date: text("date").notNull(),
  region: text("region").notNull(),
  productCategory: text("product_category").notNull(),
  productName: text("product_name").notNull(),
  revenue: real("revenue").notNull(),
  unitsSold: integer("units_sold").notNull(),
});

export type SalesData = typeof salesData.$inferSelect;
