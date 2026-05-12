import { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  Platform,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as FileSystem from "expo-file-system";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDatabase } from "../../src/hooks/useDatabase";
import { Plant, PLANT_STAGES, STAGE_EMOJI } from "../../src/types";
import { generateId, todayISO } from "../../src/utils/date-utils";

export default function NewPlantScreen() {
  const { repo } = useDatabase();
  const params = useLocalSearchParams();
  const editId = params.id as string | undefined;

  const [name, setName] = useState("");
  const [variety, setVariety] = useState("");
  const [stage, setStage] = useState<string>("seedling");
  const [acquiredDate, setAcquiredDate] = useState(todayISO());
  const [notes, setNotes] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(!!editId);

  useEffect(() => {
    if (editId && repo) {
      repo.getPlantById(editId).then((plant) => {
        if (plant) {
          setName(plant.name);
          setVariety(plant.variety);
          setStage(plant.stage);
          setAcquiredDate(plant.acquired_date);
          setNotes(plant.notes);
          setPhotoUri(plant.profile_photo_uri);
        }
        setLoading(false);
      });
    }
  }, [editId, repo]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Camera access required to take plant photos");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
    }
  };

  const save = async () => {
    if (!name.trim()) {
      Alert.alert("Name required", "Please give your plant a name");
      return;
    }
    if (!repo) return;
    setSaving(true);

    try {
      if (editId) {
        await repo.updatePlant(editId, {
          name: name.trim(),
          variety: variety.trim(),
          stage: stage as Plant["stage"],
          acquired_date: acquiredDate,
          notes: notes.trim(),
          profile_photo_uri: photoUri,
        });
      } else {
        await repo.insertPlant({
          id: generateId(),
          name: name.trim(),
          variety: variety.trim() || "Gekikara",
          acquired_date: acquiredDate,
          profile_photo_uri: photoUri,
          stage: stage as Plant["stage"],
          notes: notes.trim(),
        });
      }
      router.back();
    } catch (e) {
      console.error("Save error:", e);
      Alert.alert("Error", "Failed to save plant");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-chili-50 items-center justify-center">
        <Text className="text-gray-500">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-chili-50">
      <ScrollView className="flex-1 px-4" keyboardShouldPersistTaps="handled">
        {/* Photo */}
        <View className="items-center my-6">
          <TouchableOpacity
            onPress={() => {
              Alert.alert("Add Photo", "Choose a photo for this plant", [
                { text: "Take Photo", onPress: takePhoto },
                { text: "Pick from Gallery", onPress: pickImage },
                { text: "Cancel", style: "cancel" },
              ]);
            }}
            className="w-32 h-32 rounded-full bg-gray-200 items-center justify-center overflow-hidden"
          >
            {photoUri ? (
              <Image source={{ uri: photoUri }} className="w-32 h-32" />
            ) : (
              <Text className="text-4xl">🌶️</Text>
            )}
          </TouchableOpacity>
          <Text className="text-xs text-gray-400 mt-2">Tap to add photo</Text>
        </View>

        {/* Name */}
        <Text className="text-sm font-medium text-gray-700 mb-1">Plant Name *</Text>
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 text-gray-800"
          placeholder="e.g. Plant A, Gekikara #1"
          placeholderTextColor="#9CA3AF"
          value={name}
          onChangeText={setName}
        />

        {/* Variety */}
        <Text className="text-sm font-medium text-gray-700 mb-1">Variety</Text>
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 text-gray-800"
          placeholder="e.g. Gekikara (default)"
          placeholderTextColor="#9CA3AF"
          value={variety}
          onChangeText={setVariety}
        />

        {/* Stage */}
        <Text className="text-sm font-medium text-gray-700 mb-2">Growth Stage</Text>
        <ScrollView horizontal className="mb-4" showsHorizontalScrollIndicator={false}>
          {PLANT_STAGES.map((s) => (
            <TouchableOpacity
              key={s}
              onPress={() => setStage(s)}
              className={`px-4 py-3 rounded-xl mr-2 flex-row items-center ${
                stage === s ? "bg-chili-600" : "bg-white border border-gray-200"
              }`}
            >
              <Text className="mr-1">{STAGE_EMOJI[s]}</Text>
              <Text className={stage === s ? "text-white font-medium" : "text-gray-700"}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Acquired Date */}
        <Text className="text-sm font-medium text-gray-700 mb-1">Acquired Date</Text>
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-4 text-gray-800"
          value={acquiredDate}
          onChangeText={setAcquiredDate}
          placeholder="YYYY-MM-DD"
        />

        {/* Notes */}
        <Text className="text-sm font-medium text-gray-700 mb-1">Notes</Text>
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-6 text-gray-800"
          placeholder="Any notes about this plant..."
          placeholderTextColor="#9CA3AF"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />

        {/* Save Button */}
        <TouchableOpacity
          onPress={save}
          disabled={saving || !name.trim()}
          className={`py-3 rounded-xl mb-8 ${
            saving || !name.trim() ? "bg-gray-300" : "bg-chili-600"
          }`}
        >
          <Text className="text-white font-bold text-center text-lg">
            {saving ? "Saving..." : editId ? "Update Plant" : "Add Plant"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}
