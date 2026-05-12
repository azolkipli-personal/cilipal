import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDatabase } from "../../src/hooks/useDatabase";
import { Plant, CareType, CARE_TYPE_CONFIG } from "../../src/types";
import { generateId, nowISO } from "../../src/utils/date-utils";

const CARE_TYPES: CareType[] = [
  "watering",
  "fertilizing",
  "pest_treatment",
  "observation",
  "repotting",
  "harvest",
];

export default function CareLogScreen() {
  const params = useLocalSearchParams<{ plantId?: string; type?: string }>();
  const { repo } = useDatabase();

  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlantId, setSelectedPlantId] = useState(params.plantId || "");
  const [careType, setCareType] = useState<CareType>(
    (params.type as CareType) || "watering"
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (repo) {
      repo.getAllPlants().then(setPlants);
    }
  }, [repo]);

  // If only one plant, auto-select it
  useEffect(() => {
    if (plants.length === 1 && !selectedPlantId) {
      setSelectedPlantId(plants[0].id);
    }
  }, [plants]);

  const save = async () => {
    if (!selectedPlantId) {
      Alert.alert("Select Plant", "Please select a plant");
      return;
    }
    if (!repo) return;
    setSaving(true);

    try {
      await repo.insertCareLog({
        id: generateId(),
        plant_id: selectedPlantId,
        type: careType,
        date: nowISO(),
        notes: notes.trim(),
        details: null,
      });
      Alert.alert("✅ Done", `${CARE_TYPE_CONFIG[careType].emoji} logged for ${plants.find(p => p.id === selectedPlantId)?.name}`, [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (e) {
      Alert.alert("Error", "Failed to save log");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-chili-50">
      <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
        {/* Plant Selector */}
        <Text className="text-sm font-medium text-gray-700 mb-2 mt-4">Plant</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-4">
          {plants.map((p) => (
            <TouchableOpacity
              key={p.id}
              onPress={() => setSelectedPlantId(p.id)}
              className={`px-4 py-3 rounded-xl mr-2 ${
                selectedPlantId === p.id ? "bg-chili-600" : "bg-white border border-gray-200"
              }`}
            >
              <Text
                className={
                  selectedPlantId === p.id ? "text-white font-medium" : "text-gray-700"
                }
              >
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Care Type */}
        <Text className="text-sm font-medium text-gray-700 mb-2">Care Type</Text>
        <View className="flex-row flex-wrap mb-4">
          {CARE_TYPES.map((t) => {
            const cfg = CARE_TYPE_CONFIG[t];
            const isActive = careType === t;
            return (
              <TouchableOpacity
                key={t}
                onPress={() => setCareType(t)}
                className={`px-4 py-3 rounded-xl mr-2 mb-2 flex-row items-center ${
                  isActive ? "bg-chili-600" : "bg-white border border-gray-200"
                }`}
              >
                <Text className="mr-1">{cfg.emoji}</Text>
                <Text className={isActive ? "text-white font-medium" : "text-gray-700"}>
                  {cfg.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Notes */}
        <Text className="text-sm font-medium text-gray-700 mb-1">Notes</Text>
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-6 text-gray-800"
          placeholder="How's the plant? Any observations?"
          placeholderTextColor="#9CA3AF"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        {/* Save */}
        <TouchableOpacity
          onPress={save}
          disabled={saving || !selectedPlantId}
          className={`py-3 rounded-xl mb-8 ${
            saving || !selectedPlantId ? "bg-gray-300" : "bg-chili-600"
          }`}
        >
          <Text className="text-white font-bold text-center text-lg">
            {saving ? "Saving..." : `${CARE_TYPE_CONFIG[careType].emoji} Log ${CARE_TYPE_CONFIG[careType].label}`}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
