import { fetchWeather, WeatherData } from "./weather";
import * as Notifications from "expo-notifications";
import { TOKYO_LAT, TOKYO_LNG } from "../utils/constants";

const CHILL_THRESHOLD = 10; // °C
const SCORCH_THRESHOLD = 35; // °C

export async function checkWeatherConditions(lat = TOKYO_LAT, lng = TOKYO_LNG) {
  try {
    const forecast = await fetchWeather(lat, lng);
    if (!forecast || forecast.length === 0) return;

    const today = forecast[0];
    const alerts: string[] = [];

    if (today.minTemp !== null && today.minTemp < CHILL_THRESHOLD) {
      alerts.push(`🥶 Cold alert! Expected low of ${today.minTemp}°C. Bring your chillies inside!`);
    }

    if (today.maxTemp !== null && today.maxTemp > SCORCH_THRESHOLD) {
      alerts.push(`🔥 Heat alert! Expected high of ${today.maxTemp}°C. Ensure they have shade and water.`);
    }

    for (const message of alerts) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "🌶️ CiliPal Weather Alert",
          body: message,
          data: { type: "weather_alert" },
        },
        trigger: null, // send immediately
      });
    }

    return alerts;
  } catch (error) {
    console.error("Weather check failed:", error);
    return [];
  }
}

/**
 * Hook to trigger weather check on app mount
 */
export function useWeatherMonitoring() {
  // This could be used in _layout.tsx
}
