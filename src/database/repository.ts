import * as SQLite from "expo-sqlite";
import { Plant, CareLog, Photo, Reminder, CareType } from "../types";

// Generic repository with typed CRUD operations

export class Repository {
  private db: SQLite.SQLiteDatabase;

  constructor(db: SQLite.SQLiteDatabase) {
    this.db = db;
  }

  // ── Plants ──

  async getAllPlants(): Promise<Plant[]> {
    return this.db.getAllAsync<Plant>(
      "SELECT * FROM plants ORDER BY created_at DESC"
    );
  }

  async getPlantById(id: string): Promise<Plant | null> {
    return this.db.getFirstAsync<Plant>(
      "SELECT * FROM plants WHERE id = ?",
      id
    );
  }

  async insertPlant(plant: Omit<Plant, "created_at" | "updated_at">): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO plants (id, name, variety, acquired_date, profile_photo_uri, stage, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      plant.id,
      plant.name,
      plant.variety,
      plant.acquired_date,
      plant.profile_photo_uri,
      plant.stage,
      plant.notes
    );
  }

  async updatePlant(id: string, updates: Partial<Plant>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.name !== undefined) { fields.push("name = ?"); values.push(updates.name); }
    if (updates.variety !== undefined) { fields.push("variety = ?"); values.push(updates.variety); }
    if (updates.acquired_date !== undefined) { fields.push("acquired_date = ?"); values.push(updates.acquired_date); }
    if (updates.profile_photo_uri !== undefined) { fields.push("profile_photo_uri = ?"); values.push(updates.profile_photo_uri); }
    if (updates.stage !== undefined) { fields.push("stage = ?"); values.push(updates.stage); }
    if (updates.notes !== undefined) { fields.push("notes = ?"); values.push(updates.notes); }

    if (fields.length === 0) return;

    fields.push("updated_at = datetime('now')");
    values.push(id);

    await this.db.runAsync(
      `UPDATE plants SET ${fields.join(", ")} WHERE id = ?`,
      ...values
    );
  }

  async deletePlant(id: string): Promise<void> {
    await this.db.runAsync("DELETE FROM plants WHERE id = ?", id);
  }

  // ── Care Logs ──

  async getCareLogsForPlant(plantId: string, limit = 50): Promise<CareLog[]> {
    return this.db.getAllAsync<CareLog>(
      "SELECT * FROM care_logs WHERE plant_id = ? ORDER BY date DESC LIMIT ?",
      plantId,
      limit
    );
  }

  async getAllCareLogs(limit = 100): Promise<(CareLog & { plant_name: string })[]> {
    return this.db.getAllAsync(
      `SELECT c.*, p.name as plant_name 
       FROM care_logs c LEFT JOIN plants p ON c.plant_id = p.id 
       ORDER BY c.date DESC LIMIT ?`,
      limit
    );
  }

  async insertCareLog(log: Omit<CareLog, "created_at">): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO care_logs (id, plant_id, type, date, notes, details)
       VALUES (?, ?, ?, ?, ?, ?)`,
      log.id, log.plant_id, log.type, log.date, log.notes, log.details
    );
  }

  async getRecentCareByType(plantId: string, type: CareType): Promise<CareLog | null> {
    return this.db.getFirstAsync<CareLog>(
      "SELECT * FROM care_logs WHERE plant_id = ? AND type = ? ORDER BY date DESC LIMIT 1",
      plantId, type
    );
  }

  // ── Photos ──

  async getPhotosForPlant(plantId: string): Promise<Photo[]> {
    return this.db.getAllAsync<Photo>(
      "SELECT * FROM photos WHERE plant_id = ? ORDER BY date DESC",
      plantId
    );
  }

  async getAllPhotos(limit = 100): Promise<(Photo & { plant_name: string })[]> {
    return this.db.getAllAsync(
      `SELECT p.*, pl.name as plant_name 
       FROM photos p LEFT JOIN plants pl ON p.plant_id = pl.id 
       ORDER BY p.date DESC LIMIT ?`,
      limit
    );
  }

  async insertPhoto(photo: Omit<Photo, "created_at">): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO photos (id, plant_id, uri, thumbnail_uri, date, notes, ai_analysis)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      photo.id, photo.plant_id, photo.uri, photo.thumbnail_uri,
      photo.date, photo.notes, photo.ai_analysis
    );
  }

  async updatePhotoAiAnalysis(id: string, aiAnalysis: string): Promise<void> {
    await this.db.runAsync(
      "UPDATE photos SET ai_analysis = ? WHERE id = ?",
      aiAnalysis, id
    );
  }

  // ── Reminders ──

  async getReminders(): Promise<Reminder[]> {
    return this.db.getAllAsync<Reminder>(
      "SELECT * FROM reminders ORDER BY next_due ASC"
    );
  }

  async getDueReminders(): Promise<(Reminder & { plant_name?: string })[]> {
    return this.db.getAllAsync(
      `SELECT r.*, p.name as plant_name 
       FROM reminders r LEFT JOIN plants p ON r.plant_id = p.id 
       WHERE r.enabled = 1 AND r.next_due <= date('now')
       ORDER BY r.next_due ASC`
    );
  }

  async insertReminder(reminder: Omit<Reminder, "created_at" | "updated_at">): Promise<void> {
    await this.db.runAsync(
      `INSERT INTO reminders (id, plant_id, type, label, frequency, interval_days, next_due, time_of_day, enabled)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      reminder.id, reminder.plant_id, reminder.type, reminder.label,
      reminder.frequency, reminder.interval_days,
      reminder.next_due, reminder.time_of_day, reminder.enabled
    );
  }

  async updateReminder(id: string, updates: Partial<Reminder>): Promise<void> {
    const fields: string[] = [];
    const values: any[] = [];

    if (updates.enabled !== undefined) { fields.push("enabled = ?"); values.push(updates.enabled); }
    if (updates.next_due !== undefined) { fields.push("next_due = ?"); values.push(updates.next_due); }
    if (updates.label !== undefined) { fields.push("label = ?"); values.push(updates.label); }
    if (updates.time_of_day !== undefined) { fields.push("time_of_day = ?"); values.push(updates.time_of_day); }

    if (fields.length === 0) return;
    fields.push("updated_at = datetime('now')");
    values.push(id);

    await this.db.runAsync(
      `UPDATE reminders SET ${fields.join(", ")} WHERE id = ?`,
      ...values
    );
  }

  async deleteReminder(id: string): Promise<void> {
    await this.db.runAsync("DELETE FROM reminders WHERE id = ?", id);
  }

  // ── Stats ──

  async getPlantStats(plantId: string): Promise<{
    photo_count: number;
    care_log_count: number;
    last_watered: string | null;
    last_treated: string | null;
  }> {
    const stats = await this.db.getFirstAsync<any>(
      `SELECT 
        (SELECT COUNT(*) FROM photos WHERE plant_id = ?) as photo_count,
        (SELECT COUNT(*) FROM care_logs WHERE plant_id = ?) as care_log_count,
        (SELECT date FROM care_logs WHERE plant_id = ? AND type = 'watering' ORDER BY date DESC LIMIT 1) as last_watered,
        (SELECT date FROM care_logs WHERE plant_id = ? AND type = 'pest_treatment' ORDER BY date DESC LIMIT 1) as last_treated`,
      plantId, plantId, plantId, plantId
    );
    return stats || { photo_count: 0, care_log_count: 0, last_watered: null, last_treated: null };
  }
}
