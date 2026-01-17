import type { Database } from 'better-sqlite3';

export abstract class BaseRepository<T, CreateDTO, UpdateDTO> {
  protected db: Database;
  protected tableName: string;

  constructor(db: Database, tableName: string) {
    this.db = db;
    this.tableName = tableName;
  }

  abstract create(data: CreateDTO): T;
  abstract findById(id: number): T | null;
  abstract findAll(): T[];
  abstract update(id: number, data: UpdateDTO): T | null;
  abstract delete(id: number): boolean;

  protected updateTimestamp(): string {
    return new Date().toISOString();
  }
}
