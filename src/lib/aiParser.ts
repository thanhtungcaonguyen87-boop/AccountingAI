import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;

export interface ParsedItem {
  customer: string;
  product: string;
  unit: string;
  quantity: number;
  price: number;
  note: string;
  date: string;
}

const responseSchema = {
  type: "object",
  properties: {
    customer: { type: "string" },
    product: { type: "string" },
    unit: { type: "string" },
    quantity: { type: "number" },
    price: { type: "number" },
    note: { type: "string" },
    date: { type: "string" },
  },
  required: [
    "customer",
    "product",
    "unit",
    "quantity",
    "price",
    "note",
    "date",
  ],
};

export async function parseInput(input: string): Promise<ParsedItem> {
  if (!apiKey) {
    throw new Error('VITE_GEMINI_API_KEY is not configured in .env.local');
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `Trích xuất dữ liệu từ văn bản sau.
- customer: mặc định "khách lẻ"
- product: mặc định "photo"
- quantity: mặc định 1
- convert "k" => *1000
- price: chỉ lấy số. Ưu tiên đơn giá. Nếu ghi "tổng" thì đơn giá = tổng/số lượng.
- note: nội dung trong ngoặc "()", mặc định ""
- date: định dạng yyyy-mm-dd, mặc định "". Sử dụng năm 2026 nếu không ghi năm.

Văn bản: "${input}"`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
      },
    });

    const res = response as unknown as { parsed?: ParsedItem; text?: string };
    if (res.parsed) {
      return res.parsed;
    }

    const text = res.text || "";
    // Clean up markdown block logic if AI wraps JSON in ```json
    const jsonStr = text.replace(/```json/g, "").replace(/```/g, "").trim();

    return JSON.parse(jsonStr) as ParsedItem;
  } catch (error) {
    console.error('AI Parsing Error:', error);
    throw error;
  }
}
