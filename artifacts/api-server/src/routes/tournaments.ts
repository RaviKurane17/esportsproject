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

router.post("/tournaments/:id/register", (req, res) => {
  const params = RegisterForTournamentParams.parse(req.params);
  const body = RegisterForTournamentBody.parse(req.body);
  const tournament = tournaments.find((item) => item.id === params.id);
  if (!tournament || tournament.registrationStatus !== "AVAILABLE" || tournament.participants >= tournament.maxParticipants) {
    res.status(400).json({ error: "This tournament is not accepting registrations." });
    return;
  }
  const registrationId = `WLT-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  const registration: Registration = {
    id: `registration-${Date.now()}`,
    tournamentId: tournament.id,
    registrationId,
    status: tournament.entryType === "PAID" ? "PENDING_PAYMENT" : "CONFIRMED",
    tournamentTitle: tournament.title,
    matchDate: tournament.date,
    matchTime: tournament.time,
    totalAmount: tournament.entryFee,
  };
  registrations.push(registration);
  tournament.participants += 1;
  res.status(201).json(RegisterForTournamentResponse.parse(registration));
  req.log.info({ registrationId, tournamentId: tournament.id, displayName: body.displayName }, "Tournament registration created");
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