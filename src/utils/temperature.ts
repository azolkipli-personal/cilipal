import {
  TEMP_BRING_INSIDE,
  TEMP_PROTECT,
  TEMP_IDEAL_MIN,
  TEMP_IDEAL_MAX,
  TEMP_HOT,
} from "./constants";

export interface TemperatureAlert {
  level: "danger" | "warning" | "info" | "good";
  message: string;
  action?: string;
}

export function getTemperatureAlert(
  minTemp: number | null,
  maxTemp: number | null
): TemperatureAlert | null {
  if (minTemp === null && maxTemp === null) return null;

  // Check low temps first (most dangerous for chillies)
  if (minTemp !== null) {
    if (minTemp < TEMP_BRING_INSIDE) {
      return {
        level: "danger",
        message: `Overnight low ${minTemp}°C — too cold!`,
        action: "Bring plants inside NOW",
      };
    }
    if (minTemp < TEMP_PROTECT) {
      return {
        level: "warning",
        message: `Overnight low ${minTemp}°C — getting chilly`,
        action: "Bring inside or cover plants",
      };
    }
    if (minTemp < TEMP_IDEAL_MIN) {
      return {
        level: "info",
        message: `Overnight low ${minTemp}°C — growth may slow`,
        action: "Move to sunny spot during day",
      };
    }
  }

  // Check high temps
  if (maxTemp !== null && maxTemp > TEMP_HOT) {
    return {
      level: "warning",
      message: `High of ${maxTemp}°C — very hot!`,
      action: "Shade plants during midday, increase watering",
    };
  }

  if (maxTemp !== null && maxTemp > TEMP_IDEAL_MAX) {
    return {
      level: "info",
      message: `High of ${maxTemp}°C — warm day`,
      action: "Ensure adequate water",
    };
  }

  return {
    level: "good",
    message: `${minTemp !== null ? `🌙 ${minTemp}°C` : ""}${maxTemp !== null ? ` / ☀️ ${maxTemp}°C` : ""} — happy zone!`,
    action: undefined,
  };
}
