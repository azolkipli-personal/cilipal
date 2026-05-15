/**
 * 🌶️ Share Card Generator
 *
 * Builds a rich, shareable text summary of a plant's stats.
 * Uses expo-sharing to share as a plaintext "card" (or you can
 * extend this to capture a View snapshot with react-native-view-shot).
 */

import * as Sharing from "expo-sharing";
import { Plant } from "../types";
import { getVarietyBySlug, Variety } from "../data/varieties";

export interface ShareCardData {
  plant: Plant;
  harvestCount: number;
  photoCount: number;
  daysSinceAcquired: number;
}

function buildCardText(data: ShareCardData): string {
  const { plant, harvestCount, photoCount, daysSinceAcquired } = data;
  const variety = getVarietyBySlug(plant.variety);
  const varietyLine = variety
    ? `🌶️ ${variety.name} (${variety.heat_level} heat · ${variety.scoville_min.toLocaleString()}–${variety.scoville_max.toLocaleString()} SHU)`
    : `🌶️ ${plant.variety}`;

  const harvestLine = harvestCount > 0
    ? `🏆 Harvested ${harvestCount} time(s)!`
    : "🌱 Still growing…";

  const estimatedHarvest = variety
    ? new Date(
        new Date(plant.acquired_date).getTime() +
          variety.days_to_maturity * 24 * 60 * 60 * 1000
      ).toLocaleDateString()
    : null;

  const lines = [
    `━━━━━━━━━━━━━━━━━━━━━━━`,
    `  🌶️ CiliPal Plant Profile`,
    `━━━━━━━━━━━━━━━━━━━━━━━`,
    ``,
    `  ${plant.name}`,
    `  ${varietyLine}`,
    ``,
    `  📅 Acquired ${plant.acquired_date}`,
    `  🗓️ ${daysSinceAcquired} day(s) in the garden`,
    estimatedHarvest ? `  🎯 Est. harvest: ${estimatedHarvest}` : null,
    ``,
    `  📸 ${photoCount} photo(s) logged`,
    `  ${harvestLine}`,
    ``,
    `  Stage: ${plant.stage.charAt(0).toUpperCase() + plant.stage.slice(1)}`,
    ``,
    `━━━━━━━━━━━━━━━━━━━━━━━`,
    `  Tracked with CiliPal 🌶️`,
    `  https://github.com/azolkipli-personal/cilipal`,
    `━━━━━━━━━━━━━━━━━━━━━━━`,
  ]
    .filter((l) => l !== null)
    .join("\n");

  return lines;
}

export async function sharePlantCard(data: ShareCardData): Promise<void> {
  const isAvailable = await Sharing.isAvailableAsync();
  if (!isAvailable) {
    throw new Error("Sharing is not available on this device.");
  }

  const text = buildCardText(data);

  // Write to a temp file so expo-sharing can share it
  const FileSystem = require("expo-file-system");
  const fileName = `cilipal_${data.plant.name.replace(/\s+/g, "_")}.txt`;
  const fileUri = FileSystem.cacheDirectory + fileName;

  await FileSystem.writeAsStringAsync(fileUri, text, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  await Sharing.shareAsync(fileUri, {
    mimeType: "text/plain",
    dialogTitle: `Share ${data.plant.name}'s Profile`,
  });
}
