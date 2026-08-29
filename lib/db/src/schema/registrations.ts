import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { users } from "./users";
import { tournaments } from "./tournaments";
import { teams } from "./teams";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const registrationStatusEnum = pgEnum('registration_status', ['PENDING_PAYMENT', 'PAYMENT_REVIEW', 'CONFIRMED', 'CANCELLED', 'REFUNDED']);

export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id), // Optional for guests
  teamId: integer("team_id").references(() => teams.id), // Optional for guests
  tournamentId: integer("tournament_id").references(() => tournaments.id).notNull(),
  
  // Guest Squad Details
  teamName: text("team_name"),
  captainName: text("captain_name"),
  contactWhatsApp: text("contact_whatsapp"),
  contactEmail: text("contact_email"),
  inGameId: text("in_game_id"),

  status: registrationStatusEnum("status").default('PENDING_PAYMENT').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertRegistrationSchema = createInsertSchema(registrations).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRegistration = z.infer<typeof insertRegistrationSchema>;
export type Registration = typeof registrations.$inferSelect;
