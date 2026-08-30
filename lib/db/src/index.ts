import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  throw new Error("DATABASE_URL must be set in environment");
}

export const poolConnection = mysql.createPool(dbUrl);
export const db = drizzle({ client: poolConnection, schema, mode: "default" });

export * from "./schema";
