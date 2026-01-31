
import { GoogleGenAI, Type } from "@google/genai";
import { Item, ItemType, MatchResult } from "../types";

// Helper to get API key (simulated environment check)
const getApiKey = () => process.env.API_KEY || '';

/**
 * Analyzes an image to extract details and perform OCR.
 */
export const analyzeItemImage = async (base64Image: string, mimeType: string = 'image/jpeg'): Promise<{
  title: string;
  description: string;
  category: string;
  tags: string[];
  color: string;
  condition: string;
  ocrText: string;
}> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });

  // Prompt for the Vision model with OCR instructions
  const prompt = `
    Analyze this image of a lost or found item on a university campus.
    
    1. Visual Details: Provide a title, description, category, tags, color, and condition.
    2. OCR / Identity Shield: Carefully extract ANY visible text, names, student ID numbers, or emails visible on the item (e.g., on an ID card, notebook cover, or sticky note). If none, return empty string.
    
    Categories: Electronics, Clothing, Accessories, Books, Keys, ID Cards, Other.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            description: { type: Type.STRING },
            category: { type: Type.STRING },
            tags: { type: Type.ARRAY, items: { type: Type.STRING } },
            color: { type: Type.STRING },
            condition: { type: Type.STRING },
            ocrText: { type: Type.STRING, description: "Any text visible on the item for identity matching." }
          },
          required: ["title", "description", "category", "tags", "color", "condition", "ocrText"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Analysis Error:", error);
    // Fallback if AI fails
    return {
      title: "Unknown Item",
      description: "Could not analyze image.",
      category: "Other",
      tags: [],
      color: "Unknown",
      condition: "Unknown",
      ocrText: ""
    };
  }
};

/**
 * Finds potential matches between a target item and a list of candidates.
 */
export const findSmartMatches = async (targetItem: Item, candidates: Item[]): Promise<MatchResult[]> => {
  const apiKey = getApiKey();
  if (!apiKey) return [];
  if (candidates.length === 0) return [];

  const ai = new GoogleGenAI({ apiKey });

  const candidateSummaries = candidates
    .filter(c => c.type !== targetItem.type && c.status === 'OPEN')
    .map(c => ({
      id: c.id,
      title: c.title,
      description: c.description,
      category: c.category,
      location: c.location,
      date: c.date,
      color: c.aiTags.join(', '),
      ocr: c.ocrDetectedText // Pass OCR text for smarter matching
    }));

  if (candidateSummaries.length === 0) return [];

  const prompt = `
    Find matches for a ${targetItem.type} item.
    
    Target:
    ${targetItem.title} (${targetItem.category})
    Desc: ${targetItem.description}
    Loc: ${targetItem.location}
    OCR Text: ${targetItem.ocrDetectedText || "N/A"}

    Candidates:
    ${JSON.stringify(candidateSummaries)}

    Task:
    Return list of matches.
    - If OCR text matches (e.g., same Name or ID), Confidence should be 100.
    - Otherwise compare description/location.
    - Return empty array if no matches > 40 confidence.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              itemId: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              reasoning: { type: Type.STRING }
            },
            required: ["itemId", "confidence", "reasoning"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);

  } catch (error) {
    console.error("Gemini Matching Error:", error);
    return [];
  }
};

/**
 * Semantically searches for items based on a natural language query.
 */
export const searchItemsSemantically = async (query: string, items: Item[]): Promise<string[]> => {
  const apiKey = getApiKey();
  if (!apiKey) return [];
  if (!query.trim()) return [];

  const ai = new GoogleGenAI({ apiKey });

  // Optimize payload: only send relevant text fields
  const candidates = items.map(i => ({ 
    id: i.id, 
    content: `${i.title} | ${i.description} | ${i.category} | ${i.location} | ${i.aiTags.join(', ')}` 
  }));

  const prompt = `
    You are a semantic search engine for a campus lost-and-found.
    User Query: "${query}"
    
    Task: Identify which items from the list below semantically match the user's query.
    - Handle synonyms (e.g., "phone" matches "iPhone", "bag" matches "backpack").
    - Handle vague descriptions (e.g., "something to type on" matches "laptop").
    
    Items:
    ${JSON.stringify(candidates)}
    
    Return:
    A JSON array containing ONLY the IDs of the matching items. Return empty array if no matches.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Semantic Search Error:", error);
    return [];
  }
};

/**
 * Analyzes a surveillance frame to detect potential lost items.
 */
export const analyzeSurveillanceFrame = async (base64Image: string): Promise<Array<{
  object: string;
  description: string;
  confidence: number;
}>> => {
  const apiKey = getApiKey();
  if (!apiKey) throw new Error("API Key not found");

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are a security AI analyzing a CCTV frame. 
    Identify any personal belongings (backpacks, laptops, bottles, wallets, phones, jackets) that look unattended.
    Ignore structural elements like tables, chairs, or walls unless an item is on them.
    Return a list of detected objects.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Image
            }
          },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              object: { type: Type.STRING, description: "Name of the object (e.g., Black Backpack)" },
              description: { type: Type.STRING, description: "Brief visual description" },
              confidence: { type: Type.NUMBER, description: "Confidence 0-1" }
            },
            required: ["object", "description", "confidence"]
          }
        }
      }
    });

    const text = response.text;
    if (!text) return [];
    return JSON.parse(text);
  } catch (error) {
    console.error("Surveillance Analysis Error:", error);
    return [];
  }
};
