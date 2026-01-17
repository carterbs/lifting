import type { Database } from 'better-sqlite3';

export interface Migration {
  version: number;
  name: string;
  up: (db: Database) => void;
  down: (db: Database) => void;
}

interface MigrationRow {
  version: number;
}

export class Migrator {
  private db: Database;
  private migrations: Migration[];

  constructor(db: Database, migrations: Migration[]) {
    this.db = db;
    this.migrations = migrations.sort((a, b) => a.version - b.version);
  }

  /**
   * Create migrations tracking table if it doesn't exist
   */
  private ensureMigrationsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS _migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT NOT NULL DEFAULT (datetime('now'))
      )
    `);
  }

  /**
   * Get the current schema version
   */
  getCurrentVersion(): number {
    this.ensureMigrationsTable();
    const result = this.db
      .prepare('SELECT MAX(version) as version FROM _migrations')
      .get() as MigrationRow | undefined;
    return result?.version ?? 0;
  }

  /**
   * Get list of pending migrations
   */
  getPendingMigrations(): Migration[] {
    const currentVersion = this.getCurrentVersion();
    return this.migrations.filter((m) => m.version > currentVersion);
  }

  /**
   * Run all pending migrations
   */
  up(): void {
    this.ensureMigrationsTable();
    const currentVersion = this.getCurrentVersion();

    for (const migration of this.migrations) {
      if (migration.version > currentVersion) {
        this.db.transaction(() => {
          migration.up(this.db);
          this.db
            .prepare('INSERT INTO _migrations (version, name) VALUES (?, ?)')
            .run(migration.version, migration.name);
        })();
        console.log(
          `Applied migration ${migration.version}: ${migration.name}`
        );
      }
    }
  }

  /**
   * Rollback the last migration
   */
  down(): void {
    const currentVersion = this.getCurrentVersion();
    const migration = this.migrations.find((m) => m.version === currentVersion);

    if (migration) {
      this.db.transaction(() => {
        migration.down(this.db);
        this.db
          .prepare('DELETE FROM _migrations WHERE version = ?')
          .run(migration.version);
      })();
      console.log(
        `Rolled back migration ${migration.version}: ${migration.name}`
      );
    }
  }

  /**
   * Reset database (rollback all migrations)
   */
  reset(): void {
    while (this.getCurrentVersion() > 0) {
      this.down();
    }
  }
}
