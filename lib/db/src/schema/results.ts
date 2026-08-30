import { mysqlTable, int, timestamp, varchar, text } from "drizzle-orm/mysql-core";
import { tournaments } from "./tournaments.js";
import { users } from "./users.js";
import { teams } from "./teams.js";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const results = mysqlTable("results", {
  id: int("id").autoincrement().primaryKey(),
  tournamentId: int("tournament_id").references(() => tournaments.id).notNull(),
  userId: int("user_id").references(() => users.id),
  teamId: int("team_id").references(() => teams.id),
  registrationId: int("registration_id"),
  teamName: varchar("team_name", { length: 255 }),
  rank: int("rank").notNull(),
  kills: int("kills").default(0),
  points: int("points").default(0),
  totalScore: int("total_score").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertResultSchema = createInsertSchema(results).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertResult = z.infer<typeof insertResultSchema>;
export type Result = typeof results.$inferSelect;
