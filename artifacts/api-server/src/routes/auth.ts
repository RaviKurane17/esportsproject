import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db, users, insertUserSchema } from "@workspace/db";
import { eq } from "drizzle-orm";
import { z } from "zod";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || "fallback_secret";

// Login schema
const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

router.post("/register", async (req: Request, res: Response) => {
  try {
    const data = insertUserSchema.parse(req.body);
    
    // Check if user exists
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, data.email),
    });

    if (existingUser) {
      return res.status(400).json({ error: "Email already registered" });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.passwordHash, salt);

    // Insert user
    const [newUser] = await db.insert(users).values({
      ...data,
      passwordHash,
    }).returning();

    // Create token
    const token = jwt.sign({ id: newUser.id, role: newUser.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        email: newUser.email,
        fullName: newUser.fullName,
        username: newUser.username,
        role: newUser.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Registration error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // EASTER EGG: Hardcoded Admin Login for the in-memory demo
    const adminEmail = process.env.ADMIN_EMAIL || "admin@nexarena.com";
    const adminPass = process.env.ADMIN_PASSWORD || "admin123";

    if (email === adminEmail && password === adminPass) {
      const token = jwt.sign({ id: 9999, role: "ADMIN" }, JWT_SECRET, {
        expiresIn: "7d",
      });
      return res.json({
        token,
        user: {
          id: 9999,
          email: adminEmail,
          fullName: "Admin",
          username: "admin",
          role: "ADMIN",
        },
      });
    }

    // Since we disabled the DB for the demo, return error if it's not the admin
    if (!db.query || !db.query.users) {
      return res.status(400).json({ error: "Invalid credentials (DB offline)" });
    }

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        username: user.username,
        role: user.role,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors });
    }
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;
