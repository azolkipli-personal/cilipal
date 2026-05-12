import { Plant, CareLog, Photo } from "../types";

export interface CareRecommendation {
    id: string;
    type: "pest" | "stage" | "fertilizer" | "general";
    title: string;
    description: string;
    icon: string;
    priority: "high" | "medium" | "low";
}

export function generateRecommendations(
    plant: Plant,
    logs: CareLog[],
    photos: Photo[]
): CareRecommendation[] {
    const recommendations: CareRecommendation[] = [];
    const textCorpus = [
        plant.notes,
        ...logs.map((l) => l.notes + " " + l.details),
        ...photos.map((p) => p.notes + " " + p.ai_analysis),
    ].join(" ").toLowerCase();

    // 1. Pest logic (Aphids)
    if (textCorpus.includes("aphid") || textCorpus.includes("bug") || textCorpus.includes("pest")) {
        recommendations.push({
            id: "rec-pest-aphids",
            type: "pest",
            title: "Aphids Detected",
            description: "Isolate the plant immediately. Spray leaves with a mild insecticidal soap or neem oil. Gently wipe the undersides where aphids hide.",
            icon: "🐛",
            priority: "high",
        });
    }

    // 2. Stage-based care
    if (plant.stage === "seedling") {
        recommendations.push({
            id: "rec-stage-seedling",
            type: "stage",
            title: "Seedling Care",
            description: "Keep soil uniformly moist but not soggy. Avoid strong direct sunlight. Wait until the plant develops its first 'true' leaves before applying any fertilizer.",
            icon: "🌱",
            priority: "medium",
        });
    } else if (plant.stage === "flowering") {
        recommendations.push({
            id: "rec-stage-flowering",
            type: "stage",
            title: "Pollination Assistance",
            description: "Help the flowers fruit by gently dusting pollen from one flower to another using a small, soft paintbrush. Maintain consistent watering.",
            icon: "🌸",
            priority: "high",
        });
    }

    // 3. Fertilizer logic (Hyponex)
    if (plant.stage !== "seedling" && plant.stage !== "harvested") {
        const hasRecentFertilizer = logs.some(
            (l) => l.type === "fertilizing" &&
                (new Date().getTime() - new Date(l.date).getTime()) < 14 * 24 * 60 * 60 * 1000
        );

        if (!hasRecentFertilizer) {
            recommendations.push({
                id: "rec-fertilizer-hyponex",
                type: "fertilizer",
                title: "Nutrient Boost",
                description: "Insert a Hyponex liquid plant food tube upside down into the soil near the pot edge. Replace when empty (roughly every 2 weeks).",
                icon: "🧪",
                priority: "medium",
            });
        }
    }

    return recommendations;
}
