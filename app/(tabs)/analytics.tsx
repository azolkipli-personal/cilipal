import { useState, useCallback } from "react";
import { View, Text, ScrollView, RefreshControl, Dimensions } from "react-native";
import { useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDatabase } from "../../src/hooks/useDatabase";
import { VARIETIES } from "../../src/data/varieties";
import { STAGE_EMOJI } from "../../src/types";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function AnalyticsScreen() {
  const { repo } = useDatabase();
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    if (!repo) return;
    setRefreshing(true);
    const s = await repo.getGlobalStats();
    setStats(s);
    setRefreshing(false);
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [repo])
  );

  // Calculate Scoville Score
  const calculateGardenHeat = () => {
    if (!stats) return 0;
    let totalHeat = 0;
    let plantCount = 0;

    Object.entries(stats.variety_counts).forEach(([variety, count]: [string, any]) => {
      const vData = VARIETIES.find(v => v.slug === variety);
      if (vData) {
        totalHeat += ((vData.scoville_min + vData.scoville_max) / 2) * count;
        plantCount += count;
      }
    });

    return plantCount > 0 ? Math.round(totalHeat / plantCount) : 0;
  };

  const avgScoville = calculateGardenHeat();

  if (!stats) {
    return (
      <SafeAreaView className="flex-1 bg-chili-50 items-center justify-center">
        <Text className="text-gray-400">Loading analytics...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-chili-50">
      <ScrollView
        className="flex-1 px-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={load} />}
      >
        <Text className="text-3xl font-bold text-gray-800 my-6">Analytics 🌶️</Text>

        {/* Heat Index Card */}
        <View className="bg-red-600 rounded-3xl p-6 mb-6 shadow-lg">
          <Text className="text-red-100 text-sm font-bold uppercase tracking-widest mb-1">
            Garden Heat Index
          </Text>
          <Text className="text-white text-4xl font-black mb-2">
            {avgScoville.toLocaleString()} SHU
          </Text>
          <View className="h-3 bg-red-400 rounded-full overflow-hidden mb-3">
            <View
              className="h-full bg-yellow-400"
              style={{ width: `${Math.min(100, (avgScoville / 1000000) * 100)}%` }}
            />
          </View>
          <Text className="text-red-100 text-xs italic">
            Average pungency across all your tracked varieties.
          </Text>
        </View>

        {/* Summary Stats Grid */}
        <View className="flex-row flex-wrap justify-between mb-6">
          <StatCard label="Plants" value={stats.total_plants} emoji="🪴" color="bg-green-100" textColor="text-green-800" />
          <StatCard label="Photos" value={stats.total_photos} emoji="📸" color="bg-blue-100" textColor="text-blue-800" />
          <StatCard label="Care Logs" value={stats.total_care_logs} emoji="📝" color="bg-purple-100" textColor="text-purple-800" />
          <StatCard label="Varieties" value={Object.keys(stats.variety_counts).length} emoji="🌶️" color="bg-orange-100" textColor="text-orange-800" />
        </View>

        {/* Stage Distribution */}
        <Text className="text-lg font-bold text-gray-800 mb-3">Growth Stages</Text>
        <View className="bg-white rounded-2xl p-4 mb-8 shadow-sm border border-gray-100">
          {Object.entries(stats.stage_distribution).length === 0 ? (
            <Text className="text-gray-400 text-center py-4">No plant data yet</Text>
          ) : (
            Object.entries(stats.stage_distribution).map(([stage, count]: [string, any]) => (
              <View key={stage} className="flex-row items-center mb-3">
                <Text className="text-lg mr-2">{(STAGE_EMOJI as any)[stage] || "❓"}</Text>
                <Text className="text-gray-700 capitalize flex-1 font-medium">{stage}</Text>
                <View className="bg-gray-100 px-3 py-1 rounded-full">
                  <Text className="text-gray-600 font-bold">{count}</Text>
                </View>
              </View>
            ))
          )}
        </View>

        <View className="h-10" />
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ label, value, emoji, color, textColor }: any) {
  return (
    <View className={`${color} rounded-2xl p-4 mb-4`} style={{ width: "48%" }}>
      <Text className="text-2xl mb-1">{emoji}</Text>
      <Text className={`text-2xl font-black ${textColor}`}>{value}</Text>
      <Text className={`text-xs font-bold uppercase ${textColor} opacity-60`}>{label}</Text>
    </View>
  );
}
