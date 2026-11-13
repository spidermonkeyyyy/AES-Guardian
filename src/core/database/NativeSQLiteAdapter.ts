/**
 * Genuine Native SQLite Adapter for Unit & Migration Tests.
 *
 * Uses Node.js built-in 'node:sqlite' (DatabaseSync) to run real SQLite
 * engine with genuine PRAGMA checks, foreign-key enforcement, and table alterations.
 */

// Use require to safely load node:sqlite
const { DatabaseSync } = require('node:sqlite');

import type { MutationResult, QueryResult, QueryRow } from './types';

export class NativeSQLiteAdapter {
  private db: any;

  constructor() {
    this.db = new DatabaseSync(':memory:');
    this.db.exec('PRAGMA foreign_keys = ON;');
  }

  async open(): Promise<void> {
    // Already open in constructor
  }

  async execute(sql: string, params: unknown[] = []): Promise<MutationResult> {
    const stmt = this.db.prepare(sql);
    const result = stmt.run(...params);
    return {
      rowsAffected: Number(result.changes),
      insertId: Number(result.lastInsertRowid),
    };
  }

  async query<T = QueryRow>(sql: string, params: unknown[] = []): Promise<QueryResult<T>> {
    const stmt = this.db.prepare(sql);
    const rows = stmt.all(...params) as T[];
    return { rows };
  }

  async transaction<T>(
    fn: (tx: { execute: (sql: string, params?: unknown[]) => Promise<MutationResult> }) => Promise<T>,
  ): Promise<T> {
    this.db.exec('BEGIN TRANSACTION;');
    try {
      const tx = {
        execute: async (sql: string, params: unknown[] = []): Promise<MutationResult> => {
          const stmt = this.db.prepare(sql);
          const result = stmt.run(...params);
          return {
            rowsAffected: Number(result.changes),
            insertId: Number(result.lastInsertRowid),
          };
        },
      };
      const res = await fn(tx);
      this.db.exec('COMMIT;');
      return res;
    } catch (err) {
      try {
        this.db.exec('ROLLBACK;');
      } catch {
        // Rollback may fail if transaction was aborted
      }
      throw err;
    }
  }

  close(): void {
    if (this.db) {
      try {
        this.db.close();
      } catch {
        // ignore
      }
      this.db = null;
    }
  }
}
