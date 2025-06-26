export class APIService {
    async getStorageData() {
      return new Promise((resolve) => {
        chrome.storage.local.get(["openai_key", "custom_system_prompt", "use_custom_prompt"], (result) => {
          resolve({
            key: result.openai_key,
            customPrompt: result.custom_system_prompt,
            useCustom: result.use_custom_prompt
          });
        });
      });
    }
  
    async getSystemPrompt() {
      try {
        const response = await fetch(chrome.runtime.getURL("prompt.md"));
        return await response.text();
      } catch (error) {
        console.warn("Failed to load prompt.md, using fallback");
        return "אתה עוזר מקצועי לשיפור פרומפטים. שפר את הפרומפט הבא:";
      }
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
  
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${storageData.key}`,
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
        throw new Error(`API Error: ${response.status}`);
      }
  
      const data = await response.json();
      const optimized = data.choices?.[0]?.message?.content;
  
      if (!optimized) {
        throw new Error("לא התקבלה תשובה תקינה מה-API");
      }
  
      return optimized;
    }
  }