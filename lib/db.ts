import { Pool, QueryResult } from 'pg'

let pool: Pool | null = null

export function getPool(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    })
  }
  return pool
}

/** Run a parameterised query */
export async function query<T = any>(text: string, params?: any[]): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params)
}

/** Get a single row or null */
export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const result = await query<T>(text, params)
  return result.rows[0] || null
}

/** Get all rows */
export async function queryAll<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await query<T>(text, params)
  return result.rows
}
