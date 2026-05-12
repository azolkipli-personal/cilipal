import { TOKYO_LAT, TOKYO_LNG } from "../utils/constants";

interface OpenMeteoResponse {
  daily: {
    time: string[];
    temperature_2m_min: (number | null)[];
    temperature_2m_max: (number | null)[];
    precipitation_sum: (number | null)[];
    weather_code: (number | null)[];
  };
}

export interface WeatherData {
  date: string;
  minTemp: number | null;
  maxTemp: number | null;
  rain: number | null;
  weatherCode: number | null;
}

export async function fetchWeather(
  lat = TOKYO_LAT,
  lng = TOKYO_LNG
): Promise<WeatherData[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&daily=temperature_2m_min,temperature_2m_max,precipitation_sum,weather_code&timezone=Asia%2FTokyo&forecast_days=5`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);

  const data: OpenMeteoResponse = await res.json();

  return data.daily.time.map((date, i) => ({
    date,
    minTemp: data.daily.temperature_2m_min[i],
    maxTemp: data.daily.temperature_2m_max[i],
    rain: data.daily.precipitation_sum[i],
    weatherCode: data.daily.weather_code[i],
  }));
}

// WMO Weather Code → emoji
export function weatherEmoji(code: number | null): string {
  if (code === null) return "❓";
  if (code === 0) return "☀️"; // Clear
  if (code <= 3) return "⛅"; // Partly cloudy
  if (code <= 48) return "🌫️"; // Foggy
  if (code <= 57) return "🌧️"; // Drizzle
  if (code <= 67) return "🌧️"; // Rain
  if (code <= 77) return "🌨️"; // Snow
  if (code <= 82) return "🌦️"; // Rain showers
  if (code <= 86) return "🌧️"; // Rain
  return "⛈️"; // Thunderstorm
}
