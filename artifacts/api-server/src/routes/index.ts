import { Router, type IRouter } from "express";
import healthRouter from "./health";
import tournamentsRouter from "./tournaments";
import authRouter from "./auth";
import adminRouter from "./admin";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/auth", authRouter);
router.use("/", tournamentsRouter);
router.use("/admin", adminRouter);
router.use("/payments", paymentsRouter);

export default router;
