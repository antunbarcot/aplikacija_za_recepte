// import { drizzle } from "drizzle-orm/neon-http";
// import { neon } from "@neondatabase/serverless";
// import { ENV } from "./env.js";
// import * as schema from "../db/schema.js";

// const sql = neon(ENV.DATABASE_URL);
// export const db = drizzle(sql, { schema });

import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { ENV } from "./env.js";
import * as schema from "../db/schema.js";

const pool = new pg.Pool({
  connectionString: ENV.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, 
  },
});

export const db = drizzle(pool, { schema });
