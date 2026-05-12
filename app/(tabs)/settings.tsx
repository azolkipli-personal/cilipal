import { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useDatabase } from "../../src/hooks/useDatabase";
import { Reminder, REMINDER_TYPE_CONFIG, PLANT_STAGES, STAGE_EMOJI } from "../../src/types";
import { generateId } from "../../src/utils/date-utils";
import { APP_VERSION } from "../../src/utils/constants";

export default function SettingsScreen() {
  const { repo } = useDatabase();
  const [reminders, setReminders] = useState<Reminder[]>([]);

  useEffect(() => {
    if (repo) {
      repo.getReminders().then(setReminders);
    }
  }, [repo]);

  const toggleReminder = async (r: Reminder) => {
    if (!repo) return;
    await repo.updateReminder(r.id, { enabled: r.enabled ? 0 : 1 });
    const updated = await repo.getReminders();
    setReminders(updated);
  };

  const addDefaultReminders = async () => {
    if (!repo) return;
    const today = new Date().toISOString().split("T")[0];
    const defaults = [
      { type: "watering" as const, label: "Water plants", frequency: "daily" as const, time: "09:00" },
      { type: "pest_check" as const, label: "Check for aphids", frequency: "daily" as const, time: "10:00" },
      { type: "bring_inside" as const, label: "Check weather - bring inside?", frequency: "daily" as const, time: "20:00" },
    ];
    for (const d of defaults) {
      await repo.insertReminder({
        id: generateId(),
        plant_id: null,
        type: d.type,
        label: d.label,
        frequency: d.frequency,
        interval_days: null,
        next_due: today,
        time_of_day: d.time,
        enabled: 1,
      });
    }
    const updated = await repo.getReminders();
    setReminders(updated);
    Alert.alert("✅ Done", "Default reminders added");
  };

  return (
    <SafeAreaView className="flex-1 bg-chili-50">
      <ScrollView className="flex-1 px-4">
        <Text className="text-2xl font-bold text-gray-800 mt-2 mb-4">⚙️ Settings</Text>

        {/* About */}
        <View className="bg-white rounded-xl p-4 mb-4 shadow-sm border border-gray-100">
          <Text className="font-bold text-gray-700 mb-2">🌶️ CiliPal v{APP_VERSION}</Text>
          <Text className="text-sm text-gray-500">
            Your personal chilli plant tracker. Built for balcony gardeners in Tokyo 🗼
          </Text>
        </View>

        {/* Reminders Section */}
        <View className="flex-row items-center justify-between mb-3">
          <Text className="text-lg font-bold text-gray-700">🔔 Reminders</Text>
          <TouchableOpacity
            onPress={addDefaultReminders}
            className="bg-chili-100 px-3 py-1 rounded-full"
          >
            <Text className="text-chili-700 text-sm font-medium">+ Defaults</Text>
          </TouchableOpacity>
        </View>

        {reminders.length === 0 ? (
          <View className="bg-white rounded-xl p-6 mb-4 items-center shadow-sm border border-gray-100">
            <Text className="text-3xl mb-2">🔔</Text>
            <Text className="text-gray-500 text-center">No reminders yet</Text>
            <Text className="text-gray-400 text-sm text-center mt-1">
              Tap "+ Defaults" to add watering, pest check, and weather alerts
            </Text>
          </View>
        ) : (
          reminders.map((r) => (
            <View
              key={r.id}
              className="bg-white rounded-xl p-3 mb-2 shadow-sm border border-gray-100 flex-row items-center"
            >
              <Text className="text-xl mr-3">
                {REMINDER_TYPE_CONFIG[r.type]?.emoji || "🔔"}
              </Text>
              <View className="flex-1">
                <Text className={`font-medium ${r.enabled ? "text-gray-800" : "text-gray-400"}`}>
                  {r.label}
                </Text>
                <Text className="text-xs text-gray-400">
                  {r.frequency} • {r.time_of_day}
                  {r.plant_id ? " • Plant-specific" : " • General"}
                </Text>
              </View>
              <Switch
                value={!!r.enabled}
                onValueChange={() => toggleReminder(r)}
                trackColor={{ false: "#E5E7EB", true: "#FCA5A5" }}
                thumbColor={r.enabled ? "#DC2626" : "#9CA3AF"}
              />
            </View>
          ))
        )}

        {/* Plant Stages Reference */}
        <View className="mt-6 mb-8">
          <Text className="text-lg font-bold text-gray-700 mb-3">🌱 Growth Stages</Text>
          <View className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            {PLANT_STAGES.map((stage) => (
              <View key={stage} className="flex-row items-center py-2 border-b border-gray-50 last:border-0">
                <Text className="text-xl mr-3">{STAGE_EMOJI[stage]}</Text>
                <Text className="text-gray-700 capitalize">
                  {stage}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Data Management */}
        <View className="mb-8">
          <Text className="text-lg font-bold text-gray-700 mb-3">🗄️ Data</Text>
          <TouchableOpacity
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 flex-row items-center"
            onPress={() => Alert.alert("Coming Soon", "Data export will be available in a future update.")}
          >
            <Text className="text-xl mr-3">📤</Text>
            <Text className="text-gray-700 font-medium">Export Data</Text>
            <Text className="text-gray-400 text-xs ml-auto">Soon</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
