import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useDatabase } from "../../src/hooks/useDatabase";
import { Plant, STAGE_EMOJI, CARE_TYPE_CONFIG } from "../../src/types";
import { getTemperatureAlert } from "../../src/utils/temperature";
import { fetchWeather, WeatherData, weatherEmoji } from "../../src/services/weather";
import { daysSince, formatDate } from "../../src/utils/date-utils";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Dashboard() {
  const { repo, isReady } = useDatabase();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [weather, setWeather] = useState<WeatherData[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [todaysEvents, setTodaysEvents] = useState<any[]>([]);

  async function loadData() {
    if (!repo) return;
    const allPlants = await repo.getAllPlants();
    setPlants(allPlants);

    try {
      const w = await fetchWeather();
      setWeather(w);
    } catch {}

    const due = await repo.getDueReminders();
    setTodaysEvents(due);
  }

  useFocusEffect(
    useCallback(() => {
      if (isReady && repo) loadData();
    }, [isReady, repo])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (!isReady) {
    return (
      <SafeAreaView className="flex-1 bg-chili-50 items-center justify-center">
        <ActivityIndicator size="large" color="#DC2626" />
      </SafeAreaView>
    );
  }

  const todayWeather = weather[0];
  const alert = todayWeather
    ? getTemperatureAlert(todayWeather.minTemp, todayWeather.maxTemp)
    : null;

  return (
    <SafeAreaView className="flex-1 bg-chili-50">
      <ScrollView
        className="flex-1 px-4"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />
        }
      >
        {/* Header */}
        <View className="flex-row items-center justify-between mt-2 mb-4">
          <View>
            <Text className="text-3xl font-bold text-gray-800">🌶️ CiliPal</Text>
            <Text className="text-gray-500 text-sm">Your chilli garden</Text>
          </View>
          <TouchableOpacity
            onPress={() => router.push("/plants/new")}
            className="bg-chili-600 px-4 py-2 rounded-full"
          >
            <Text className="text-white font-semibold">+ Plant</Text>
          </TouchableOpacity>
        </View>

        {/* Weather Alert */}
        {alert && (
          <TouchableOpacity
            className={`p-3 rounded-xl mb-4 flex-row items-center ${
              alert.level === "danger"
                ? "bg-red-100"
                : alert.level === "warning"
                ? "bg-amber-100"
                : alert.level === "info"
                ? "bg-blue-100"
                : "bg-green-100"
            }`}
          >
            <Text className="text-2xl mr-3">
              {alert.level === "danger" ? "🚨" : alert.level === "warning" ? "⚠️" : alert.level === "info" ? "ℹ️" : "✅"}
            </Text>
            <View className="flex-1">
              <Text
                className={`font-semibold ${
                  alert.level === "danger"
                    ? "text-red-800"
                    : alert.level === "warning"
                    ? "text-amber-800"
                    : alert.level === "info"
                    ? "text-blue-800"
                    : "text-green-800"
                }`}
              >
                {alert.message}
              </Text>
              {alert.action && (
                <Text className="text-sm text-gray-600 mt-1">{alert.action}</Text>
              )}
            </View>
            {weather.length > 1 && (
              <Text className="text-xs text-gray-400 ml-2">
                {weatherEmoji(weather[1]?.weatherCode)} {weather[1]?.minTemp}°C
              </Text>
            )}
          </TouchableOpacity>
        )}

        {/* Plants Grid */}
        {plants.length === 0 ? (
          <View className="items-center py-16">
            <Text className="text-6xl mb-4">🌱</Text>
            <Text className="text-lg text-gray-500 text-center">
              No plants yet!
            </Text>
            <Text className="text-gray-400 text-center mt-1">
              Tap "+ Plant" to add your first chilli plant
            </Text>
          </View>
        ) : (
          <>
            <Text className="text-lg font-bold text-gray-700 mb-3">
              Your Plants ({plants.length})
            </Text>
            <View className="flex-row flex-wrap justify-between">
              {plants.map((plant) => (
                <PlantCard key={plant.id} plant={plant} repo={repo!} />
              ))}
            </View>
          </>
        )}

        {/* Today's Reminders */}
        {todaysEvents.length > 0 && (
          <View className="mt-6 mb-8">
            <Text className="text-lg font-bold text-gray-700 mb-3">
              📋 Today's Reminders
            </Text>
            {todaysEvents.map((r: any) => (
              <View
                key={r.id}
                className="bg-white p-3 rounded-xl mb-2 shadow-sm border border-gray-100"
              >
                <View className="flex-row items-center">
                  <Text className="text-lg mr-2">
                    {r.type === "watering"
                      ? "💧"
                      : r.type === "fertilizing"
                      ? "🌿"
                      : r.type === "pest_check"
                      ? "🐛"
                      : r.type === "bring_inside"
                      ? "🏠"
                      : "🔔"}
                  </Text>
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800">{r.label}</Text>
                    {r.plant_name && (
                      <Text className="text-sm text-gray-500">{r.plant_name}</Text>
                    )}
                  </View>
                  <Text className="text-sm text-gray-400">{r.time_of_day}</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View className="flex-row justify-around mb-8 mt-2">
          <QuickAction icon="📸" label="Take Photo" onPress={() => router.push("/diary")} />
          <QuickAction
            icon="📝"
            label="Log Care"
            onPress={() => router.push("/care/log")}
          />
          <QuickAction icon="🌱" label="All Plants" onPress={() => router.push("/(tabs)/plants")} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function PlantCard({ plant, repo }: { plant: Plant; repo: any }) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    repo.getPlantStats(plant.id).then(setStats);
  }, [plant.id]);

  return (
    <TouchableOpacity
      onPress={() => router.push(`/plants/${plant.id}`)}
      className="bg-white rounded-xl p-3 mb-3 shadow-sm border border-gray-100"
      style={{ width: "48%" }}
    >
      <Text className="text-3xl mb-1">{STAGE_EMOJI[plant.stage]}</Text>
      <Text className="font-bold text-gray-800 text-base">{plant.name}</Text>
      {plant.variety && (
        <Text className="text-sm text-gray-400">{plant.variety}</Text>
      )}
      <View className="flex-row items-center mt-2 pt-2 border-t border-gray-100">
        {stats && (
          <>
            <Text className="text-xs text-gray-500">📸 {stats.photo_count}</Text>
            <Text className="text-xs text-gray-500 ml-3">
              {CARE_TYPE_CONFIG[stats.last_watered ? "watering" : "observation"]?.emoji}{" "}
              {stats.last_watered ? `${daysSince(stats.last_watered)}d` : "-"}
            </Text>
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="items-center bg-white px-4 py-3 rounded-xl shadow-sm border border-gray-100"
    >
      <Text className="text-2xl">{icon}</Text>
      <Text className="text-xs text-gray-600 mt-1 font-medium">{label}</Text>
    </TouchableOpacity>
  );
}
