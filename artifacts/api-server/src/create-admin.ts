
import { db } from "@workspace/db";
import { users } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

async function createAdmin() {
  console.log("Creating admin account...");
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "google@gmail.com";
    const adminPass = process.env.ADMIN_PASSWORD || "Oneplus@17";

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPass, salt);

    const existing = await db.select().from(users).where(eq(users.email, adminEmail));
    
    if (existing.length === 0) {
      await db.insert(users).values({
        fullName: "Admin",
        username: "admin_master",
        email: adminEmail,
        passwordHash,
        role: "ADMIN",
      });
    } else {
      await db.update(users).set({
        passwordHash,
        role: "ADMIN"
      }).where(eq(users.email, adminEmail));
    }

    console.log(`Admin account ensured in database! Email: ${adminEmail}`);
    process.exit(0);
  } catch (err) {
    console.error("Failed to create admin:", err);
    process.exit(1);
  }
}

createAdmin();
