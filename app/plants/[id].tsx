import { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  Alert,
  Dimensions,
} from "react-native";
import { router, useLocalSearchParams, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDatabase } from "../../src/hooks/useDatabase";
import {
  Plant,
  CareLog,
  Photo,
  STAGE_EMOJI,
  PLANT_STAGES,
  CARE_TYPE_CONFIG,
} from "../../src/types";
import { VARIETIES, getVarietyBySlug } from "../../src/data/varieties";
import { formatDate, formatDateTime, daysSince, timeAgo } from "../../src/utils/date-utils";
import { generateRecommendations, CareRecommendation } from "../../src/utils/recommendations";
import { sharePlantCard } from "../../src/utils/ShareCardGenerator";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function PlantDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { repo } = useDatabase();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [careLogs, setCareLogs] = useState<CareLog[]>([]);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState<CareRecommendation[]>([]);

  const varietyInfo = plant ? getVarietyBySlug(plant.variety) : null;

  async function load() {
    if (!repo || !id) return;
    const p = await repo.getPlantById(id);
    setPlant(p);
    if (p) {
      const logs = await repo.getCareLogsForPlant(id);
      setCareLogs(logs);
      const ph = await repo.getPhotosForPlant(id);
      setPhotos(ph);
      const s = await repo.getPlantStats(id);
      setStats(s);

      setRecommendations(generateRecommendations(p, logs, ph));
    }
  }

  useFocusEffect(
    useCallback(() => {
      load();
    }, [id, repo])
  );

  const deletePlant = () => {
    if (!repo || !id) return;
    Alert.alert(
      "Delete Plant",
      `Are you sure you want to delete ${plant?.name}? All photos and logs will be lost.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            await repo.deletePlant(id);
            router.back();
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    if (!plant || !stats) return;
    try {
      const harvestLogs = careLogs.filter((l) => l.type === "harvest");
      await sharePlantCard({
        plant,
        harvestCount: harvestLogs.length,
        photoCount: stats.photo_count,
        daysSinceAcquired: daysSince(plant.acquired_date),
      });
    } catch (e: any) {
      Alert.alert("Share Failed", e.message || "Could not share plant profile.");
    }
  };

  if (!plant) {
    return (
      <SafeAreaView className="flex-1 bg-chili-50 items-center justify-center">
        <Text className="text-gray-500">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-chili-50">
      <ScrollView
        className="flex-1"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={load} tintColor="#DC2626" />
        }
      >
        {/* Header */}
        <View className="px-4 pt-2 pb-4">
          <View className="flex-row items-center justify-between">
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-2xl">← Back</Text>
            </TouchableOpacity>
            <View className="flex-row items-center">
              <TouchableOpacity
                onPress={handleShare}
                className="mr-4"
              >
                <Text className="text-lg">🔗</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => router.push(`/plants/new?id=${id}`)}
                className="mr-4"
              >
                <Text className="text-lg">✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={deletePlant}>
                <Text className="text-lg">🗑️</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Profile Section */}
        <View className="items-center px-4 pb-4">
          <View className="w-24 h-24 rounded-full bg-white items-center justify-center shadow-sm mb-3 overflow-hidden">
            {plant.profile_photo_uri ? (
              <Image source={{ uri: plant.profile_photo_uri }} className="w-24 h-24" />
            ) : (
              <Text className="text-5xl">{STAGE_EMOJI[plant.stage]}</Text>
            )}
          </View>
          <Text className="text-2xl font-bold text-gray-800">{plant.name}</Text>
          <Text className="text-base text-gray-500">
            {varietyInfo ? varietyInfo.name : plant.variety}
          </Text>
          <View className="flex-row mt-2">
            <View className="bg-white px-3 py-1 rounded-full mr-2">
              <Text className="text-sm text-gray-600">
                {STAGE_EMOJI[plant.stage]} {plant.stage}
              </Text>
            </View>
            <View className="bg-white px-3 py-1 rounded-full">
              <Text className="text-sm text-gray-600">
                📅 {formatDate(plant.acquired_date)}
              </Text>
            </View>
          </View>
        </View>

        {/* Heat Meter Section */}
        {varietyInfo && (
          <View className="mx-4 mb-4 bg-red-50 border border-red-100 rounded-2xl p-4 shadow-sm">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-bold text-red-800 uppercase tracking-wider">
                Heat Intensity: {varietyInfo.heat_level}
              </Text>
              <Text className="text-xs text-red-600 font-medium">
                {varietyInfo.scoville_min.toLocaleString()} - {varietyInfo.scoville_max.toLocaleString()} SHU
              </Text>
            </View>
            <HeatBar level={varietyInfo.heat_level} />
            <View className="flex-row items-center mt-3 bg-white/50 rounded-lg p-2">
              <Text className="text-lg mr-2">📅</Text>
              <View>
                <Text className="text-xs text-gray-500 font-bold uppercase">Estimated Harvest</Text>
                <Text className="text-sm text-gray-800 font-medium">
                  {new Date(new Date(plant.acquired_date).getTime() + varietyInfo.days_to_maturity * 24 * 60 * 60 * 1000).toLocaleDateString()}
                  <Text className="text-xs text-gray-400 font-normal"> ({varietyInfo.days_to_maturity} days)</Text>
                </Text>
              </View>
            </View>
            <Text className="text-xs text-gray-500 mt-2 italic">
              Care Tip: {varietyInfo.care_tips}
            </Text>
          </View>
        )}

        {/* Quick Stats */}
        {stats && (
          <View className="flex-row justify-around mx-4 mb-4">
            <StatBox emoji="📸" label="Photos" value={String(stats.photo_count)} />
            <StatBox emoji="📝" label="Logs" value={String(stats.care_log_count)} />
            <StatBox
              emoji="💧"
              label="Watered"
              value={stats.last_watered ? timeAgo(stats.last_watered) : "—"}
            />
            <StatBox
              emoji="🐛"
              label="Treated"
              value={stats.last_treated ? timeAgo(stats.last_treated) : "—"}
            />
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row justify-around mx-4 mb-4">
          <ActionButton
            emoji="📸"
            label="Add Photo"
            onPress={() => router.push(`/care/log?plantId=${id}&type=observation`)}
          />
          <ActionButton
            emoji="💧"
            label="Log Water"
            onPress={() => router.push(`/care/log?plantId=${id}&type=watering`)}
          />
          <ActionButton
            emoji="🐛"
            label="Pest Log"
            onPress={() => router.push(`/care/log?plantId=${id}&type=pest_treatment`)}
          />
          <ActionButton
            emoji="📝"
            label="All Logs"
            onPress={() => router.push(`/care/log?plantId=${id}`)}
          />
        </View>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <View className="mx-4 mb-4">
            <Text className="text-sm font-medium text-gray-600 mb-2">Recommended Care</Text>
            {recommendations.map((rec) => (
              <View
                key={rec.id}
                className={`bg-white rounded-xl p-4 mb-2 shadow-sm border border-l-4 ${rec.priority === "high" ? "border-l-red-500" : "border-l-blue-400"
                  } border-gray-100`}
              >
                <View className="flex-row items-center mb-1">
                  <Text className="text-xl mr-2">{rec.icon}</Text>
                  <Text className="font-bold text-gray-800 flex-1">{rec.title}</Text>
                </View>
                <Text className="text-gray-600 text-sm leading-5">{rec.description}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Stage Progress */}
        <View className="mx-4 mb-4">
          <Text className="text-sm font-medium text-gray-600 mb-2">Progress</Text>
          <View className="bg-white rounded-xl p-3 shadow-sm border border-gray-100">
            <View className="flex-row items-center justify-between">
              {PLANT_STAGES.map((s, i) => {
                const currentIdx = PLANT_STAGES.indexOf(plant.stage);
                const isActive = PLANT_STAGES.indexOf(s) <= currentIdx;
                return (
                  <View key={s} className="items-center" style={{ flex: 1 }}>
                    <View
                      className={`w-8 h-8 rounded-full items-center justify-center mb-1 ${isActive ? "bg-chili-600" : "bg-gray-200"
                        }`}
                    >
                      <Text className="text-sm">{STAGE_EMOJI[s]}</Text>
                    </View>
                    <Text
                      className={`text-xs ${isActive ? "text-chili-700 font-medium" : "text-gray-400"
                        }`}
                    >
                      {s.slice(0, 4)}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        </View>

        {/* Recent Photos */}
        {photos.length > 0 && (
          <View className="mx-4 mb-4">
            <Text className="text-sm font-medium text-gray-600 mb-2">
              Recent Photos ({photos.length})
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {photos.slice(0, 10).map((photo) => (
                <TouchableOpacity
                  key={photo.id}
                  onPress={() => router.push(`/diary/${photo.id}`)}
                  className="mr-2"
                >
                  <Image
                    source={{ uri: photo.uri }}
                    className="w-20 h-20 rounded-lg bg-gray-200"
                  />
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Care History */}
        <View className="mx-4 mb-8">
          <Text className="text-sm font-medium text-gray-600 mb-2">Care History</Text>
          {careLogs.length === 0 ? (
            <View className="bg-white rounded-xl p-6 items-center shadow-sm border border-gray-100">
              <Text className="text-gray-400">No care logs yet</Text>
            </View>
          ) : (
            careLogs.slice(0, 20).map((log) => {
              const cfg = CARE_TYPE_CONFIG[log.type];
              return (
                <View
                  key={log.id}
                  className="bg-white rounded-xl p-3 mb-2 shadow-sm border border-gray-100 flex-row items-center"
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center mr-3"
                    style={{ backgroundColor: cfg.color + "20" }}
                  >
                    <Text className="text-lg">{cfg.emoji}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="font-medium text-gray-800">{cfg.label}</Text>
                    {log.notes && (
                      <Text className="text-sm text-gray-500" numberOfLines={1}>
                        {log.notes}
                      </Text>
                    )}
                  </View>
                  <Text className="text-xs text-gray-400">{formatDateTime(log.date)}</Text>
                </View>
              );
            })
          )}
        </View>

        {/* Notes */}
        {plant.notes && (
          <View className="mx-4 mb-4">
            <Text className="text-sm font-medium text-gray-600 mb-2">Notes</Text>
            <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <Text className="text-gray-700">{plant.notes}</Text>
            </View>
          </View>
        )}

        {/* Share Profile Banner */}
        <View className="mx-4 mb-8">
          <TouchableOpacity
            onPress={handleShare}
            className="bg-chili-600 rounded-2xl py-4 flex-row items-center justify-center shadow-md"
          >
            <Text className="text-white text-xl mr-2">🔗</Text>
            <Text className="text-white font-bold text-base">Share {plant.name}'s Profile</Text>
          </TouchableOpacity>
        </View>

        <View className="h-8" />
      </ScrollView>
    </SafeAreaView>
  );
}

function HeatBar({ level }: { level: string }) {
  const segments = [
    { label: "Mild", color: "#FCD34D", active: level === "Mild" || level === "Medium" || level === "Hot" || level === "Extreme" },
    { label: "Med", color: "#F59E0B", active: level === "Medium" || level === "Hot" || level === "Extreme" },
    { label: "Hot", color: "#EF4444", active: level === "Hot" || level === "Extreme" },
    { label: "Super", color: "#B91C1C", active: level === "Extreme" },
  ];

  return (
    <View className="flex-row h-2 w-full gap-1">
      {segments.map((seg, i) => (
        <View
          key={i}
          className="flex-1 rounded-full"
          style={{ backgroundColor: seg.active ? seg.color : "#E5E7EB" }}
        />
      ))}
    </View>
  );
}

function StatBox({
  emoji,
  label,
  value,
}: {
  emoji: string;
  label: string;
  value: string;
}) {
  return (
    <View className="bg-white rounded-xl p-3 items-center shadow-sm border border-gray-100 flex-1 mx-1">
      <Text className="text-lg">{emoji}</Text>
      <Text className="text-xs text-gray-400 mt-1">{label}</Text>
      <Text className="text-sm font-bold text-gray-700">{value}</Text>
    </View>
  );
}

function ActionButton({
  emoji,
  label,
  onPress,
}: {
  emoji: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl p-3 items-center shadow-sm border border-gray-100 flex-1 mx-1"
    >
      <Text className="text-xl">{emoji}</Text>
      <Text className="text-xs text-gray-600 mt-1 font-medium">{label}</Text>
    </TouchableOpacity>
  );
}
