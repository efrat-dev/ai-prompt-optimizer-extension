import { ButtonStyles } from './button-styles.js';
import { ModalManager } from './modal-manager.js';

export class OptimizeButton {
  constructor(domManager, apiService) {
    this.domManager = domManager;
    this.apiService = apiService;
    this.modalManager = new ModalManager();
  }

  addButton() {
    try {
      const { textarea, container } = this.domManager.findTextareaAndContainer();
             
      if (!textarea) {
        return false;
      }

      // Check if button already exists
      if (document.querySelector('#gpt-optimize-btn')) {
        return true;
      }

      const button = this.createButton();
      document.body.appendChild(button);
      return true;
     
    } catch (error) {
      console.error("❌ Error adding button:", error);
      return false;
    }
  }

  createButton() {
    const button = document.createElement("button");
    button.id = "gpt-optimize-btn";
    button.innerText = "⚙️ Optimize";
    button.style.cssText = ButtonStyles.getButtonStyles();
         
    ButtonStyles.applyHoverEffects(button);
    button.onclick = () => this.handleOptimizeClick(button);
         
    return button;
  }

  async handleOptimizeClick(button) {
    try {
      ButtonStyles.setLoadingState(button, true);

      const { textarea } = this.domManager.findTextareaAndContainer();
      if (!textarea) {
        alert("Please enter text to optimize");
        return;
      }

      const input = this.domManager.getTextareaContent(textarea);
      if (!input.trim()) {
        alert("Please enter text to optimize");
        return;
      }

      const optimized = await this.apiService.optimizePrompt(input);
             
      // Concatenate optimized prompt before original text
      const originalText = input.trim();
      const combinedText = optimized.trim() + "\n\n" + originalText;
             
      this.domManager.setTextareaContent(textarea, combinedText);
      this.domManager.showSuccessNotification();
             
      console.log("✅ Optimized prompt added before original text");
     
    } catch (error) {
      console.error("❌ Error:", error);
             
      if (error.message === "API_KEY_MISSING") {
        const apiKey = await this.modalManager.showApiKeyModal();
        if (apiKey) {
          // Save key and retry
          await this.apiService.setApiKey(apiKey);
          // Automatic retry
          setTimeout(() => this.handleOptimizeClick(button), 500);
        }
      } else {
        alert(`Error: ${error.message}`);
      }
    } finally {
      ButtonStyles.setLoadingState(button, false);
    }
  }
}