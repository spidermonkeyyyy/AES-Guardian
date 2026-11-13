/**
 * AES Guardian DatabaseService
 *
 * Low-level SQLite connection and query execution layer.
 * Wraps @op-engineering/op-sqlite to provide a stable internal API.
 *
 * Usage: obtain the singleton via DatabaseService.getInstance().
 */

import { open, type DB } from '@op-engineering/op-sqlite';
import type {
  DatabaseOptions,
  MutationResult,
  QueryResult,
  QueryRow,
} from './types';

export class DatabaseService {
  private static instance: DatabaseService | null = null;
  private db: DB | null = null;
  private readonly options: Required<DatabaseOptions>;

  private constructor(options: DatabaseOptions) {
    this.options = {
      name: options.name,
      enableWAL: options.enableWAL ?? true,
    };
  }

  /** Return (or create) the singleton DatabaseService. */
  static getInstance(options?: DatabaseOptions): DatabaseService {
    if (!DatabaseService.instance) {
      if (!options) {
        throw new Error(
          'DatabaseService.getInstance: options are required on first call.',
        );
      }
      DatabaseService.instance = new DatabaseService(options);
    }
    return DatabaseService.instance;
  }

  /** Open the SQLite connection. Idempotent — safe to call multiple times. */
  async open(): Promise<void> {
    if (this.db) {
      return; // already open
    }
    this.db = open({ name: this.options.name });

    if (this.options.enableWAL) {
      await this.execute('PRAGMA journal_mode = WAL;');
    }
    await this.execute('PRAGMA foreign_keys = ON;');
  }

  /** Close the SQLite connection and reset state. */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }

  /** Reset the singleton (for testing only). */
  static resetForTesting(): void {
    if (DatabaseService.instance) {
      DatabaseService.instance.close();
      DatabaseService.instance = null;
    }
  }

  private assertOpen(): DB {
    if (!this.db) {
      throw new Error(
        'DatabaseService: database is not open. Call open() first.',
      );
    }
    return this.db;
  }

  /**
   * Execute a statement that does not return rows (DDL, INSERT, UPDATE, DELETE).
   */
  async execute(sql: string, params: unknown[] = []): Promise<MutationResult> {
    const db = this.assertOpen();
    const result = await db.execute(sql, params as never[]);
    return {
      rowsAffected: result.rowsAffected ?? 0,
      insertId: result.insertId !== undefined ? Number(result.insertId) : undefined,
    };
  }

  /**
   * Execute a SELECT statement and return typed rows.
   */
  async query<T extends QueryRow = QueryRow>(
    sql: string,
    params: unknown[] = [],
  ): Promise<QueryResult<T>> {
    const db = this.assertOpen();
    const result = await db.execute(sql, params as never[]);
    const rows: T[] = [];
    if (result.rows) {
      if (typeof (result.rows as any).item === 'function') {
        for (let i = 0; i < (result.rows as any).length; i++) {
          rows.push((result.rows as any).item(i) as T);
        }
      } else if (Array.isArray(result.rows)) {
        for (let i = 0; i < result.rows.length; i++) {
          rows.push(result.rows[i] as T);
        }
      }
    }
    return { rows };
  }

  /**
   * Execute multiple statements inside a single transaction.
   * Rolls back automatically on error and re-throws.
   */
  async transaction(
    fn: (tx: {
      execute: (sql: string, params?: unknown[]) => Promise<MutationResult>;
    }) => Promise<void>,
  ): Promise<void> {
    const db = this.assertOpen();
    await db.execute('BEGIN;');
    try {
      await fn({
        execute: async (sql, params = []) => {
          const result = await db.execute(sql, params as never[]);
          return {
            rowsAffected: result.rowsAffected ?? 0,
            insertId:
              result.insertId !== undefined
                ? Number(result.insertId)
                : undefined,
          };
        },
      });
      await db.execute('COMMIT;');
    } catch (err) {
      await db.execute('ROLLBACK;');
      throw err;
    }
  }
}
