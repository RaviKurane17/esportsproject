import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tournamentsRouter from "./tournaments";
import authRouter from "./auth";
import adminRouter from "./admin";
import paymentsRouter from "./payments";
import announcementsRouter from "./announcements";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/", tournamentsRouter);
router.use("/admin", adminRouter);
router.use("/payments", paymentsRouter);
router.use("/announcements", announcementsRouter);

export default router;
