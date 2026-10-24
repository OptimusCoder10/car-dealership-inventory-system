import express from 'express';
import { DatabaseSync } from 'node:sqlite';

export interface AppContext {
  app: ReturnType<typeof express>;
  db: DatabaseSync;
}

export function createApp(options: { databasePath: string; jwtSecret: string }): AppContext {
  const app = express();
  const db = new DatabaseSync(options.databasePath);
  app.use(express.json());
  return { app, db };
}
