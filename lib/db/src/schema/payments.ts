import { mysqlTable, text, varchar, int, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";
import { registrations } from "./registrations";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const payments = mysqlTable("payments", {
  id: int("id").autoincrement().primaryKey(),
  registrationId: int("registration_id").references(() => registrations.id).notNull(),
  amount: int("amount").notNull(), // in paise or smallest currency unit
  upiId: varchar("upi_id", { length: 255 }),
  utrNumber: varchar("utr_number", { length: 255 }),
  screenshotUrl: text("screenshot_url"),
  payerName: varchar("payer_name", { length: 255 }),
  status: mysqlEnum('status', ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'REFUND_PENDING', 'REFUNDED']).default('PENDING').notNull(),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
