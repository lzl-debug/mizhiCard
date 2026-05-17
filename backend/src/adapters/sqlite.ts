import Database from 'better-sqlite3'
import { readFileSync, existsSync, mkdirSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import type { D1DB, D1Statement } from '../types'

const __dirname = dirname(fileURLToPath(import.meta.url))

class PreparedStatement implements D1Statement {
  private stmt: Database.Statement
  private params: unknown[] = []

  constructor(stmt: Database.Statement) {
    this.stmt = stmt
  }

  bind(...values: unknown[]): this {
    this.params = values
    return this
  }

  async all<T = unknown>(): Promise<{ results: T[] }> {
    const results = this.params.length > 0
      ? this.stmt.all(...this.params) as T[]
      : this.stmt.all() as T[]
    return { results }
  }

  async first<T = unknown>(): Promise<T | null> {
    const row = this.params.length > 0
      ? this.stmt.get(...this.params) as T | undefined
      : this.stmt.get() as T | undefined
    return row ?? null
  }

  async run(): Promise<{ success: boolean }> {
    if (this.params.length > 0) {
      this.stmt.run(...this.params)
    } else {
      this.stmt.run()
    }
    return { success: true }
  }
}

export function createSqliteAdapter(dbPath: string): D1DB {
  const dir = dirname(dbPath)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')

  // Run migrations
  const migrationPath = join(__dirname, '..', '..', 'migrations', '0001_create_cards.sql')
  if (existsSync(migrationPath)) {
    const migration = readFileSync(migrationPath, 'utf-8')
    db.exec(migration)
  }

  return {
    prepare(sql: string): PreparedStatement {
      return new PreparedStatement(db.prepare(sql))
    }
  }
}
