import { db } from "@workspace/db";
import { users } from "@workspace/db/schema";
import bcrypt from "bcryptjs";

async function createAdmin() {
  console.log("Creating admin account...");
  try {
    const adminEmail = process.env.ADMIN_EMAIL || "admin@nexarena.com";
    const adminPass = process.env.ADMIN_PASSWORD || "admin123";

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(adminPass, salt);

    await db.insert(users).values({
      fullName: "Admin",
      username: "admin_master",
      email: adminEmail,
      passwordHash,
      role: "ADMIN",
    }).onConflictDoUpdate({
      target: users.email,
      set: {
        passwordHash,
        role: "ADMIN"
      }
    });

    console.log(`Admin account ensured in database! Email: ${adminEmail}`);
    process.exit(0);
  } catch (err) {
    console.error("Failed to create admin:", err);
    process.exit(1);
  }
}

createAdmin();
