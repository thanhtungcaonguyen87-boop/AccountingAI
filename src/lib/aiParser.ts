import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export interface ParsedItem {
  customer: string;
  product: string;
  unit: string;
  quantity: number;
  price: number;
  note: string;
}

export async function parseInput(input: string): Promise<ParsedItem> {
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not configured in .env.local');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
Extract structured data from this text.

Return ONLY valid JSON with this exact schema:
{
  "customer": string,
  "product": string,
  "unit": string,
  "quantity": number,
  "price": number,
  "note": string
}

Rules:
- customer default = "khách lẻ"
- product default = "photo"
- quantity default = 1
- convert "k" => *1000
- price = number only
- if input has quantity and price but doesn't specify if the price is total or unit price, prioritize unit price
- if input explicitly says the price is total, then price = total/quantity
- note contents inside parentheses "()", default = "" 
- no explanation

Text: "${input}"
`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });

    const text = response.text || '';
    // Clean up markdown block logic if AI wraps JSON in ```json
    const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();

    return JSON.parse(jsonStr) as ParsedItem;
  } catch (error) {
    console.error('AI Parsing Error:', error);
    throw error;
  }
}
