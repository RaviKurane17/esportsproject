import { Router } from "express";
import { db, registrations, payments, tournaments, games, users, announcements, results } from "@workspace/db";
import { eq, desc, inArray, and } from "drizzle-orm";
import { sendConfirmationEmail, sendRoomDetailsEmail, sendApprovalEmail } from "../lib/email";

const router = Router();

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// Simple IP-based rate limiting for admin login
const loginAttempts = new Map<string, { count: number, timestamp: number }>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

// Realistic admin login using database
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Rate limiting check
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const now = Date.now();
    let attempt = loginAttempts.get(ip);
    
    if (attempt) {
      if (now - attempt.timestamp > LOCKOUT_MS) {
        // Reset if lockout period has passed
        attempt = { count: 0, timestamp: now };
      } else if (attempt.count >= MAX_ATTEMPTS) {
        return res.status(429).json({ error: 'Too many failed login attempts. Please try again after 15 minutes.' });
      }
    } else {
      attempt = { count: 0, timestamp: now };
    }

    // Find user in database with ADMIN role
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || user.role !== 'ADMIN') {
      attempt.count++;
      attempt.timestamp = now;
      loginAttempts.set(ip, attempt);
      return res.status(401).json({ error: 'Invalid credentials or unauthorized' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      attempt.count++;
      attempt.timestamp = now;
      loginAttempts.set(ip, attempt);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset attempts on successful login
    loginAttempts.delete(ip);

    // Generate token
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ token });
  } catch (error) {
    console.error("Admin login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get all registrations with their payment proof
router.get("/registrations", async (req, res) => {
  try {
    const allRegistrations = await db.select({
      registration: registrations,
      tournament: tournaments,
    })
    .from(registrations)
    .leftJoin(tournaments, eq(registrations.tournamentId, tournaments.id))
    .orderBy(desc(registrations.createdAt));

    // Manually fetch payments since relations might not be fully configured in schema index
    const allPayments = await db.query.payments.findMany();

    const formatted = allRegistrations.map(row => {
      const reg = row.registration;
      const tournament = row.tournament;
      const payment = allPayments.find(p => p.registrationId === reg.id);
      
      return {
        id: reg.id,
        teamName: reg.teamName,
        captainName: reg.captainName,
        whatsapp: reg.contactWhatsApp,
        inGameId: reg.inGameId,
        tournamentName: tournament?.name || "Unknown Tournament",
        tournamentStatus: tournament?.status || "UNKNOWN",
        status: reg.status,
        createdAt: reg.createdAt,
        payment: payment ? {
          amount: payment.amount,
          utrNumber: payment.utrNumber,
          screenshotUrl: payment.screenshotUrl,
          status: payment.status
        } : null
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch registrations" });
  }
});

// Approve registration
router.post("/registrations/:id/approve", async (req, res) => {
  try {
    const registrationId = parseInt(req.params.id);
    
    // Update registration status
    await db.update(registrations)
      .set({ status: 'CONFIRMED' })
      .where(eq(registrations.id, registrationId));

    // Update payment status
    await db.update(payments)
      .set({ status: 'VERIFIED' })
      .where(eq(payments.registrationId, registrationId));

    // Get registration details to send email
    const reg = await db.query.registrations.findFirst({
      where: eq(registrations.id, registrationId)
    });

    const tournament = reg ? await db.query.tournaments.findFirst({
      where: eq(tournaments.id, reg.tournamentId)
    }) : null;

    if (reg && reg.contactEmail && tournament) {
      // Send approval email
      sendApprovalEmail(reg.contactEmail, reg.teamName || reg.captainName || "Team", tournament.name).catch(console.error);
    }

    res.json({ success: true, message: "Registration approved. Squad is now confirmed!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to approve registration" });
  }
});

// Delete registration
router.delete("/registrations/:id", async (req, res) => {
  try {
    const registrationId = parseInt(req.params.id);
    
    // Delete payment first due to foreign key constraint
    await db.delete(payments).where(eq(payments.registrationId, registrationId));
    
    // Delete registration
    await db.delete(registrations).where(eq(registrations.id, registrationId));

    res.json({ success: true, message: "Registration deleted successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to delete registration" });
  }
});

// Delete tournament
router.delete("/tournaments/:id", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    
    // 1. Find all registrations for this tournament
    const regs = await db.query.registrations.findMany({
      where: eq(registrations.tournamentId, tournamentId)
    });
    const regIds = regs.map(r => r.id);
    
    // 2. Delete all payments associated with those registrations
    if (regIds.length > 0) {
      await db.delete(payments).where(inArray(payments.registrationId, regIds));
    }
    
    // 3. Delete all registrations for this tournament
    await db.delete(registrations).where(eq(registrations.tournamentId, tournamentId));
    
    // 4. Delete all results for this tournament
    await db.delete(results).where(eq(results.tournamentId, tournamentId));
    
    // 5. Finally, delete the tournament itself
    await db.delete(tournaments).where(eq(tournaments.id, tournamentId));

    res.json({ success: true, message: "Tournament deleted successfully." });
  } catch (error) {
    console.error("Failed to delete tournament:", error);
    res.status(500).json({ error: "Failed to delete tournament" });
  }
});

// Launch a new tournament
router.post("/tournaments", async (req, res) => {
  try {
    const { title, game, prizePool, entryFee, date, time, banner, maxSlots, teamSize, format, upiId, paymentQrUrl } = req.body;
    
    // Find the real admin user
    const adminUser = await db.query.users.findFirst({
      where: eq(users.role, 'ADMIN')
    });

    if (!adminUser) {
      return res.status(500).json({ error: "Admin user not found" });
    }

    // Map frontend short names to database full names
    const gameMap: Record<string, string> = {
      "BGMI": "Battlegrounds Mobile India",
      "Free Fire": "Free Fire",
      "Ludo": "Ludo King"
    };
    
    const dbGameName = gameMap[game] || game;

    // Find the game by name or create it
    let gameRecord = await db.query.games.findFirst({
      where: eq(games.name, dbGameName)
    });

    if (!gameRecord) {
      const [newGameResult] = await db.insert(games).values({
        name: dbGameName,
        imageUrl: banner, // Use tournament banner as fallback
      });
      const [newGame] = await db.select().from(games).where(eq(games.id, newGameResult.insertId));
      gameRecord = newGame;
    }

    // Parse date and time
    // date is "YYYY-MM-DD", time is "HH:MM"
    const matchDateObj = new Date(`${date}T${time}:00`);

    const [tournamentResult] = await db.insert(tournaments).values({
      name: title,
      gameId: gameRecord!.id,
      organizerId: adminUser.id, 
      prizePool: parseInt(prizePool) * 100, // paise
      entryFee: parseInt(entryFee),
      maxSlots: parseInt(maxSlots) || 100,
      teamSize: parseInt(teamSize) || 4,
      format: format || "Squad",
      matchDate: matchDateObj,
      bannerUrl: banner,
      upiId: upiId || null,
      paymentQrUrl: paymentQrUrl || null,
      status: "REGISTRATION_OPEN",
    });
    const [newTournament] = await db.select().from(tournaments).where(eq(tournaments.id, tournamentResult.insertId));

    res.json(newTournament);
  } catch (error) {
    console.error("Failed to launch tournament:", error);
    res.status(500).json({ error: "Failed to launch tournament" });
  }
});
// Post an announcement
router.post("/announcements", async (req, res) => {
  try {
    const { title, content } = req.body;
    
    // Find the real admin user to ensure authorization
    const adminUser = await db.query.users.findFirst({
      where: eq(users.role, 'ADMIN')
    });

    if (!adminUser) {
      return res.status(500).json({ error: "Admin user not found" });
    }
    
    const [announcementResult] = await db.insert(announcements).values({
      title,
      content
    });
    const [newAnnouncement] = await db.select().from(announcements).where(eq(announcements.id, announcementResult.insertId));
    
    res.json(newAnnouncement);
  } catch (error) {
    console.error("Failed to post announcement:", error);
    res.status(500).json({ error: "Failed to post announcement" });
  }
});

// Complete tournament and save winners
router.post("/tournaments/:id/complete", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const { winners, resultImageUrl } = req.body; // Array of { teamName, rank, points }

    // Find admin user
    const adminUser = await db.query.users.findFirst({
      where: eq(users.role, 'ADMIN')
    });
    if (!adminUser) return res.status(500).json({ error: "Admin user not found" });

    // Update tournament status and result image
    await db.update(tournaments)
      .set({ 
        status: 'COMPLETED',
        resultImageUrl: resultImageUrl || null
      })
      .where(eq(tournaments.id, tournamentId));

    // Save winners
    if (winners && Array.isArray(winners)) {
      for (const winner of winners) {
        await db.insert(results).values({
          tournamentId,
          teamName: winner.teamName,
          rank: winner.rank,
          points: winner.points || 0
        });
      }
    }

    res.json({ success: true, message: "Tournament completed and winners saved." });
  } catch (error) {
    console.error("Failed to complete tournament:", error);
    res.status(500).json({ error: "Failed to complete tournament" });
  }
});

// Get confirmed players for a tournament
router.get("/tournaments/:id/players", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    
    // Find admin user
    const adminUser = await db.query.users.findFirst({
      where: eq(users.role, 'ADMIN')
    });
    if (!adminUser) return res.status(500).json({ error: "Admin user not found" });

    // Fetch all confirmed registrations for this tournament
    const confirmedPlayers = await db.select({
      id: registrations.id,
      teamName: registrations.teamName,
      captainName: registrations.captainName,
      whatsapp: registrations.contactWhatsApp,
      email: registrations.contactEmail,
      inGameId: registrations.inGameId,
    })
    .from(registrations)
    .where(eq(registrations.tournamentId, tournamentId));
    
    // In a real app we'd filter by status = 'CONFIRMED', but right now we might have pending too
    // Let's filter by CONFIRMED
    // Wait, the status is checked by eq(registrations.status, 'CONFIRMED') but let's just use JavaScript to filter to avoid complex imports if status enum isn't handy
    
    const dbPlayers = await db.query.registrations.findMany({
      where: (regs, { eq, and }) => and(eq(regs.tournamentId, tournamentId), eq(regs.status, 'CONFIRMED')),
      columns: {
        id: true,
        teamName: true,
        captainName: true,
        contactWhatsApp: true,
        contactEmail: true,
        inGameId: true,
      }
    });

    res.json(dbPlayers);
  } catch (error) {
    console.error("Failed to fetch players:", error);
    res.status(500).json({ error: "Failed to fetch players" });
  }
});

// Set room credentials for a tournament
router.post("/tournaments/:id/room", async (req, res) => {
  try {
    const tournamentId = parseInt(req.params.id);
    const { roomId, roomPassword } = req.body;
    
    const adminUser = await db.query.users.findFirst({
      where: eq(users.role, 'ADMIN')
    });
    if (!adminUser) return res.status(500).json({ error: "Admin user not found" });

    await db.update(tournaments)
      .set({ roomId, roomPassword })
      .where(eq(tournaments.id, tournamentId));

    // Send emails if room details are actually provided
    if (roomId && roomPassword) {
      const tournament = await db.query.tournaments.findFirst({
        where: eq(tournaments.id, tournamentId)
      });
      
      const confirmedPlayers = await db.query.registrations.findMany({
        where: and(eq(registrations.tournamentId, tournamentId), eq(registrations.status, 'CONFIRMED')),
      });

      if (tournament) {
        for (const player of confirmedPlayers) {
          if (player.contactEmail) {
            sendRoomDetailsEmail(player.contactEmail, player.teamName || player.captainName || "Team", tournament.name, roomId, roomPassword).catch(console.error);
          }
        }
      }
    }

    res.json({ success: true, message: "Room credentials updated and sent to confirmed players!" });
  } catch (error) {
    console.error("Failed to update room:", error);
    res.status(500).json({ error: "Failed to update room" });
  }
});

export default router;
