import { ButtonStyles } from './button-styles.js';

export class OptimizeButton {
  constructor(domManager, apiService) {
    this.domManager = domManager;
    this.apiService = apiService;
  }

  addButton() {
    try {
      const { textarea, container } = this.domManager.findTextareaAndContainer();
      
      if (!textarea) {
        return false;
      }

      // בדיקה אם הכפתור כבר קיים
      if (document.querySelector('#gpt-optimize-btn')) {
        return true;
      }

      const button = this.createButton();
      document.body.appendChild(button);
      return true;

    } catch (error) {
      console.error("❌ שגיאה בהוספת הכפתור:", error);
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
        alert("אנא הכנס טקסט לאופטימיזציה");
        return;
      }

      const input = this.domManager.getTextareaContent(textarea);
      if (!input.trim()) {
        alert("אנא הכנס טקסט לאופטימיזציה");
        return;
      }

      const optimized = await this.apiService.optimizePrompt(input);
      
      // שירשור הפרומפט המאופטמיזר לפני הטקסט המקורי
      const originalText = input.trim();
      const combinedText = optimized.trim() + "\n\n" + originalText;
      
      this.domManager.setTextareaContent(textarea, combinedText);
      this.domManager.showSuccessNotification();
      
      console.log("✅ פרומפט אופטימיזד התווסף לפני הטקסט המקורי");

    } catch (error) {
      console.error("❌ שגיאה:", error);
      
      if (error.message === "API_KEY_MISSING") {
        if (confirm("מפתח API לא נמצא. האם תרצה לפתוח את ההגדרות?")) {
          chrome.runtime.sendMessage({ action: "openOptions" });
        }
      } else {
        alert(`שגיאה: ${error.message}`);
      }
    } finally {
      ButtonStyles.setLoadingState(button, false);
    }
  }
}