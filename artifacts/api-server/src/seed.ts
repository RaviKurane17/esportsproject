import { db } from "@workspace/db";
import { games as gamesTable, tournaments as tournamentsTable } from "@workspace/db/schema";
import { games, tournaments } from "./routes/tournament-data";

async function seed() {
  console.log("Seeding database...");
  
  // Insert games
  for (const game of games) {
    const [insertedGame] = await db.insert(gamesTable).values({
      name: game.title,
      slug: game.slug,
      coverUrl: game.coverImage,
    }).returning();
    
    // Insert tournaments for this game
    const gameTournaments = tournaments.filter(t => t.gameSlug === game.slug);
    for (const t of gameTournaments) {
      await db.insert(tournamentsTable).values({
        name: t.title,
        gameId: insertedGame.id,
        organizerId: 9999, // Dummy admin ID
        description: `${t.game} Tournament`,
        prizePool: parseInt(t.prizePool.replace(/[^0-9]/g, '')) * 100, // paise
        entryFee: t.entryFee,
        maxSlots: t.maxParticipants,
        teamSize: 4, // Squad size
        format: "Squad BR",
        rules: "Standard rules apply.",
        matchDate: new Date(t.date + " " + t.time),
        status: t.status === "OPEN" ? "REGISTRATION_OPEN" : (t.status === "UPCOMING" ? "UPCOMING" : "COMPLETED")
      });
    }
  }
  
  console.log("Database seeded successfully!");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seeding failed", err);
  process.exit(1);
});
