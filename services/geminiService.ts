import { GoogleGenAI, Type } from "@google/genai";
import { Product, Transaction } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

export const generateProductDescription = async (name: string, type: string): Promise<string> => {
  if (!apiKey) return "API Key not configured.";
  
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Write a short, catchy product description (max 20 words) for a product named "${name}" which is sold as "${type}" stock. in Indonesian.`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "";
  }
};

export const analyzeSales = async (transactions: Transaction[], period: string): Promise<string> => {
  if (!apiKey) return "Fitur analisis memerlukan API Key.";

  // Simplify data to save tokens
  const summary = transactions.map(t => ({
    date: t.date.split('T')[0],
    total: t.total,
    items: t.items.map(i => i.name).join(', ')
  }));

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Bertindaklah sebagai konsultan bisnis. Berikut adalah data transaksi toko untuk periode ${period}: ${JSON.stringify(summary)}. Berikan analisa singkat 3 poin tentang performa penjualan dan 1 saran strategis untuk meningkatkan omset. Gunakan Bahasa Indonesia.`,
    });
    return response.text || "Tidak ada data analisis.";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Gagal melakukan analisis AI.";
  }
};
