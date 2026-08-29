import { Router } from "express";
import { db, registrations, payments, tournaments, games, users } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// Realistic admin login using database
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    
    // Find user in database with ADMIN role
    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user || user.role !== 'ADMIN') {
      return res.status(401).json({ error: 'Invalid credentials or unauthorized' });
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

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

    res.json({ success: true, message: "Registration approved. Squad is now confirmed!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to approve registration" });
  }
});

// Launch a new tournament
router.post("/tournaments", async (req, res) => {
  try {
    const { title, game, prizePool, entryFee, date, time, banner } = req.body;
    
    // Find the real admin user
    const adminUser = await db.query.users.findFirst({
      where: eq(users.role, 'ADMIN')
    });

    if (!adminUser) {
      return res.status(500).json({ error: "Admin user not found" });
    }

    // Find the game by name (e.g. 'BGMI')
    const gameRecord = await db.query.games.findFirst({
      where: eq(games.name, game)
    });

    if (!gameRecord) {
      return res.status(400).json({ error: "Game not found in database" });
    }

    // Parse date and time
    // date is "YYYY-MM-DD", time is "HH:MM"
    const matchDateObj = new Date(`${date}T${time}:00`);

    const [newTournament] = await db.insert(tournaments).values({
      name: title,
      gameId: gameRecord.id,
      organizerId: adminUser.id, 
      prizePool: parseInt(prizePool) * 100, // paise
      entryFee: parseInt(entryFee),
      maxSlots: 100,
      teamSize: 4,
      matchDate: matchDateObj,
      bannerUrl: banner,
      status: "REGISTRATION_OPEN",
    }).returning();

    res.json(newTournament);
  } catch (error) {
    console.error("Failed to launch tournament:", error);
    res.status(500).json({ error: "Failed to launch tournament" });
  }
});

export default router;
