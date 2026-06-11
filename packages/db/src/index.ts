import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString, { prepare: false })
export const db = drizzle(client, { schema })
export * from './schema'

// Re-export commonly used drizzle-orm operators so consumers always get
// the same physical drizzle-orm instance as `db` (avoids pnpm dual-instance
// type errors caused by differing peer-dep resolution paths).
export { eq, and, or, ne, lt, lte, gt, gte, isNull, isNotNull, inArray, notInArray, desc, asc, sql } from 'drizzle-orm'

