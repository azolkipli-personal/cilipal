import * as SQLite from "expo-sqlite";

// Create CiliPal database schema
export async function createDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync("cilipal.db");

  // Enable WAL for better performance
  await db.execAsync("PRAGMA journal_mode = WAL;");

  // Create plants table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS plants (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      variety TEXT DEFAULT '',
      acquired_date TEXT NOT NULL,
      profile_photo_uri TEXT,
      stage TEXT DEFAULT 'seedling' CHECK(stage IN ('seedling','vegetative','flowering','fruiting','harvested')),
      notes TEXT DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Create care_logs table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS care_logs (
      id TEXT PRIMARY KEY,
      plant_id TEXT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('watering','fertilizing','pest_treatment','observation','repotting','harvest')),
      date TEXT NOT NULL DEFAULT (datetime('now')),
      notes TEXT DEFAULT '',
      details TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Create photos table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      plant_id TEXT NOT NULL REFERENCES plants(id) ON DELETE CASCADE,
      uri TEXT NOT NULL,
      thumbnail_uri TEXT,
      date TEXT NOT NULL DEFAULT (datetime('now')),
      notes TEXT DEFAULT '',
      ai_analysis TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Create reminders table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS reminders (
      id TEXT PRIMARY KEY,
      plant_id TEXT REFERENCES plants(id) ON DELETE CASCADE,
      type TEXT NOT NULL CHECK(type IN ('watering','fertilizing','pest_check','bring_inside','custom')),
      label TEXT NOT NULL,
      frequency TEXT NOT NULL CHECK(frequency IN ('daily','weekly','biweekly','monthly','custom')),
      interval_days INTEGER,
      next_due TEXT NOT NULL,
      time_of_day TEXT DEFAULT '09:00',
      enabled INTEGER DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  // Create indexes for performance
  await db.execAsync(`
    CREATE INDEX IF NOT EXISTS idx_care_logs_plant_date ON care_logs(plant_id, date);
    CREATE INDEX IF NOT EXISTS idx_photos_plant_date ON photos(plant_id, date);
    CREATE INDEX IF NOT EXISTS idx_reminders_due ON reminders(next_due, enabled);
  `);

  return db;
}
