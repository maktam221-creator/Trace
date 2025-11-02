
import { GoogleGenAI, Type } from "@google/genai";

// Assume process.env.API_KEY is configured in the environment
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey });

export async function generateSamplePosts(): Promise<Omit<import('../types').Post, 'id' | 'timestamp'>[]> {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate 5 sample social media posts in Arabic. Topics can include technology, art, daily life, and nature. For each post, provide a creative Arabic username and a unique placeholder image URL from picsum.photos.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              username: {
                type: Type.STRING,
                description: 'اسم مستخدم عربي إبداعي.',
              },
              avatarUrl: {
                type: Type.STRING,
                description: 'A placeholder image URL from `https://picsum.photos/seed/{random}/48` format.',
              },
              content: {
                type: Type.STRING,
                description: 'محتوى المنشور باللغة العربية.',
              },
            },
            required: ["username", "avatarUrl", "content"],
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const posts = JSON.parse(jsonText);
    return posts;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    // Fallback data in case of API failure
    return [
        { username: "فنان رقمي", avatarUrl: "https://picsum.photos/seed/art/48", content: "الفن هو الطريقة التي نقول بها ما لا نستطيع قوله. كل لوحة هي قصة تنتظر من يقرأها. #فن #إبداع" },
        { username: "مستكشف الطبيعة", avatarUrl: "https://picsum.photos/seed/nature/48", content: "لا يوجد واي فاي في الغابة، لكنك ستجد اتصالًا أفضل. قضيت اليوم في أحضان الطبيعة، شعور لا يوصف بالسلام. 🌲 #طبيعة #هدوء" },
        { username: "خبير تقني", avatarUrl: "https://picsum.photos/seed/tech/48", content: "الذكاء الاصطناعي يتطور بسرعة مذهلة! ما هو أكثر تطبيق للذكاء الاصطناعي أثار إعجابكم مؤخرًا؟ شاركوني آرائكم. #تقنية #مستقبل" },
        { username: "ذواقة القهوة", avatarUrl: "https://picsum.photos/seed/coffee/48", content: "رائحة القهوة في الصباح هي بداية مثالية ليوم مليء بالإنجازات. كيف تفضلون قهوتكم؟ ☕ #قهوة #صباح_الخير" },
        { username: "عاشق السفر", avatarUrl: "https://picsum.photos/seed/travel/48", content: "السفر يفتح العقل ويجدد الروح. التخطيط للوجهة القادمة... هل لديكم أي اقتراحات؟ ✈️ #سفر #مغامرة" }
    ];
  }
}
