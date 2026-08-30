import { pgTable, text, serial, timestamp, integer, pgEnum } from "drizzle-orm/pg-core";
import { games } from "./games";
import { users } from "./users";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tournamentStatusEnum = pgEnum('tournament_status', ['UPCOMING', 'REGISTRATION_OPEN', 'ONGOING', 'COMPLETED', 'CANCELLED']);

export const tournaments = pgTable("tournaments", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  gameId: integer("game_id").references(() => games.id).notNull(),
  organizerId: integer("organizer_id").references(() => users.id).notNull(),
  description: text("description"),
  bannerUrl: text("banner_url"),
  prizePool: integer("prize_pool").notNull(), // in paise or smallest currency unit
  entryFee: integer("entry_fee").notNull(), // in paise or smallest currency unit
  maxSlots: integer("max_slots").notNull(),
  teamSize: integer("team_size").notNull().default(1),
  format: text("format"),
  rules: text("rules"),
  matchDate: timestamp("match_date").notNull(),
  registrationOpens: timestamp("registration_opens"),
  registrationCloses: timestamp("registration_closes"),
  upiId: text("upi_id"),
  paymentQrUrl: text("payment_qr_url"),
  resultImageUrl: text("result_image_url"),
  roomId: text("room_id"),
  roomPassword: text("room_password"),
  status: tournamentStatusEnum("status").default('UPCOMING').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTournamentSchema = createInsertSchema(tournaments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournaments.$inferSelect;
