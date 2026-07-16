import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const url = process.env.DIRECT_URL ?? process.env.DATABASE_URL
if (!url) {
  console.error('ERROR: DIRECT_URL or DATABASE_URL must be set')
  process.exit(1)
}

const sql = postgres(url, { max: 1 })
const db = drizzle(sql)

async function run() {
  console.log('Applying migrations from packages/db/migrations ...')
  await migrate(db, { migrationsFolder: './migrations' })
  console.log('Migrations applied successfully.')
  await sql.end()
}

run().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
