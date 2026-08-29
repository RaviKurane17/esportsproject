import { Router } from "express";
import { db, registrations, payments, tournaments, games } from "@workspace/db";
import { eq, desc } from "drizzle-orm";

const router = Router();

// Get all registrations with their payment proof
router.get("/admin/registrations", async (req, res) => {
  try {
    const allRegistrations = await db.query.registrations.findMany({
      orderBy: [desc(registrations.createdAt)],
      with: {
        tournament: true,
      }
    });

    // Manually fetch payments since relations might not be fully configured in schema index
    const allPayments = await db.query.payments.findMany();

    const formatted = allRegistrations.map(reg => {
      const payment = allPayments.find(p => p.registrationId === reg.id);
      return {
        id: reg.id,
        teamName: reg.teamName,
        captainName: reg.captainName,
        whatsapp: reg.contactWhatsApp,
        inGameId: reg.inGameId,
        tournamentName: reg.tournament?.name || "Unknown Tournament",
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
router.post("/admin/registrations/:id/approve", async (req, res) => {
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

export default router;
