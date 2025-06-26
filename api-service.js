export class APIService {
    constructor() {
      this.temporaryApiKey = null; // Temporary storage for API key from modal
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
      // Optional: also save to storage for persistence
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
        // Fallback detection by length and format
        if (apiKey.length > 100 && apiKey.includes('-')) {
          return 'anthropic';
        }
        return 'openai'; // Default to OpenAI
      }
    }
  
    async getSystemPrompt() {
      try {
        const response = await fetch(chrome.runtime.getURL("prompt.md"));
        return await response.text();
      } catch (error) {
        console.warn("Failed to load prompt.md, using fallback");
        return "You are a professional assistant for improving prompts. Improve the following prompt to be clearer, more precise and effective:";
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
          model: "claude-3-haiku-20240307", // Fast and cost-effective model
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
  
      // Choose prompt: custom or default
      const systemPrompt = storageData.useCustom && storageData.customPrompt 
        ? storageData.customPrompt 
        : defaultPrompt;
  
      // Auto-detect API provider
      const provider = this.detectApiProvider(storageData.key);
      console.log(`🔍 Detected API provider: ${provider}`);
  
      let optimized;
      
      try {
        if (provider === 'anthropic') {
          optimized = await this.optimizePromptWithAnthropic(storageData.key, systemPrompt, input);
        } else {
          optimized = await this.optimizePromptWithOpenAI(storageData.key, systemPrompt, input);
        }
      } catch (error) {
        // Fallback: try the other provider if first one fails
        console.warn(`❌ Failed with ${provider}, attempting other provider...`);
        
        if (provider === 'anthropic') {
          optimized = await this.optimizePromptWithOpenAI(storageData.key, systemPrompt, input);
        } else {
          optimized = await this.optimizePromptWithAnthropic(storageData.key, systemPrompt, input);
        }
      }
  
      if (!optimized || !optimized.trim()) {
        throw new Error("No valid response received from API");
      }
  
      return optimized.trim();
    }
  
    // Helper function to validate API key
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