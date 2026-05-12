import { useEffect, useState } from "react";
import { View, Text, Image, ScrollView } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDatabase } from "../../src/hooks/useDatabase";
import { Photo, Plant, CARE_TYPE_CONFIG } from "../../src/types";
import { formatDateTime } from "../../src/utils/date-utils";

export default function DiaryEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { repo } = useDatabase();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [plant, setPlant] = useState<Plant | null>(null);

  useEffect(() => {
    if (!repo || !id) return;
    (async () => {
      // Get all photos, find the one with matching id
      const all = await repo.getAllPhotos(500);
      const p = all.find((ph: any) => ph.id === id);
      if (p) {
        setPhoto(p);
        const pl = await repo.getPlantById(p.plant_id);
        setPlant(pl);
      }
    })();
  }, [id, repo]);

  if (!photo) {
    return (
      <SafeAreaView className="flex-1 bg-black items-center justify-center">
        <Text className="text-white">Loading...</Text>
      </SafeAreaView>
    );
  }

  let aiAnalysis: any = null;
  if (photo.ai_analysis) {
    try {
      aiAnalysis = JSON.parse(photo.ai_analysis);
    } catch {}
  }

  return (
    <SafeAreaView className="flex-1 bg-black">
      <ScrollView className="flex-1">
        {/* Photo */}
        <Image
          source={{ uri: photo.uri }}
          className="w-full"
          style={{ aspectRatio: 4 / 3 }}
          resizeMode="contain"
        />

        {/* Info */}
        <View className="bg-white rounded-t-3xl px-4 py-6 -mt-6">
          <Text className="text-lg font-bold text-gray-800 mb-1">
            {plant?.name || "Unknown Plant"}
          </Text>
          <Text className="text-sm text-gray-500 mb-4">{formatDateTime(photo.date)}</Text>

          {photo.notes && (
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-600 mb-1">Notes</Text>
              <Text className="text-gray-700">{photo.notes}</Text>
            </View>
          )}

          {/* AI Analysis */}
          {aiAnalysis && (
            <View className="bg-leaf-50 rounded-xl p-4 mb-4">
              <Text className="font-bold text-gray-700 mb-2">🤖 AI Analysis</Text>
              {aiAnalysis.health && (
                <View className="flex-row items-center mb-1">
                  <Text className="text-sm text-gray-600 w-20">Health:</Text>
                  <Text className="text-sm font-medium text-gray-800">{aiAnalysis.health}</Text>
                </View>
              )}
              {aiAnalysis.leaves && (
                <View className="flex-row items-center mb-1">
                  <Text className="text-sm text-gray-600 w-20">Leaves:</Text>
                  <Text className="text-sm text-gray-800">{aiAnalysis.leaves}</Text>
                </View>
              )}
              {aiAnalysis.pests && (
                <View className="flex-row items-center mb-1">
                  <Text className="text-sm text-gray-600 w-20">Pests:</Text>
                  <Text className={`text-sm font-medium ${aiAnalysis.pests.includes("None") ? "text-green-600" : "text-red-600"}`}>
                    {aiAnalysis.pests}
                  </Text>
                </View>
              )}
              {aiAnalysis.stage && (
                <View className="flex-row items-center mb-1">
                  <Text className="text-sm text-gray-600 w-20">Stage:</Text>
                  <Text className="text-sm text-gray-800">{aiAnalysis.stage}</Text>
                </View>
              )}
              {aiAnalysis.notes && (
                <Text className="text-sm text-gray-600 mt-2">💡 {aiAnalysis.notes}</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
