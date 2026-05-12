import { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  RefreshControl,
  Dimensions,
} from "react-native";
import { router, useFocusEffect } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDatabase } from "../../src/hooks/useDatabase";
import { formatDateTime } from "../../src/utils/date-utils";

const SCREEN_WIDTH = Dimensions.get("window").width;
const COLUMNS = 3;
const GAP = 2;
const PHOTO_SIZE = (SCREEN_WIDTH - GAP * (COLUMNS - 1)) / COLUMNS;

export default function DiaryScreen() {
  const { repo, isReady } = useDatabase();
  const [photos, setPhotos] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    if (!repo) return;
    const all = await repo.getAllPhotos(200);
    setPhotos(all);
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
      <View className="px-4 py-2">
        <Text className="text-2xl font-bold text-gray-800">📸 Photo Diary</Text>
      </View>

      <FlatList
        data={photos}
        keyExtractor={(item) => item.id}
        numColumns={COLUMNS}
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#DC2626" />
        }
        ListEmptyComponent={
          <View className="items-center py-32">
            <Text className="text-6xl mb-4">📸</Text>
            <Text className="text-lg text-gray-500">No photos yet</Text>
            <Text className="text-gray-400 mt-1 text-center px-8">
              Take photos of your plants to build a growth timeline
            </Text>
          </View>
        }
        renderItem={({ item, index }) => (
          <TouchableOpacity
            onPress={() => router.push(`/diary/${item.id}`)}
            style={{
              width: PHOTO_SIZE,
              height: PHOTO_SIZE,
              marginLeft: index % COLUMNS !== 0 ? GAP : 0,
              marginBottom: GAP,
            }}
            className="bg-gray-200"
          >
            <Image
              source={{ uri: item.uri }}
              style={{ width: PHOTO_SIZE, height: PHOTO_SIZE }}
              className="rounded-none"
            />
            <View className="absolute bottom-0 left-0 right-0 bg-black/40 px-1 py-0.5">
              <Text className="text-white text-xs" numberOfLines={1}>
                {item.plant_name}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </SafeAreaView>
  );
}
