import { Router, Request, Response } from "express";
import { authenticate, requireRole, AuthRequest } from "../middlewares/auth";
import { tournaments } from "./tournament-data";
import { TournamentDetail } from "@workspace/api-zod";

const router = Router();

// Protect all admin routes
router.use(authenticate);
router.use(requireRole(["ADMIN", "ORGANIZER"]));

router.post("/tournaments", async (req: Request, res: Response) => {
  try {
    const data = req.body as TournamentDetail;
    const newTournament: TournamentDetail = {
      ...data,
      id: `wl-${Date.now()}`,
      participants: 0,
      registrationStatus: "AVAILABLE",
    };
    tournaments.push(newTournament);
    res.status(201).json(newTournament);
  } catch (error) {
    res.status(400).json({ error: "Invalid data" });
  }
});

router.post("/payments/:id/verify", async (req: Request, res: Response) => {
  try {
    const paymentId = req.params.id;
    res.json({ id: paymentId, status: 'VERIFIED' });
  } catch (error) {
    res.status(500).json({ error: "Failed to verify payment" });
  }
});

router.post("/payments/:id/reject", async (req: Request, res: Response) => {
  try {
    const paymentId = req.params.id;
    const { reason } = req.body;
    res.json({ id: paymentId, status: 'REJECTED', rejectionReason: reason });
  } catch (error) {
    res.status(500).json({ error: "Failed to reject payment" });
  }
});

export default router;
