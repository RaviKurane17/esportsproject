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
import { eq, and, notInArray, sql } from "drizzle-orm";
import { sendConfirmationEmail } from "../lib/email";
import { db, tournaments as tournamentsTable, games as gamesTable, registrations as registrationsTable, payments as paymentsTable, results as resultsTable } from "@workspace/db";

const router: IRouter = Router();
const registrations: Registration[] = [];

router.get("/games", (_req, res) => {
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=600');
  res.json(ListGamesResponse.parse(games));
});

router.get("/tournaments", async (req, res) => {
  try {
    const query = ListTournamentsQueryParams.parse(req.query);
    const search = query.search?.toLowerCase();
    
    // Fetch all real tournaments from database joined with game
    const dbTournaments = await db.select({
      tournament: tournamentsTable,
      game: gamesTable,
      registeredCount: sql<number>`count(${registrationsTable.id})::int`
    })
    .from(tournamentsTable)
    .innerJoin(gamesTable, eq(tournamentsTable.gameId, gamesTable.id))
    .leftJoin(registrationsTable, and(
      eq(registrationsTable.tournamentId, tournamentsTable.id),
      notInArray(registrationsTable.status, ['CANCELLED', 'REFUNDED'])
    ))
    .groupBy(tournamentsTable.id, gamesTable.id);

    // Map them to the frontend expected type (TournamentDetail)
    const mapped = dbTournaments.map(row => {
      // Create slug and color mappings since they are missing from DB schema
      const rawName = row.game.name.toLowerCase();
      let gameSlug = rawName.replace(/ /g, '-');
      let accent = "#000000";
      
      if (rawName.includes("battlegrounds") || rawName.includes("bgmi")) {
        gameSlug = "bgmi";
        accent = "#ffb547";
      } else if (rawName.includes("free fire")) {
        gameSlug = "free-fire";
        accent = "#ff5c73";
      } else if (rawName.includes("ludo")) {
        gameSlug = "ludo";
        accent = "#8f7cff";
      }

      const participants = (row.registeredCount || 0) * row.tournament.teamSize;
      const status = row.tournament.status === 'REGISTRATION_OPEN' ? 'OPEN' : row.tournament.status;
      const registrationStatus = participants >= row.tournament.maxSlots ? 'FULL' : 'AVAILABLE';

      return {
        id: row.tournament.id.toString(),
        title: row.tournament.name,
        game: row.game.name,
        gameSlug,
        organizer: "NEXARENA Official", // default
        date: row.tournament.matchDate.toISOString().split("T")[0],
        time: row.tournament.matchDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
        entryFee: row.tournament.entryFee,
        prizePool: row.tournament.prizePool / 100, // Zod expects number
        participants, // Zod expects 'participants', not 'currentParticipants'
        maxParticipants: row.tournament.maxSlots,
        banner: row.tournament.bannerUrl || "/banners/banner1.png",
        status,
        registrationStatus, // Required by Zod
        entryType: row.tournament.entryFee > 0 ? "PAID" : "FREE",
        currency: "INR",
        teamSize: row.tournament.teamSize,
        format: row.tournament.format || "Squad",
        region: "India",
        accent
      };
    });

    // Filter
    const filtered = mapped
      .filter(t => !query.game || t.gameSlug === query.game)
      .filter(t => !query.entryType || query.entryType === "all" || t.entryType.toLowerCase() === query.entryType)
      .filter(t => !query.status || t.status === query.status)
      .filter(t => !search || `${t.title} ${t.game} ${t.organizer}`.toLowerCase().includes(search));

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
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
      game: gamesTable,
      registeredCount: sql<number>`count(${registrationsTable.id})::int`
    })
    .from(tournamentsTable)
    .innerJoin(gamesTable, eq(tournamentsTable.gameId, gamesTable.id))
    .leftJoin(registrationsTable, and(
      eq(registrationsTable.tournamentId, tournamentsTable.id),
      notInArray(registrationsTable.status, ['CANCELLED', 'REFUNDED'])
    ))
    .where(eq(tournamentsTable.id, tournamentId))
    .groupBy(tournamentsTable.id, gamesTable.id);

    if (!dbRow) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    const t = dbRow.tournament;
    const g = dbRow.game;
    
    const rawName = g.name.toLowerCase();
    let gameSlug = rawName.replace(/ /g, '-');
    let accent = "#000000";
    
    if (rawName.includes("battlegrounds") || rawName.includes("bgmi")) {
      gameSlug = "bgmi";
      accent = "#ffb547";
    } else if (rawName.includes("free fire")) {
      gameSlug = "free-fire";
      accent = "#ff5c73";
    } else if (rawName.includes("ludo")) {
      gameSlug = "ludo";
      accent = "#8f7cff";
    }

    const participants = (dbRow.registeredCount || 0) * t.teamSize;
    
    const mapped = {
      id: t.id.toString(),
      title: t.name,
      game: g.name,
      gameSlug,
      organizer: "NEXARENA Official",
      date: t.matchDate.toISOString().split("T")[0],
      time: t.matchDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      entryFee: t.entryFee,
      prizePool: t.prizePool / 100,
      participants,
      maxParticipants: t.maxSlots,
      banner: t.bannerUrl || "/banners/banner1.png",
      status: t.status === 'REGISTRATION_OPEN' ? 'OPEN' : t.status,
      registrationStatus: participants >= t.maxSlots ? 'FULL' : 'AVAILABLE',
      entryType: t.entryFee > 0 ? "PAID" : "FREE",
      currency: "INR",
      teamSize: t.teamSize,
      format: t.format || "Squad",
      region: "India",
      accent,
      registrationDeadline: t.registrationCloses?.toISOString().split("T")[0] || t.matchDate.toISOString().split("T")[0],
      upiId: t.upiId,
      paymentQrUrl: t.paymentQrUrl,
      resultImageUrl: t.resultImageUrl,
      eligibility: ["Mobile players only", "Must be on Discord"],
      rules: ["No emulators", "Record POV"],
      prizes: [
        { place: "1st", amount: (t.prizePool / 100) * 0.6, label: "Winner" },
        { place: "2nd", amount: (t.prizePool / 100) * 0.3, label: "Runner Up" },
        { place: "3rd", amount: (t.prizePool / 100) * 0.1, label: "Third Place" }
      ],
      schedule: [
        { label: "Check-in", detail: "30 mins before start", state: "NEXT" as const }
      ]
    };

    res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=60');
    res.json(GetTournamentResponse.parse(mapped));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
});



router.post("/tournaments/:id/register", async (req, res) => {
  try {
    const params = RegisterForTournamentParams.parse(req.params);
    const body = RegisterForTournamentBody.parse(req.body);
    const tournamentId = parseInt(params.id);

    if (isNaN(tournamentId)) {
      return res.status(404).json({ error: "Invalid tournament ID" });
    }

    const dbTournament = await db.query.tournaments.findFirst({
      where: eq(tournamentsTable.id, tournamentId)
    });

    if (!dbTournament) {
      return res.status(404).json({ error: "Tournament not found" });
    }

    // Check capacity
    const [{ registeredCount }] = await db.select({
      registeredCount: sql<number>`count(${registrationsTable.id})::int`
    })
    .from(registrationsTable)
    .where(and(
      eq(registrationsTable.tournamentId, tournamentId),
      notInArray(registrationsTable.status, ['CANCELLED', 'REFUNDED'])
    ));

    const participants = (registeredCount || 0) * dbTournament.teamSize;
    if (participants + dbTournament.teamSize > dbTournament.maxSlots) {
      return res.status(400).json({ error: "Tournament is full" });
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
      amount: dbTournament.entryFee,
      screenshotUrl: body.screenshotUrl,
      utrNumber: body.utrNumber,
      status: "PENDING"
    });

    // Send confirmation email asynchronously (no await)
    sendConfirmationEmail(body.email, body.teamName || body.captainName, dbTournament.title).catch(console.error);

    res.status(201).json({ id: registration.id.toString(), tournamentId: params.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to register" });
  }
});

router.get("/dashboard/summary", async (_req, res) => {
  try {
    // For MVP, we don't have authenticated users yet, so this is just guest data
    // Count total live and upcoming from db
    const liveCount = await db.select().from(tournamentsTable).where(eq(tournamentsTable.status, 'ONGOING'));
    const upcomingCount = await db.select().from(tournamentsTable).where(eq(tournamentsTable.status, 'REGISTRATION_OPEN'));

    res.json(GetDashboardSummaryResponse.parse({
      playerName: "Guest Gamer",
      gamerTag: "GUEST",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Guest",
      upcomingCount: upcomingCount.length,
      liveCount: liveCount.length,
      completedCount: 0,
      totalPoints: 0,
      nextMatch: null,
    }));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/dashboard/tournaments", async (_req, res) => {
  try {
    // Return the latest registrations
    const recentRegs = await db.select({
      registration: registrationsTable,
      tournament: tournamentsTable,
      game: gamesTable
    })
    .from(registrationsTable)
    .innerJoin(tournamentsTable, eq(registrationsTable.tournamentId, tournamentsTable.id))
    .innerJoin(gamesTable, eq(tournamentsTable.gameId, gamesTable.id))
    .orderBy(registrationsTable.createdAt);

    const mapped = recentRegs.map(row => ({
      id: row.registration.id.toString(),
      tournamentId: row.tournament.id.toString(),
      title: row.tournament.name,
      game: row.game.name,
      date: row.tournament.matchDate.toISOString().split("T")[0],
      time: row.tournament.matchDate.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
      status: row.registration.status === 'CONFIRMED' ? 'REGISTERED' : 'PENDING_PAYMENT',
      teamName: row.registration.teamName || "Solo Player",
      registrationDate: row.registration.createdAt.toISOString()
    }));

    res.json(GetDashboardTournamentsResponse.parse(mapped));
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.get("/leaderboards", (req, res) => {
  const query = ListLeaderboardsQueryParams.parse(req.query);
  const filtered = query.game ? leaderboard.filter((entry) => entry.game.toLowerCase() === query.game?.toLowerCase()) : leaderboard;
  res.json(ListLeaderboardsResponse.parse(filtered));
});

// Get tournament results
router.get("/:id/results", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const tournamentResults = await db.query.results.findMany({
      where: eq(resultsTable.tournamentId, tournamentId),
      orderBy: (results, { asc }) => [asc(results.rank)]
    });
    res.json(tournamentResults);
  } catch (error) {
    console.error("Failed to fetch results:", error);
    res.status(500).json({ error: "Failed to fetch results" });
  }
});

// Check booking status + get room credentials
router.get("/tournaments/:id/booking/:bookingId", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const bookingId = parseInt(req.params.bookingId);
    
    const reg = await db.query.registrations.findFirst({
      where: (regs, { eq, and }) => and(
        eq(regs.id, bookingId),
        eq(regs.tournamentId, tournamentId)
      )
    });

    if (!reg) {
      return res.status(404).json({ error: "Booking not found. Please check your Booking ID." });
    }

    // Get tournament to check if room credentials are set
    const tournament = await db.query.tournaments.findFirst({
      where: eq(tournamentsTable.id, tournamentId)
    });

    res.json({
      bookingId: reg.id,
      teamName: reg.teamName,
      captainName: reg.captainName,
      status: reg.status,
      roomId: null,
      roomPassword: null,
      message: reg.status === 'CONFIRMED' 
        ? 'Your squad is confirmed! Room details will be sent to your registered email 15 minutes before the match. If you face any issues, DM us on Instagram @official_nexarena.'
        : 'Your payment is under review. Please wait for admin verification.'
    });
  } catch (error) {
    console.error("Booking check error:", error);
    res.status(500).json({ error: "Failed to check booking" });
  }
});

export default router;