import { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useDatabase } from "../../src/hooks/useDatabase";
import { Plant, CareType, CARE_TYPE_CONFIG, PlantStage } from "../../src/types";
import { generateId, nowISO } from "../../src/utils/date-utils";
import ImageCropModal from "../../src/components/ImageCropModal";
import { analyzePlantPhoto } from "../../src/services/ai-analysis";

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
  const [analyzing, setAnalyzing] = useState(false);

  // Photo state
  const [rawImageUri, setRawImageUri] = useState<string | null>(null);
  const [croppedImageUri, setCroppedImageUri] = useState<string | null>(null);
  const [showCrop, setShowCrop] = useState(false);

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

  const pickFromLibrary = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow access to your photo library.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setRawImageUri(result.assets[0].uri);
      setCroppedImageUri(null);
      setShowCrop(true);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Please allow camera access.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.9,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setRawImageUri(result.assets[0].uri);
      setCroppedImageUri(null);
      setShowCrop(true);
    }
  };

  const handleCropDone = (uri: string) => {
    setCroppedImageUri(uri);
    setShowCrop(false);
  };

  const handleCropCancel = () => {
    setShowCrop(false);
  };

  const save = async () => {
    if (!selectedPlantId) {
      Alert.alert("Select Plant", "Please select a plant");
      return;
    }
    if (!repo) return;
    setSaving(true);

    const finalPhotoUri = croppedImageUri || rawImageUri;

    try {
      // 1. Save care log
      await repo.insertCareLog({
        id: generateId(),
        plant_id: selectedPlantId,
        type: careType,
        date: nowISO(),
        notes: notes.trim(),
        details: null,
      });

      // 2. Save photo and run AI analysis if needed
      let aiResult = null;
      if (finalPhotoUri) {
        setAnalyzing(true);
        try {
          aiResult = await analyzePlantPhoto(finalPhotoUri);
        } catch (e) {
          console.log("AI Analysis skipped or failed", e);
        }

        await repo.insertPhoto({
          id: generateId(),
          plant_id: selectedPlantId,
          uri: finalPhotoUri,
          thumbnail_uri: null,
          date: nowISO(),
          notes: notes.trim(),
          ai_analysis: aiResult ? JSON.stringify(aiResult) : null,
        });
      }

      const currentPlant = plants.find((p) => p.id === selectedPlantId);
      const plantName = currentPlant?.name;

      // 3. Check for stage update suggestion
      if (aiResult?.stage && currentPlant) {
        const detectedStage = aiResult.stage.toLowerCase() as PlantStage;
        if (detectedStage !== currentPlant.stage && ["seedling", "vegetative", "flowering", "fruiting", "harvested"].includes(detectedStage)) {
          setSaving(false);
          setAnalyzing(false);
          Alert.alert(
            "🌱 Stage Update?",
            `AI detected your plant might be in the '${detectedStage}' stage. (Currently marked as '${currentPlant.stage}'). Would you like to update it?`,
            [
              { text: "No", onPress: () => router.back() },
              {
                text: "Yes, Update",
                onPress: async () => {
                  await repo.updatePlant(selectedPlantId, { stage: detectedStage });
                  router.back();
                }
              }
            ]
          );
          return;
        }
      }

      Alert.alert(
        "✅ Done",
        `${CARE_TYPE_CONFIG[careType].emoji} logged for ${plantName}`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (e) {
      Alert.alert("Error", "Failed to save log");
    } finally {
      setSaving(false);
      setAnalyzing(false);
    }
  };

  const displayImageUri = croppedImageUri || rawImageUri;

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
              className={`px-4 py-3 rounded-xl mr-2 ${selectedPlantId === p.id ? "bg-chili-600" : "bg-white border border-gray-200"
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
                className={`px-4 py-3 rounded-xl mr-2 mb-2 flex-row items-center ${isActive ? "bg-chili-600" : "bg-white border border-gray-200"
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

        {/* Photo Section */}
        <Text className="text-sm font-medium text-gray-700 mb-2">Photo (optional)</Text>
        <View className="flex-row mb-4 gap-3">
          <TouchableOpacity
            onPress={takePhoto}
            className="flex-1 bg-white border border-gray-200 rounded-xl py-3 items-center"
          >
            <Text className="text-xl mb-1">📷</Text>
            <Text className="text-xs text-gray-600 font-medium">Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={pickFromLibrary}
            className="flex-1 bg-white border border-gray-200 rounded-xl py-3 items-center"
          >
            <Text className="text-xl mb-1">🖼️</Text>
            <Text className="text-xs text-gray-600 font-medium">Library</Text>
          </TouchableOpacity>
        </View>

        {/* Photo Preview */}
        {displayImageUri && (
          <View className="mb-4">
            <Image
              source={{ uri: displayImageUri }}
              className="w-full rounded-xl bg-gray-200"
              style={{ height: 200 }}
              resizeMode="cover"
            />
            <View className="flex-row mt-2 gap-2">
              <TouchableOpacity
                onPress={() => setShowCrop(true)}
                className="flex-1 bg-white border border-gray-200 rounded-lg py-2 items-center"
              >
                <Text className="text-sm text-gray-700 font-medium">✂️ Re-crop</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => { setRawImageUri(null); setCroppedImageUri(null); }}
                className="flex-1 bg-white border border-red-200 rounded-lg py-2 items-center"
              >
                <Text className="text-sm text-red-500 font-medium">🗑️ Remove</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

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
          className={`py-3 rounded-xl mb-8 ${saving || !selectedPlantId ? "bg-gray-300" : "bg-chili-600"
            }`}
        >
          {analyzing ? (
            <View className="flex-row items-center justify-center">
              <ActivityIndicator size="small" color="white" className="mr-2" />
              <Text className="text-white font-bold text-center text-lg">AI Analyzing...</Text>
            </View>
          ) : (
            <Text className="text-white font-bold text-center text-lg">
              {saving ? "Saving..." : `${CARE_TYPE_CONFIG[careType].emoji} Log ${CARE_TYPE_CONFIG[careType].label}`}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Crop Modal */}
      {rawImageUri && (
        <ImageCropModal
          visible={showCrop}
          imageUri={rawImageUri}
          onDone={handleCropDone}
          onCancel={handleCropCancel}
        />
      )}
    </SafeAreaView>
  );
}
