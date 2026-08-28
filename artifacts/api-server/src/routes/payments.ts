import { Router, Request, Response } from "express";
import { authenticate, AuthRequest } from "../middlewares/auth";
import { db, payments, registrations } from "@workspace/db";
import { eq, and } from "drizzle-orm";

const router = Router();

router.use(authenticate);

router.post("/:registrationId/submit-proof", async (req: AuthRequest, res: Response) => {
  try {
    const registrationId = parseInt(req.params.registrationId);
    const { upiId, utrNumber, screenshotUrl, payerName, amount } = req.body;
    
    // Verify the registration belongs to this user
    const registration = await db.query.registrations.findFirst({
      where: and(eq(registrations.id, registrationId), eq(registrations.userId, req.user!.id)),
    });

    if (!registration) {
      return res.status(404).json({ error: "Registration not found" });
    }

    const [payment] = await db.insert(payments).values({
      registrationId,
      upiId,
      utrNumber,
      screenshotUrl,
      payerName,
      amount,
      status: 'UNDER_REVIEW',
      submittedAt: new Date(),
    }).returning();

    await db.update(registrations).set({ status: 'PAYMENT_REVIEW' }).where(eq(registrations.id, registrationId));

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: "Failed to submit payment proof" });
  }
});

export default router;
