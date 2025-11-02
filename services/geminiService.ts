import { GoogleGenAI } from "@google/genai";

/**
 * Generates post content using the Gemini API based on a given topic.
 * @param topic The topic for the post.
 * @returns A promise that resolves to the generated post content string.
 */
export async function generatePostContent(topic: string): Promise<string> {
  try {
    // Ensure API_KEY is available. The environment variable is expected to be set.
    if (!process.env.API_KEY) {
      throw new Error("API_KEY environment variable not set.");
    }
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

    const prompt = `اكتب منشورًا قصيرًا وجذابًا على وسائل التواصل الاجتماعي حول "${topic}". يجب أن يكون المنشور مناسبًا لجمهور عام في مصر. اجعله أقل من 280 حرفًا. لا تقم بتضمين أي هاشتاجات.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
    });
    
    return response.text.trim();
  } catch (error) {
    console.error("Error generating post content:", error);
    // Provide a user-facing error message in Arabic.
    throw new Error("فشل إنشاء المحتوى.");
  }
}
