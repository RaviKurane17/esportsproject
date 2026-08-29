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

const router: IRouter = Router();
const registrations: Registration[] = [];

router.get("/games", (_req, res) => {
  res.json(ListGamesResponse.parse(games));
});

router.get("/tournaments", (req, res) => {
  const query = ListTournamentsQueryParams.parse(req.query);
  const search = query.search?.toLowerCase();
  const filtered = tournaments
    .filter((tournament) => !query.game || tournament.gameSlug === query.game)
    .filter((tournament) => !query.entryType || query.entryType === "all" || tournament.entryType.toLowerCase() === query.entryType)
    .filter((tournament) => !query.status || tournament.status === query.status)
    .filter((tournament) => !search || `${tournament.title} ${tournament.game} ${tournament.organizer}`.toLowerCase().includes(search));
  res.json(ListTournamentsResponse.parse(filtered));
});

router.get("/tournaments/:id", (req, res) => {
  const params = GetTournamentParams.parse(req.params);
  const tournament = tournaments.find((item) => item.id === params.id);
  if (!tournament) {
    res.status(404).json({ error: "Tournament not found" });
    return;
  }
  res.json(GetTournamentResponse.parse(tournament));
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