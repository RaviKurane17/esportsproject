import { db, tournaments } from "@workspace/db";
async function test() {
  try {
    const res = await db.select().from(tournaments).limit(1);
    console.log("DB connection successful:", res);
  } catch (e) {
    console.error("DB connection failed:", e.message);
  }
}
test();
