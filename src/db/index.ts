
import { neon, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { config } from "dotenv";

config({ path: ".env.local" });

neonConfig.fetchConnectionCache = true;

if (!process.env.DATABASE_URL) {
    throw new Error("database url not specified");
}

const sql = neon(process.env.DATABASE_URL!);
export const db = drizzle(sql);