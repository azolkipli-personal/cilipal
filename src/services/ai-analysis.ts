// AI Photo Analysis Service
// Supports Gemini API (free tier) with ollama/llava fallback

const GEMINI_API_KEY_STORAGE_KEY = "gemini_api_key";

// Default Gemini prompt for chilli plant analysis
const ANALYSIS_PROMPT = `Analyze this chilli plant photo. Return ONLY valid JSON with these fields:
{
  "health": "Excellent/Good/Fair/Poor",
  "leaves": "Description of leaf color, spots, damage, or 'Healthy green'",
  "pests": "Pest signs detected or 'None visible'",
  "stage": "Seedling/Vegetative/Flowering/Fruiting/Harvested",
  "concerns": "Any issues spotted or 'None'",
  "notes": "Brief care tip if needed"
}`;

let currentApiKey: string | null = null;

export function setGeminiApiKey(key: string) {
  currentApiKey = key;
}

export function getGeminiApiKey(): string | null {
  return currentApiKey;
}

interface AnalysisResult {
  health?: string;
  leaves?: string;
  pests?: string;
  stage?: string;
  concerns?: string;
  notes?: string;
  error?: string;
}

/**
 * Analyze a plant photo using Gemini API free tier.
 * Falls back to local ollama llava-phi3 if API key not set.
 */
export async function analyzePlantPhoto(
  photoUri: string,
  apiKey?: string
): Promise<AnalysisResult> {
  const key = apiKey || currentApiKey;

  if (key) {
    return analyzeWithGemini(photoUri, key);
  }

  // Try ollama fallback
  try {
    return await analyzeWithOllama(photoUri);
  } catch {
    return {
      error: "No API key configured and local AI unavailable",
      notes: "Set your Gemini API key in Settings for AI analysis",
    };
  }
}

async function analyzeWithGemini(
  photoUri: string,
  apiKey: string
): Promise<AnalysisResult> {
  try {
    // Convert photo to base64
    const fs = require("expo-file-system");
    const base64 = await fs.readAsStringAsync(photoUri, {
      encoding: fs.EncodingType.Base64,
    });
    const mimeType = photoUri.endsWith(".png") ? "image/png" : "image/jpeg";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: ANALYSIS_PROMPT },
                {
                  inline_data: {
                    mime_type: mimeType,
                    data: base64,
                  },
                },
              ],
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const err = await response.text();
      return { error: `Gemini API error: ${response.status}`, notes: err.slice(0, 200) };
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Extract JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { error: "Could not parse AI response", notes: text.slice(0, 200) };
  } catch (e: any) {
    return { error: e.message || "Gemini analysis failed" };
  }
}

async function analyzeWithOllama(
  photoUri: string
): Promise<AnalysisResult> {
  try {
    const fs = require("expo-file-system");
    const base64 = await fs.readAsStringAsync(photoUri, {
      encoding: fs.EncodingType.Base64,
    });

    const response = await fetch("http://100.84.210.83:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "llava-phi3",
        prompt: ANALYSIS_PROMPT,
        images: [base64],
        stream: false,
      }),
    });

    if (!response.ok) {
      return { error: `Ollama error: ${response.status}` };
    }

    const data = await response.json();
    const text = data?.response || "";

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }

    return { error: "Could not parse ollama response", notes: text.slice(0, 200) };
  } catch (e: any) {
    return { error: e.message || "Ollama not available" };
  }
}
