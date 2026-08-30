import { mysqlTable, text, varchar, int, timestamp, mysqlEnum } from "drizzle-orm/mysql-core";
import { games } from "./games";
import { users } from "./users";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const tournaments = mysqlTable("tournaments", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  gameId: int("game_id").references(() => games.id).notNull(),
  organizerId: int("organizer_id").references(() => users.id).notNull(),
  description: text("description"),
  bannerUrl: text("banner_url"),
  prizePool: int("prize_pool").notNull(), // in paise or smallest currency unit
  entryFee: int("entry_fee").notNull(), // in paise or smallest currency unit
  maxSlots: int("max_slots").notNull(),
  teamSize: int("team_size").notNull().default(1),
  format: varchar("format", { length: 255 }),
  rules: text("rules"),
  matchDate: timestamp("match_date").notNull(),
  registrationOpens: timestamp("registration_opens"),
  registrationCloses: timestamp("registration_closes"),
  upiId: varchar("upi_id", { length: 255 }),
  paymentQrUrl: text("payment_qr_url"),
  resultImageUrl: text("result_image_url"),
  roomId: varchar("room_id", { length: 255 }),
  roomPassword: varchar("room_password", { length: 255 }),
  status: mysqlEnum('status', ['UPCOMING', 'REGISTRATION_OPEN', 'ONGOING', 'COMPLETED', 'CANCELLED']).default('UPCOMING').notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertTournamentSchema = createInsertSchema(tournaments).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTournament = z.infer<typeof insertTournamentSchema>;
export type Tournament = typeof tournaments.$inferSelect;
