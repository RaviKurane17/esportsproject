import { pgTable, serial, timestamp, integer, text } from "drizzle-orm/pg-core";
import { tournaments } from "./tournaments";
import { users } from "./users";
import { teams } from "./teams";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  tournamentId: integer("tournament_id").references(() => tournaments.id).notNull(),
  userId: integer("user_id").references(() => users.id),
  teamId: integer("team_id").references(() => teams.id),
  registrationId: integer("registration_id"),
  teamName: text("team_name"),
  rank: integer("rank").notNull(),
  kills: integer("kills").default(0),
  points: integer("points").default(0),
  totalScore: integer("total_score").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertResultSchema = createInsertSchema(results).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertResult = z.infer<typeof insertResultSchema>;
export type Result = typeof results.$inferSelect;
