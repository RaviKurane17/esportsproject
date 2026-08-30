// @ts-nocheck
import { Router } from "express";
import { db, announcements } from "@workspace/db";
import { desc } from "drizzle-orm";

const router = Router();

// Get recent announcements
router.get("/", async (req, res) => {
  try {
    const list = await db.select().from(announcements).orderBy(desc(announcements.createdAt)).limit(10);
    res.json(list);
  } catch (error) {
    console.error("Failed to fetch announcements:", error);
    res.status(500).json({ error: "Failed to fetch announcements" });
  }
});

export default router;
