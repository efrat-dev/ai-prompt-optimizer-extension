export class APIService {
    constructor() {
      this.temporaryApiKey = null; // לשמירה זמנית של מפתח מהמודאל
    }
  
    async getStorageData() {
      return new Promise((resolve) => {
        chrome.storage.local.get(["openai_key", "custom_system_prompt", "use_custom_prompt"], (result) => {
          resolve({
            key: result.openai_key || this.temporaryApiKey,
            customPrompt: result.custom_system_prompt,
            useCustom: result.use_custom_prompt
          });
        });
      });
    }
  
    async setApiKey(apiKey) {
      this.temporaryApiKey = apiKey;
      // אופציונלי: לשמור גם ב-storage
      return new Promise((resolve) => {
        chrome.storage.local.set({ openai_key: apiKey }, resolve);
      });
    }
  
    detectApiProvider(apiKey) {
      if (apiKey.startsWith('sk-ant-')) {
        return 'anthropic';
      } else if (apiKey.startsWith('sk-')) {
        return 'openai';
      } else {
        // ניחוש לפי אורך ופורמט
        if (apiKey.length > 100 && apiKey.includes('-')) {
          return 'anthropic';
        }
        return 'openai'; // ברירת מחדל
      }
    }
  
    async getSystemPrompt() {
      try {
        const response = await fetch(chrome.runtime.getURL("prompt.md"));
        return await response.text();
      } catch (error) {
        console.warn("Failed to load prompt.md, using fallback");
        return "אתה עוזר מקצועי לשיפור פרומפטים. שפר את הפרומפט הבא כך שיהיה יותר ברור, מדויק ויעיל:";
      }
    }
  
    async optimizePromptWithOpenAI(apiKey, systemPrompt, input) {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input }
          ],
          max_tokens: 1000,
          temperature: 0.1
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
  
      const data = await response.json();
      return data.choices?.[0]?.message?.content;
    }
  
    async optimizePromptWithAnthropic(apiKey, systemPrompt, input) {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "anthropic-version": "2023-06-01"
        },
        body: JSON.stringify({
          model: "claude-3-haiku-20240307", // מודל זול ומהיר
          max_tokens: 1000,
          temperature: 0.1,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: input
            }
          ]
        })
      });
  
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Anthropic API Error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
  
      const data = await response.json();
      return data.content?.[0]?.text;
    }
  
    async optimizePrompt(input) {
      const [storageData, defaultPrompt] = await Promise.all([
        this.getStorageData(),
        this.getSystemPrompt()
      ]);
  
      if (!storageData.key) {
        throw new Error("API_KEY_MISSING");
      }
  
      // בחירת הפרומפט - מותאם אישית או ברירת מחדל
      const systemPrompt = storageData.useCustom && storageData.customPrompt 
        ? storageData.customPrompt 
        : defaultPrompt;
  
      // זיהוי ספק ה-API
      const provider = this.detectApiProvider(storageData.key);
      console.log(`🔍 זוהה ספק API: ${provider}`);
  
      let optimized;
      
      try {
        if (provider === 'anthropic') {
          optimized = await this.optimizePromptWithAnthropic(storageData.key, systemPrompt, input);
        } else {
          optimized = await this.optimizePromptWithOpenAI(storageData.key, systemPrompt, input);
        }
      } catch (error) {
        // אם נכשל עם ספק אחד, ננסה את השני
        console.warn(`❌ נכשל עם ${provider}, מנסה ספק אחר...`);
        
        if (provider === 'anthropic') {
          optimized = await this.optimizePromptWithOpenAI(storageData.key, systemPrompt, input);
        } else {
          optimized = await this.optimizePromptWithAnthropic(storageData.key, systemPrompt, input);
        }
      }
  
      if (!optimized || !optimized.trim()) {
        throw new Error("לא התקבלה תשובה תקינה מה-API");
      }
  
      return optimized.trim();
    }
  
    // פונקציה עזר לבדיקת תקינות המפתח
    async validateApiKey(apiKey) {
      const provider = this.detectApiProvider(apiKey);
      
      try {
        if (provider === 'anthropic') {
          const response = await fetch("https://api.anthropic.com/v1/messages", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json",
              "anthropic-version": "2023-06-01"
            },
            body: JSON.stringify({
              model: "claude-3-haiku-20240307",
              max_tokens: 10,
              messages: [{ role: "user", content: "test" }]
            })
          });
          return response.ok;
        } else {
          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${apiKey}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [{ role: "user", content: "test" }],
              max_tokens: 1
            })
          });
          return response.ok;
        }
      } catch (error) {
        return false;
      }
    }
  }