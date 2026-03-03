import { GoogleGenAI, Type } from "@google/genai";

export interface DesignParams {
  title: string;
  additionalText?: string[];
  scene: string;
  style: string;
  colors: string[];
  notes: string;
  productImages?: { data: string; mimeType: string }[];
  referenceImages?: { data: string; mimeType: string }[];
  aspectRatio?: string;
  resolution?: string;
}

export async function analyzePrompt(prompt: string) {
  try {
    // Note: In the AI Studio environment, process.env.GEMINI_API_KEY is automatically 
    // injected into the browser build via Vite's define config. 
    // Do not change this to VITE_GEMINI_API_KEY as it will break the platform integration.
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is missing. Please select your API key.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Analyze the following marketing image prompt and extract design suggestions.
      Prompt: "${prompt}"

      Rules:
      - If colors are not specified, default to ["#ff0000", "#ffffff", "#000000"].
      - Colors MUST be returned as valid 7-character hex codes (e.g., "#ff0000"). Do not return color names.
      - Title must be short and marketing-friendly.
      - Extract any other text elements mentioned in the prompt into additional_text.
      - Scene must describe the visual background.
      - Style should be the design style.
      - Suggested ratio should be one of: "1:1", "4:5", "16:9", "9:16".
      `,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            additional_text: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            scene: { type: Type.STRING },
            style: { type: Type.STRING },
            suggested_ratio: { type: Type.STRING },
            suggested_colors: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            notes: { type: Type.STRING }
          },
          required: ["title", "additional_text", "scene", "style", "suggested_ratio", "suggested_colors", "notes"]
        }
      }
    });

    return JSON.parse(response.text || "{}");
  } catch (error) {
    console.error("Error analyzing prompt:", error);
    throw new Error("Failed to analyze prompt. Please try again.");
  }
}

export async function generateDesignImage(params: DesignParams) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini API key is missing. Please select your API key.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const parts: any[] = [];

    let promptText = `Generate a marketing image.
    Title: ${params.title}
    Additional Text: ${params.additionalText?.join(" | ") || "None"}
    Scene/Background: ${params.scene}
    Style: ${params.style}
    Colors: ${params.colors.join(", ")}
    Notes: ${params.notes}

    CRITICAL INSTRUCTION: The product in the provided image MUST remain EXACTLY unchanged. Do NOT redesign the product. Do NOT distort the product. Only design the background and layout. The product must remain realistic and sharp. Marketing quality required.
    `;

    parts.push({ text: promptText });

    if (params.productImages && params.productImages.length > 0) {
      for (const img of params.productImages) {
        parts.push({
          inlineData: {
            data: img.data.split(',')[1],
            mimeType: img.mimeType
          }
        });
      }
    }

    if (params.referenceImages && params.referenceImages.length > 0) {
      for (const img of params.referenceImages) {
        parts.push({
          inlineData: {
            data: img.data.split(',')[1],
            mimeType: img.mimeType
          }
        });
      }
    }

    let imageSize = "1K";
    if (params.resolution === "2048") imageSize = "2K";
    if (params.resolution === "4096") imageSize = "4K";

    const response = await ai.models.generateContent({
      model: 'gemini-3.1-flash-image-preview',
      contents: { parts },
      config: {
        imageConfig: {
          aspectRatio: params.aspectRatio || "1:1",
          imageSize: imageSize
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
      }
    }

    throw new Error("No image generated in the response.");
  } catch (error: any) {
    console.error("Error generating image:", error);
    if (error.message?.includes("Requested entity was not found")) {
      throw error; // Let the UI handle the API key re-selection
    }
    throw new Error(error.message || "Failed to generate image. Please try again.");
  }
}
