import { neon, NeonQueryFunction } from "@neondatabase/serverless";
import { drizzle, NeonHttpDatabase } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const getDatabaseUrl = (): string | null => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.warn(
      "DATABASE_URL not set. Database features will be unavailable. " +
      "Create a Neon database at https://neon.tech and add the connection string to .env.local"
    );
    return null;
  }
  return url;
};

// Lazy initialization to allow build without DATABASE_URL
let _db: NeonHttpDatabase<typeof schema> | null = null;

export function getDb(): NeonHttpDatabase<typeof schema> {
  if (_db) return _db;
  
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL is required for this operation");
  }
  
  const sql = neon(url);
  _db = drizzle(sql, { schema });
  return _db;
}

// For backwards compatibility - will throw if DATABASE_URL is not set
export const db = new Proxy({} as NeonHttpDatabase<typeof schema>, {
  get(_, prop) {
    return getDb()[prop as keyof NeonHttpDatabase<typeof schema>];
  },
});

export * from "./schema";
