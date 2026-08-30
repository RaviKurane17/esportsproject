import { mysqlTable, text, varchar, int, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";
import { users } from "./users";
import { tournaments } from "./tournaments";
import { teams } from "./teams";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const registrations = mysqlTable("registrations", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("user_id").references(() => users.id), // Optional for guests
  teamId: int("team_id").references(() => teams.id), // Optional for guests
  tournamentId: int("tournament_id").references(() => tournaments.id).notNull(),
  
  // Guest Squad Details
  teamName: varchar("team_name", { length: 255 }),
  captainName: varchar("captain_name", { length: 255 }),
  contactWhatsApp: varchar("contact_whatsapp", { length: 50 }),
  contactEmail: varchar("contact_email", { length: 255 }),
  inGameId: varchar("in_game_id", { length: 255 }),

  status: mysqlEnum('status', ['PENDING_PAYMENT', 'PAYMENT_REVIEW', 'CONFIRMED', 'CANCELLED', 'REFUNDED']).default('PENDING_PAYMENT').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRegistrationSchema = createInsertSchema(registrations).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Registration = typeof registrations.$inferSelect;
