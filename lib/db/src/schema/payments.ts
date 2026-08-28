import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { registrations } from "./registrations";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const paymentStatusEnum = pgEnum('payment_status', ['PENDING', 'UNDER_REVIEW', 'VERIFIED', 'REJECTED', 'REFUND_PENDING', 'REFUNDED']);

export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  registrationId: integer("registration_id").references(() => registrations.id).notNull(),
  amount: integer("amount").notNull(), // in paise or smallest currency unit
  upiId: text("upi_id"),
  utrNumber: text("utr_number"),
  screenshotUrl: text("screenshot_url"),
  payerName: text("payer_name"),
  status: paymentStatusEnum("status").default('PENDING').notNull(),
  rejectionReason: text("rejection_reason"),
  submittedAt: timestamp("submitted_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPaymentSchema = createInsertSchema(payments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Payment = typeof payments.$inferSelect;
