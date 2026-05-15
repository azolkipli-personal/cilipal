// 🌶️ Core Types for CiliPal

export type PlantStage =
  | "seedling"
  | "vegetative"
  | "flowering"
  | "fruiting"
  | "harvested";

export type CareType =
  | "watering"
  | "fertilizing"
  | "pest_treatment"
  | "observation"
  | "repotting"
  | "harvest";

export type ReminderType =
  | "watering"
  | "fertilizing"
  | "pest_check"
  | "bring_inside"
  | "custom";

export type ReminderFrequency = "daily" | "weekly" | "biweekly" | "monthly" | "custom";

export interface Plant {
  id: string;
  name: string;
  variety: string;
  acquired_date: string; // ISO date YYYY-MM-DD
  profile_photo_uri: string | null;
  stage: PlantStage;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface CareLog {
  id: string;
  plant_id: string;
  type: CareType;
  date: string; // ISO datetime
  notes: string;
  details: string | null; // JSON blob
  created_at: string;
}

export interface Photo {
  id: string;
  plant_id: string;
  uri: string; // local file path
  thumbnail_uri: string | null;
  date: string; // ISO datetime
  notes: string;
  ai_analysis: string | null; // JSON blob from AI
  created_at: string;
}

export interface Reminder {
  id: string;
  plant_id: string | null; // null for general reminders
  type: ReminderType;
  label: string;
  frequency: ReminderFrequency;
  interval_days: number | null;
  next_due: string; // ISO date
  time_of_day: string; // HH:MM
  enabled: number; // 0 or 1
  created_at: string;
  updated_at: string;
}

// Care type display helpers
export const CARE_TYPE_CONFIG: Record<CareType, { label: string; emoji: string; color: string }> = {
  watering: { label: "Watering", emoji: "💧", color: "#3B82F6" },
  fertilizing: { label: "Fertilizing", emoji: "🌿", color: "#16A34A" },
  pest_treatment: { label: "Pest Treatment", emoji: "🐛", color: "#DC2626" },
  observation: { label: "Observation", emoji: "👀", color: "#F59E0B" },
  repotting: { label: "Repotting", emoji: "🪴", color: "#8B5CF6" },
  harvest: { label: "Harvest", emoji: "🌶️", color: "#EF4444" },
};

export const REMINDER_TYPE_CONFIG: Record<ReminderType, { label: string; emoji: string }> = {
  watering: { label: "Watering", emoji: "💧" },
  fertilizing: { label: "Fertilizing", emoji: "🌿" },
  pest_check: { label: "Pest Check", emoji: "🐛" },
  bring_inside: { label: "Bring Inside", emoji: "🏠" },
  custom: { label: "Custom", emoji: "🔔" },
};

export const PLANT_STAGES: PlantStage[] = [
  "seedling",
  "vegetative",
  "flowering",
  "fruiting",
  "harvested",
];

export const STAGE_EMOJI: Record<PlantStage, string> = {
  seedling: "🌱",
  vegetative: "🌿",
  flowering: "🌸",
  fruiting: "🌶️",
  harvested: "🏆",
};

export interface Variety {
  slug: string;
  name: string;
  scoville_min: number;
  scoville_max: number;
  days_to_maturity: number;
  care_tips: string;
  heat_level: "Mild" | "Medium" | "Hot" | "Extreme";
}
