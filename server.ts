import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, GenerateVideosOperation, Modality } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "20mb" })); // Raise payload limit to allow image base64 posts safely

  // AI SQL generation helper with failover logic
  const generateSQLFromProvider = async (provider: string, prompt: string, dbType: string, customKey?: string) => {
    const systemInstruction = `أنت مهندس قواعد بيانات ومطور خبير ومستشار تقني.
المطلوب هو إنشاء كود قاعدة بيانات من نوع "${dbType}" بناءً على طلب المستخدم التالي: "${prompt}".
يجب عليك توليد الكود الفعلي المناسب تماماً بدون أي اختصار أو محاكاة وهمية.

شروط هامة جداً:
1. أرجع كوداً برمجياً حقيقياً وصالحاً للتشغيل مباشرة على منصات قواعد البيانات (مثال: SQL Editor في Supabase، أو Console في Neon، أو Firebase Firestore Rule، أو MongoDB Collection scripts).
2. بالنسبة لقواعد بيانات SQL (مثل Postgres أو MySQL)، أرجع كود DDL كامل (CREATE TABLE, ALTER TABLE, constraints, indexes, keys) مع إدراج بعض البيانات التجريبية المفيدة (INSERT INTO) لإظهار كيف تبدو البيانات المحفوظة.
3. بالنسبة لـ NoSQL (مثل MongoDB أو Firebase Firestore)، أرجع هيكلية المجموعات (Collections) والمستندات في هيئة JSON واضحة أو كود لإدراج البيانات، مع شرح لكيفية إضافتها في الواجهة السحابية الخاصة بالمزود.
4. يجب أن يكون الرد باللغة العربية لشرح الخطوات، متبوعاً بكود برمجي واضح داخل كتل أكواد ماركداون (Markdown code blocks) مخصص ومصمم باحترافية.
5. اشرح للمستخدم خطوة بخطوة باللغة العربية أين يضع هذا الكود في منصة المزود السحابية (مثلاً: "اذهب إلى SQL Editor في Supabase، ثم الصق الكود التالي واضغط Run"). لا تضع فرضيات عامة بل أعطه معلومات فعلية حقيقية 100%.`;

    if (provider === "gemini") {
      const apiKey = customKey || process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error("مفتاح Gemini API غير متوفر في الإعدادات أو البيئة.");
      }
      const ai = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [systemInstruction],
      });
      return response.text;
    }

    if (provider === "groq") {
      const apiKey = customKey || process.env.GROQ_API_KEY;
      if (!apiKey) {
        throw new Error("مفتاح Groq API غير متوفر في الإعدادات أو البيئة.");
      }
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama3-8b-8192",
          messages: [{ role: "user", content: systemInstruction }],
          temperature: 0.3,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`خطأ من Groq: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    }

    if (provider === "openai") {
      const apiKey = customKey || process.env.OPENAI_API_KEY;
      if (!apiKey) {
        throw new Error("مفتاح OpenAI API غير متوفر في الإعدادات أو البيئة.");
      }
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: systemInstruction }],
          temperature: 0.3,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`خطأ من OpenAI: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    }

    if (provider === "kimi") {
      const apiKey = customKey || process.env.KIMI_API_KEY;
      if (!apiKey) {
        throw new Error("مفتاح Kimi API غير متوفر في الإعدادات أو البيئة.");
      }
      const response = await fetch("https://api.moonshot.cn/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "moonshot-v1-8k",
          messages: [{ role: "user", content: systemInstruction }],
          temperature: 0.3,
        }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`خطأ من Kimi: ${response.status} - ${errorText}`);
      }
      const data = await response.json();
      return data.choices?.[0]?.message?.content || "";
    }

    throw new Error(`مزود ذكاء اصطناعي غير مدعوم: ${provider}`);
  };

  // API Endpoints for SQL Generator with automatic failover
  app.post("/api/generate-sql", async (req, res) => {
    const { prompt, dbType, providers = ["gemini", "groq", "openai", "kimi"], keys = {} } = req.body;

    if (!prompt || !dbType) {
      return res.status(400).json({ error: "يرجى تقديم وصف قاعدة البيانات ونوعها." });
    }

    const attemptsLog: { provider: string; status: "success" | "failed"; error?: string }[] = [];
    let finalResult = "";
    let successfulProvider = "";

    for (const provider of providers) {
      try {
        const customKey = keys[provider];
        finalResult = await generateSQLFromProvider(provider, prompt, dbType, customKey);
        successfulProvider = provider;
        attemptsLog.push({ provider, status: "success" });
        break; // Stop on first successful generation
      } catch (err: any) {
        console.error(`Provider ${provider} failed:`, err.message);
        attemptsLog.push({ provider, status: "failed", error: err.message || String(err) });
      }
    }

    if (finalResult) {
      res.json({
        success: true,
        provider: successfulProvider,
        sql: finalResult,
        attempts: attemptsLog,
      });
    } else {
      res.status(500).json({
        success: false,
        error: "فشلت جميع محاولات توليد الكود عبر كافة الوكلاء المزودين المتاحين.",
        attempts: attemptsLog,
      });
    }
  });

  // API Endpoint: AI Chat Agent (Multi-turn conversational assistant)
  app.post("/api/ai-chat", async (req, res) => {
    const { messages, systemInstruction, model = "gemini-3.5-flash", provider, customApiKey } = req.body;
    
    // Custom providers with API Keys (Groq, Kimi, OpenAI, OpenRouter)
    if (provider && ["groq", "kimi", "openai", "openrouter"].includes(provider)) {
      if (!customApiKey) {
        return res.status(400).json({ error: `يرجى توفير أو حفظ مفتاح API الخاص بـ ${provider} لتشغيل هذا الوكيل.` });
      }

      try {
        let apiUrl = "";
        let apiModel = "";
        
        if (provider === "groq") {
          apiUrl = "https://api.groq.com/openai/v1/chat/completions";
          apiModel = "llama-3.3-70b-versatile";
        } else if (provider === "kimi") {
          apiUrl = "https://api.moonshot.cn/v1/chat/completions";
          apiModel = "moonshot-v1-8k";
        } else if (provider === "openai") {
          apiUrl = "https://api.openai.com/v1/chat/completions";
          apiModel = "gpt-4o-mini";
        } else if (provider === "openrouter") {
          apiUrl = "https://openrouter.ai/api/v1/chat/completions";
          apiModel = "meta-llama/llama-3.3-70b-instruct:free";
        }

        // Map messages to OpenAI format
        const mappedMessages = [];
        if (systemInstruction) {
          mappedMessages.push({ role: "system", content: systemInstruction });
        }
        for (const msg of messages) {
          const content = msg.parts?.[0]?.text || msg.content || "";
          const role = (msg.role === "model" || msg.role === "assistant") ? "assistant" : "user";
          mappedMessages.push({ role, content });
        }

        const fetchResponse = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${customApiKey}`
          },
          body: JSON.stringify({
            model: apiModel,
            messages: mappedMessages,
            temperature: 0.7
          })
        });

        if (!fetchResponse.ok) {
          const errText = await fetchResponse.text();
          throw new Error(`خطأ من ${provider}: ${fetchResponse.status} - ${errText}`);
        }

        const responseData = await fetchResponse.json();
        const responseText = responseData.choices?.[0]?.message?.content || "";
        return res.json({ success: true, text: responseText });
      } catch (err: any) {
        console.error(`${provider} API error:`, err);
        return res.status(500).json({ error: err.message || `فشل الاتصال بمزود الخدمة لـ ${provider}.` });
      }
    }

    // Custom Gemini provider with user's own key
    if (provider === "gemini-custom" || model === "gemini-custom") {
      if (!customApiKey) {
        return res.status(400).json({ error: "يرجى توفير أو حفظ مفتاح Gemini API المخصص الخاص بك." });
      }
      try {
        const aiClient = new GoogleGenAI({ apiKey: customApiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
        const response = await aiClient.models.generateContent({
          model: "gemini-2.5-flash",
          contents: messages,
          config: {
            systemInstruction: systemInstruction || "أنت مساعد ذكي ومتعاون وخبير برمجي شامل تجيب بدقة عالية.",
          }
        });
        return res.json({ success: true, text: response.text });
      } catch (error: any) {
        console.error("Custom Gemini error:", error);
        return res.status(500).json({ error: error.message || String(error) });
      }
    }
    
    // Pollinations free model handler
    if (model === "pollinations" || model === "free-chat") {
      try {
        // Map Gemini format to Pollinations messages format
        const mappedMessages = [];
        if (systemInstruction) {
          mappedMessages.push({ role: "system", content: systemInstruction });
        }
        for (const msg of messages) {
          const content = msg.parts?.[0]?.text || "";
          const role = msg.role === "model" ? "assistant" : "user";
          mappedMessages.push({ role, content });
        }

        const pollinationsResponse = await fetch("https://text.pollinations.ai/", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: mappedMessages,
            model: "openai-fast",
            seed: Math.floor(Math.random() * 1000000)
          })
        });

        if (!pollinationsResponse.ok) {
          const errorText = await pollinationsResponse.text();
          throw new Error(`خطأ من مزود الخدمة المجانية: ${pollinationsResponse.status} - ${errorText}`);
        }

        const responseText = await pollinationsResponse.text();
        return res.json({ success: true, text: responseText });
      } catch (err: any) {
        console.error("Pollinations chat error:", err);
        return res.status(500).json({ error: err.message || "حدث خطأ أثناء الاتصال بالوكيل المجاني." });
      }
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "مفتاح Gemini API غير متوفر في الإعدادات السحابية للتشغيل الفعلي." });
      }
      const aiClient = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
      
      const response = await aiClient.models.generateContent({
        model: model,
        contents: messages,
        config: {
          systemInstruction: systemInstruction || "أنت مساعد ذكي ومتعاون وخبير برمجي شامل تجيب بدقة عالية.",
        }
      });

      res.json({ success: true, text: response.text });
    } catch (error: any) {
      console.error("Chat error:", error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // API Endpoint: AI Music Studio (Using Lyria models)
  app.post("/api/generate-music", async (req, res) => {
    const { prompt, model = "lyria-3-clip-preview", referenceImage } = req.body;
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "مفتاح Gemini API غير متوفر لتوليد الموسيقى." });
      }
      const aiClient = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

      let contentsPayload: any = prompt;
      if (referenceImage) {
        const cleanBase64 = referenceImage.replace(/^data:image\/\w+;base64,/, "");
        contentsPayload = {
          parts: [
            { text: prompt },
            { inlineData: { data: cleanBase64, mimeType: "image/jpeg" } }
          ]
        };
      }

      const response = await aiClient.models.generateContentStream({
        model: model,
        contents: contentsPayload,
        config: {
          responseModalities: [Modality.AUDIO]
        }
      });

      let audioBase64 = "";
      let lyrics = "";
      let mimeType = "audio/wav";

      for await (const chunk of response) {
        const parts = chunk.candidates?.[0]?.content?.parts;
        if (!parts) continue;
        for (const part of parts) {
          if (part.inlineData?.data) {
            if (!audioBase64 && part.inlineData.mimeType) {
              mimeType = part.inlineData.mimeType;
            }
            audioBase64 += part.inlineData.data;
          }
          if (part.text && !lyrics) {
            lyrics = part.text;
          }
        }
      }

      res.json({
        success: true,
        audioBase64,
        mimeType,
        lyrics
      });
    } catch (error: any) {
      console.error("Music generation error:", error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // API Endpoint: AI Video/Movie Maker (Using Veo) - Start operation
  app.post("/api/generate-video", async (req, res) => {
    const { prompt, resolution = "720p", aspectRatio = "16:9", startingImage } = req.body;
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "مفتاح Gemini API غير متوفر لتوليد الفيديو." });
      }
      const aiClient = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

      const requestPayload: any = {
        model: 'veo-3.1-lite-generate-preview',
        prompt: prompt,
        config: {
          numberOfVideos: 1,
          resolution: resolution,
          aspectRatio: aspectRatio
        }
      };

      if (startingImage) {
        const cleanBase64 = startingImage.replace(/^data:image\/\w+;base64,/, "");
        requestPayload.image = {
          imageBytes: cleanBase64,
          mimeType: 'image/png'
        };
      }

      const operation = await aiClient.models.generateVideos(requestPayload);
      res.json({ success: true, operationName: operation.name });
    } catch (error: any) {
      console.error("Video creation starting error:", error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // API Endpoint: AI Video status polling
  app.post("/api/video-status", async (req, res) => {
    const { operationName } = req.body;
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "مفتاح Gemini API غير متوفر." });
      }
      const aiClient = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await aiClient.operations.getVideosOperation({ operation: op });
      
      res.json({ success: true, done: updated.done });
    } catch (error: any) {
      console.error("Video status polling error:", error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // API Endpoint: AI Video stream back (avoid exposing URL and API keys to client)
  app.post("/api/video-download", async (req, res) => {
    const { operationName } = req.body;
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "مفتاح Gemini API غير متوفر." });
      }
      const aiClient = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

      const op = new GenerateVideosOperation();
      op.name = operationName;
      const updated = await aiClient.operations.getVideosOperation({ operation: op });
      const uri = updated.response?.generatedVideos?.[0]?.video?.uri;

      if (!uri) {
        return res.status(404).json({ error: "لم يتم العثور على رابط تحميل الفيديو أو لم تكتمل العملية بعد." });
      }

      const videoRes = await fetch(uri, {
        headers: { 'x-goog-api-key': apiKey },
      });

      if (!videoRes.ok) {
        return res.status(500).json({ error: "فشل في تحميل الفيديو من خوادم جوجل." });
      }

      const arrayBuffer = await videoRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      
      res.setHeader('Content-Type', 'video/mp4');
      res.send(buffer);
    } catch (error: any) {
      console.error("Video download streaming error:", error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // API Endpoint: AI Art Generator (Imagen)
  app.post("/api/generate-image", async (req, res) => {
    const { prompt, aspectRatio = "1:1", imageSize = "1K", model } = req.body;

    // Pollinations free image generator handler (Flux model)
    if (model === "pollinations-image" || model === "free-image") {
      try {
        let width = 1024;
        let height = 1024;
        if (aspectRatio === "16:9") {
          width = 1024;
          height = 576;
        } else if (aspectRatio === "9:16") {
          width = 576;
          height = 1024;
        } else if (aspectRatio === "4:3") {
          width = 1024;
          height = 768;
        } else if (aspectRatio === "3:4") {
          width = 768;
          height = 1024;
        } else if (aspectRatio === "3:2") {
          width = 1024;
          height = 680;
        } else if (aspectRatio === "2:3") {
          width = 680;
          height = 1024;
        }

        const seed = Math.floor(Math.random() * 10000000);
        const encodedPrompt = encodeURIComponent(prompt);
        // Using flux as it is the most modern and beautiful image model on Pollinations
        const imageUrlUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&nologo=true&private=true&seed=${seed}`;

        const imgResponse = await fetch(imageUrlUrl);
        if (!imgResponse.ok) {
          throw new Error(`خطأ من مزود توليد الصور المجاني: ${imgResponse.statusText}`);
        }

        const arrayBuffer = await imgResponse.arrayBuffer();
        const base64EncodeString = Buffer.from(arrayBuffer).toString("base64");
        const imageUrl = `data:image/png;base64,${base64EncodeString}`;

        return res.json({ success: true, imageUrl, textResponse: "تم التوليد بنجاح بواسطة نموذج Flux المجاني تماماً." });
      } catch (err: any) {
        console.error("Pollinations image generation error:", err);
        return res.status(500).json({ error: err.message || "فشل توليد الصورة الفنية بواسطة الوكيل المجاني." });
      }
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "مفتاح Gemini API غير متوفر لتوليد الصور." });
      }
      const aiClient = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.1-flash-image',
        contents: {
          parts: [{ text: prompt }]
        },
        config: {
          imageConfig: {
            aspectRatio: aspectRatio,
            imageSize: imageSize
          }
        }
      });

      let imageUrl = "";
      let textResponse = "";

      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          imageUrl = `data:image/png;base64,${base64EncodeString}`;
        } else if (part.text) {
          textResponse = part.text;
        }
      }

      if (imageUrl) {
        res.json({ success: true, imageUrl, textResponse });
      } else {
        res.status(500).json({ error: "فشل العثور على الجزء الرسومي للصورة في الرد." });
      }
    } catch (error: any) {
      console.error("Image generation error:", error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // API Endpoint: AI Art Editor (Imagen Image editing)
  app.post("/api/edit-image", async (req, res) => {
    const { prompt, base64Image } = req.body;
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(400).json({ error: "مفتاح Gemini API غير متوفر لتعديل الصور." });
      }
      const aiClient = new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });

      const cleanBase64 = base64Image.replace(/^data:image\/\w+;base64,/, "");

      const response = await aiClient.models.generateContent({
        model: 'gemini-3.1-flash-lite-image',
        contents: {
          parts: [
            {
              inlineData: {
                data: cleanBase64,
                mimeType: 'image/png'
              }
            },
            {
              text: prompt
            }
          ]
        }
      });

      let imageUrl = "";
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          imageUrl = `data:image/png;base64,${base64EncodeString}`;
        }
      }

      if (imageUrl) {
        res.json({ success: true, imageUrl });
      } else {
        res.status(500).json({ error: "فشل في توليد النسخة المعدلة من الصورة." });
      }
    } catch (error: any) {
      console.error("Image edit error:", error);
      res.status(500).json({ error: error.message || String(error) });
    }
  });

  // Serve static UI assets or mount Vite dev server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
