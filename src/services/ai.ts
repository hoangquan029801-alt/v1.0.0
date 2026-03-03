import { GoogleGenAI, Type } from "@google/genai";

export async function analyzePrompt(prompt: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Analyze the following marketing image prompt and extract design suggestions.
    Prompt: "${prompt}"

    Rules:
    - If colors are not specified, default to ["#ff0000", "#ffffff", "#000000"].
    - Colors MUST be returned as valid 7-character hex codes (e.g., "#ff0000"). Do not return color names.
    - Title must be short and marketing-friendly.
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
          scene: { type: Type.STRING },
          style: { type: Type.STRING },
          suggested_ratio: { type: Type.STRING },
          suggested_colors: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          },
          notes: { type: Type.STRING }
        },
        required: ["title", "scene", "style", "suggested_ratio", "suggested_colors", "notes"]
      }
    }
  });

  return JSON.parse(response.text || "{}");
}

export async function generateDesignImage(params: any) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const parts: any[] = [];

  let promptText = `Generate a marketing image.
  Title: ${params.title}
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

  throw new Error("No image generated");
}
