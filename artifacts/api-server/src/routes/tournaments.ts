import { Router, type IRouter } from "express";
import {
  GetDashboardSummaryResponse,
  GetDashboardTournamentsResponse,
  GetTournamentParams,
  GetTournamentResponse,
  ListGamesResponse,
  ListLeaderboardsQueryParams,
  ListLeaderboardsResponse,
  ListTournamentsQueryParams,
  ListTournamentsResponse,
  RegisterForTournamentBody,
  RegisterForTournamentParams,
  RegisterForTournamentResponse,
} from "@workspace/api-zod";
import {
  dashboardSummary,
  games,
  leaderboard,
  registeredTournaments,
  tournaments,
  type Registration,
} from "./tournament-data";
import { eq } from "drizzle-orm";

const router: IRouter = Router();
const registrations: Registration[] = [];

router.get("/games", (_req, res) => {
  res.json(ListGamesResponse.parse(games));
});

router.get("/tournaments", async (req, res) => {
  try {
    const query = ListTournamentsQueryParams.parse(req.query);
    const search = query.search?.toLowerCase();
    
    // Fetch all real tournaments from database joined with game
    const dbTournaments = await db.select({
      tournament: tournamentsTable,
      game: gamesTable
    })
    .from(tournamentsTable)
    .innerJoin(gamesTable, eq(tournamentsTable.gameId, gamesTable.id));

    // Map them to the frontend expected type (TournamentDetail)
    const mapped = dbTournaments.map(row => ({
      id: row.tournament.id.toString(),
      title: row.tournament.name,
      game: row.game.name,
      gameSlug: row.game.slug,
      organizer: "NEXARENA Official", // default
      date: row.tournament.matchDate.toISOString().split("T")[0],
      time: row.tournament.matchDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      entryFee: row.tournament.entryFee,
      prizePool: `₹${row.tournament.prizePool / 100}`, // paise to INR
      maxParticipants: row.tournament.maxSlots,
      currentParticipants: 0, // Should count registrations in real life
      banner: row.tournament.bannerUrl || "/banners/banner1.png",
      status: row.tournament.status === 'REGISTRATION_OPEN' ? 'OPEN' : row.tournament.status,
      entryType: row.tournament.entryFee > 0 ? "PAID" : "FREE",
      currency: "INR",
      teamSize: row.tournament.teamSize,
      format: row.tournament.format || "Squad",
      region: "India",
      accent: row.game.color || "#000000"
    }));

    // Filter
    const filtered = mapped
      .filter(t => !query.game || t.gameSlug === query.game)
      .filter(t => !query.entryType || query.entryType === "all" || t.entryType.toLowerCase() === query.entryType)
      .filter(t => !query.status || t.status === query.status)
      .filter(t => !search || `${t.title} ${t.game} ${t.organizer}`.toLowerCase().includes(search));

    res.json(ListTournamentsResponse.parse(filtered));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch tournaments" });
  }
});

router.get("/tournaments/:id", async (req, res) => {
  try {
    const params = GetTournamentParams.parse(req.params);
    const tournamentId = parseInt(params.id);

    if (isNaN(tournamentId)) {
      // Fallback for dummy data IDs
      const dummyTournament = tournaments.find((item) => item.id === params.id);
      if (dummyTournament) {
        return res.json(GetTournamentResponse.parse(dummyTournament));
      }
      return res.status(404).json({ error: "Tournament not found" });
    }

    const [dbRow] = await db.select({
      tournament: tournamentsTable,
      game: gamesTable
    })
    .from(tournamentsTable)
    .innerJoin(gamesTable, eq(tournamentsTable.gameId, gamesTable.id))
    .where(eq(tournamentsTable.id, tournamentId));

    if (!dbRow) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    const t = dbRow.tournament;
    const g = dbRow.game;

    const mapped = {
      id: t.id.toString(),
      title: t.name,
      game: g.name,
      gameSlug: g.slug,
      organizer: "NEXARENA Official",
      date: t.matchDate.toISOString().split("T")[0],
      time: t.matchDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      entryFee: t.entryFee,
      prizePool: `₹${t.prizePool / 100}`,
      maxParticipants: t.maxSlots,
      currentParticipants: 0,
      banner: t.bannerUrl || "/banners/banner1.png",
      status: t.status === 'REGISTRATION_OPEN' ? 'OPEN' : t.status,
      entryType: t.entryFee > 0 ? "PAID" : "FREE",
      currency: "INR",
      teamSize: t.teamSize,
      format: t.format || "Squad",
      region: "India",
      accent: g.color || "#000000"
    };

    res.json(GetTournamentResponse.parse(mapped));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});

import { games as gamesTable, tournaments as tournamentsTable, registrations as registrationsTable, payments as paymentsTable, db } from "@workspace/db";

router.post("/tournaments/:id/register", async (req, res) => {
  try {
    const params = RegisterForTournamentParams.parse(req.params);
    const body = RegisterForTournamentBody.parse(req.body);
    
    // Find tournament in dummy data to get details
    const dummyTournament = tournaments.find((item) => item.id === params.id);
    if (!dummyTournament) {
      res.status(404).json({ error: "Tournament not found" });
      return;
    }

    // Upsert into real DB to ensure we have a valid integer ID
    let dbTournament = await db.query.tournaments.findFirst({
      where: (t, { eq }) => eq(t.name, dummyTournament.title)
    });

    if (!dbTournament) {
       // Insert game if not exists
       let dbGame = await db.query.games.findFirst({ where: (g, { eq }) => eq(g.slug, dummyTournament.gameSlug) });
       if (!dbGame) {
         const newGames = await db.insert(gamesTable).values({ name: dummyTournament.game, slug: dummyTournament.gameSlug }).returning();
         dbGame = newGames[0];
       }
       
       const newTourneys = await db.insert(tournamentsTable).values({
          name: dummyTournament.title,
          gameId: dbGame.id,
          organizerId: 9999,
          prizePool: 0,
          entryFee: dummyTournament.entryFee,
          maxSlots: dummyTournament.maxParticipants,
          teamSize: 4,
          matchDate: new Date(),
       }).returning();
       dbTournament = newTourneys[0];
    }

    // Now create registration
    const [registration] = await db.insert(registrationsTable).values({
      tournamentId: dbTournament.id,
      teamName: body.teamName,
      captainName: body.captainName,
      contactWhatsApp: body.whatsapp,
      contactEmail: body.email,
      inGameId: body.inGameId,
      status: "PENDING_PAYMENT"
    }).returning();

    // Create Payment record with screenshot and UTR
    await db.insert(paymentsTable).values({
      registrationId: registration.id,
      amount: dummyTournament.entryFee,
      screenshotUrl: body.screenshotUrl,
      utrNumber: body.utrNumber,
      status: "PENDING"
    });

    res.status(201).json({ id: registration.id.toString(), tournamentId: params.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to register" });
  }
});

router.get("/dashboard/summary", (_req, res) => {
  res.json(GetDashboardSummaryResponse.parse(dashboardSummary));
});

router.get("/dashboard/tournaments", (_req, res) => {
  res.json(GetDashboardTournamentsResponse.parse(registeredTournaments));
});

router.get("/leaderboards", (req, res) => {
  const query = ListLeaderboardsQueryParams.parse(req.query);
  const filtered = query.game ? leaderboard.filter((entry) => entry.game.toLowerCase() === query.game?.toLowerCase()) : leaderboard;
  res.json(ListLeaderboardsResponse.parse(filtered));
});

export default router;