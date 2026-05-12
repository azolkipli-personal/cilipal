import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDatabase } from "../../src/hooks/useDatabase";
import { Plant, STAGE_EMOJI } from "../../src/types";

export default function PlantsScreen() {
  const { repo, isReady } = useDatabase();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!repo) return;
    const all = await repo.getAllPlants();
    setPlants(all);
  }

  useFocusEffect(
    useCallback(() => {
      if (isReady) load();
    }, [isReady, repo])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  return (
    <SafeAreaView className="flex-1 bg-chili-50">
      <View className="flex-row items-center justify-between px-4 py-2">
        <Text className="text-2xl font-bold text-gray-800">🌱 My Plants</Text>
        <TouchableOpacity
          onPress={() => router.push("/plants/new")}
          className="bg-chili-600 px-4 py-2 rounded-full"
        >
          <Text className="text-white font-semibold">+ Add</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={plants}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ paddingHorizontal: 12, gap: 12 }}
        contentContainerStyle={{ paddingVertical: 8, paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />
        }
        ListEmptyComponent={
          <View className="items-center py-32">
            <Text className="text-6xl mb-4">🌱</Text>
            <Text className="text-lg text-gray-500">No plants yet</Text>
            <Text className="text-gray-400 mt-1">Tap "+ Add" to get started</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            onPress={() => router.push(`/plants/${item.id}`)}
            className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100 flex-1"
          >
            <Text className="text-4xl mb-2">{STAGE_EMOJI[item.stage]}</Text>
            <Text className="font-bold text-gray-800 text-lg">{item.name}</Text>
            {item.variety ? (
              <Text className="text-sm text-gray-500">{item.variety}</Text>
            ) : (
              <Text className="text-sm text-gray-300 italic">No variety</Text>
            )}
            <View className="flex-row mt-3 pt-3 border-t border-gray-100">
              <Text className="text-xs text-gray-400">
                {item.stage.charAt(0).toUpperCase() + item.stage.slice(1)}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
