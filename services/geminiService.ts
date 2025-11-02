import { GoogleGenAI, Type } from "@google/genai";

// Fallback data in case of API key absence or API failure
const fallbackPosts: Omit<import('../types').Post, 'id' | 'timestamp'>[] = [
    { 
        userId: "digital-artist", 
        username: "فنان رقمي", 
        avatarUrl: "https://picsum.photos/seed/art/48", 
        content: "الفن هو الطريقة التي نقول بها ما لا نستطيع قوله. كل لوحة هي قصة تنتظر من يقرأها. #فن #إبداع", 
        imageUrl: "https://picsum.photos/seed/art-post/600/400",
        likes: 120,
        shares: 15,
        comments: [
            { id: 'c1', userId: 'tech-expert', username: 'خبير تقني', text: 'عمل مذهل!', timestamp: new Date() }
        ]
    },
    { 
        userId: "nature-explorer", 
        username: "مستكشف الطبيعة", 
        avatarUrl: "https://picsum.photos/seed/nature/48", 
        content: "لا يوجد واي فاي في الغابة، لكنك ستجد اتصالًا أفضل. قضيت اليوم في أحضان الطبيعة، شعور لا يوصف بالسلام. 🌲 #طبيعة #هدوء",
        likes: 256,
        shares: 32,
        comments: []
    },
    { 
        userId: "tech-expert", 
        username: "خبير تقني", 
        avatarUrl: "https://picsum.photos/seed/tech/48", 
        content: "الذكاء الاصطناعي يتطور بسرعة مذهلة! ما هو أكثر تطبيق للذكاء الاصطناعي أثار إعجابكم مؤخرًا؟ شاركوني آرائكم. #تقنية #مستقبل",
        likes: 412,
        shares: 45,
        comments: [
            { id: 'c2', userId: 'digital-artist', username: 'فنان رقمي', text: 'أعتقد أن أدوات توليد الصور هي الأكثر إثارة للإعجاب.', timestamp: new Date() },
            { id: 'c3', userId: 'coffee-lover', username: 'ذواقة القهوة', text: 'أتفق معك!', timestamp: new Date() }
        ]
    },
    { 
        userId: "coffee-lover", 
        username: "ذواقة القهوة", 
        avatarUrl: "https://picsum.photos/seed/coffee/48", 
        content: "رائحة القهوة في الصباح هي بداية مثالية ليوم مليء بالإنجازات. كيف تفضلون قهوتكم؟ ☕ #قهوة #صباح_الخير",
        likes: 98,
        shares: 12,
        comments: []
    },
    { 
        userId: "travel-enthusiast", 
        username: "عاشق السفر", 
        avatarUrl: "https://picsum.photos/seed/travel/48", 
        content: "السفر يفتح العقل ويجدد الروح. التخطيط للوجهة القادمة... هل لديكم أي اقتراحات؟ ✈️ #سفر #مغامرة", 
        imageUrl: "https://picsum.photos/seed/travel-post/600/400",
        likes: 320,
        shares: 28,
        comments: []
    },
    { 
        userId: "new-user", 
        username: "مستخدم جديد", 
        avatarUrl: "https://picsum.photos/seed/new-user/48", 
        content: "مرحباً بالعالم! هذا هو أول منشور لي هنا. متحمس للتواصل معكم جميعاً.",
        likes: 5,
        shares: 1,
        comments: []
    }
];


export async function generateSamplePosts(): Promise<Omit<import('../types').Post, 'id' | 'timestamp'>[]> {
  // Assume process.env.API_KEY is configured in the environment
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    console.warn("API_KEY environment variable not set. Serving fallback content.");
    return fallbackPosts;
  }

  const ai = new GoogleGenAI({ apiKey });

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate 5 sample social media posts in Arabic. Topics can include technology, art, daily life, and nature. For each post, provide a creative Arabic username, a unique user ID slug based on the username, a unique placeholder avatar URL from picsum.photos. Also include a random number of likes (between 5 and 500) and shares (between 1 and 50). For 2-3 of the posts, also include a relevant placeholder imageUrl from `https://picsum.photos/seed/{random-topic}/600/400`. For 2 posts, add one or two sample comments from other generated users.",
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              userId: {
                type: Type.STRING,
                description: 'A unique user ID, like a slug from the username (e.g., "digital-artist").',
              },
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
              likes: {
                type: Type.NUMBER,
                description: "A random number of likes for the post.",
              },
              shares: {
                type: Type.NUMBER,
                description: "A random number of shares for the post.",
              },
              imageUrl: {
                type: Type.STRING,
                description: 'Optional placeholder image URL from `https://picsum.photos/seed/{random-topic}/600/400` format.',
              },
              comments: {
                type: Type.ARRAY,
                description: "An optional array of sample comments.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        id: { type: Type.STRING },
                        userId: { type: Type.STRING },
                        username: { type: Type.STRING },
                        text: { type: Type.STRING },
                        timestamp: { type: Type.STRING, description: "ISO 8601 date string" }
                    },
                    required: ["id", "userId", "username", "text", "timestamp"]
                }
              }
            },
            required: ["userId", "username", "avatarUrl", "content"],
          },
        },
      },
    });

    const jsonText = response.text.trim();
    const posts = JSON.parse(jsonText).map(post => ({
        ...post,
        comments: (post.comments || []).map(comment => ({
            ...comment,
            timestamp: new Date(comment.timestamp)
        }))
    }));
    
    return posts;

  } catch (error) {
    console.error("Error calling Gemini API:", error);
    return fallbackPosts;
  }
}