import { APIProviders } from './api-providers.js';

/**
 * Main API service for handling prompt optimization across different LLM providers
 */
export class APIService {
    constructor() {
      this.temporaryApiKey = null; // Temporary storage for API key from modal
    }
  
    /**
     * Retrieve stored configuration data
     */
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
  
    /**
     * Store API key temporarily and optionally persist to storage
     */
    async setApiKey(apiKey) {
      this.temporaryApiKey = apiKey;
      return new Promise((resolve) => {
        chrome.storage.local.set({ openai_key: apiKey }, resolve);
      });
    }
  
    /**
     * Auto-detect API provider based on key format
     */
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
  
    /**
     * Load system prompt from file or use fallback
     */
    async getSystemPrompt() {
      try {
        const response = await fetch(chrome.runtime.getURL("prompt.md"));
        return await response.text();
      } catch (error) {
        console.warn("Failed to load prompt.md, using fallback");
        return "You are a professional assistant for improving prompts. Improve the following prompt to be clearer, more precise and effective:";
      }
    }
  
    /**
     * Main function to optimize user input prompt
     */
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
          optimized = await APIProviders.optimizePromptWithAnthropic(storageData.key, systemPrompt, input);
        } else {
          optimized = await APIProviders.optimizePromptWithOpenAI(storageData.key, systemPrompt, input);
        }
      } catch (error) {
        // Fallback: try the other provider if first one fails
        console.warn(`❌ Failed with ${provider}, attempting other provider...`);
        
        if (provider === 'anthropic') {
          optimized = await APIProviders.optimizePromptWithOpenAI(storageData.key, systemPrompt, input);
        } else {
          optimized = await APIProviders.optimizePromptWithAnthropic(storageData.key, systemPrompt, input);
        }
      }
  
      if (!optimized || !optimized.trim()) {
        throw new Error("No valid response received from API");
      }
  
      return optimized.trim();
    }
  
    /**
     * Validate API key by making a test request
     */
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