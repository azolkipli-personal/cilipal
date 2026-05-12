import NewPlantScreen from "../new";

// Edit Plant screen — same form as New, but passes an `id` param
// The NewPlantScreen component handles both create and edit based on params.id
export default function EditPlantScreen() {
  return <NewPlantScreen />;
}
