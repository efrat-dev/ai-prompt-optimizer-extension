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
        const apiKey = await this.showApiKeyModal();
        if (apiKey) {
          // שמירת המפתח ונסיון חוזר
          await this.apiService.setApiKey(apiKey);
          // נסיון חוזר באופן אוטומטי
          setTimeout(() => this.handleOptimizeClick(button), 500);
        }
      } else {
        alert(`שגיאה: ${error.message}`);
      }
    } finally {
      ButtonStyles.setLoadingState(button, false);
    }
  }

  async showApiKeyModal() {
    return new Promise(async (resolve) => {
      try {
        // טעינת תבנית ה-HTML
        const templateUrl = chrome.runtime.getURL('templates/modal-template.html');
        const response = await fetch(templateUrl);
        const htmlContent = await response.text();
        
        // יצירת parser לHTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlContent, 'text/html');
        const modalElement = doc.querySelector('.gpt-optimize-modal-overlay');
        
        // הוספת event listeners
        this.setupModalEventListeners(modalElement, resolve);
        
        // הוספה לדף
        document.body.appendChild(modalElement);
        
        // מיקוד על השדה
        setTimeout(() => {
          const input = modalElement.querySelector('.gpt-optimize-modal-input');
          input?.focus();
        }, 100);
        
      } catch (error) {
        console.error('שגיאה בטעינת המודל:', error);
        resolve(null);
      }
    });
  }

  setupModalEventListeners(modalElement, resolve) {
    const input = modalElement.querySelector('.gpt-optimize-modal-input');
    const saveBtn = modalElement.querySelector('.gpt-optimize-modal-btn-primary');
    const cancelBtn = modalElement.querySelector('.gpt-optimize-modal-btn-secondary');

    const closeModal = (apiKey = null) => {
      if (modalElement.parentNode) {
        document.body.removeChild(modalElement);
      }
      resolve(apiKey);
    };

    // לחצן שמירה
    saveBtn.onclick = () => {
      const apiKey = input.value.trim();
      if (!apiKey) {
        input.classList.add('error');
        input.focus();
        return;
      }
      closeModal(apiKey);
    };

    // לחצן ביטול
    cancelBtn.onclick = () => closeModal();

    // הסרת שגיאה בזמן הקלדה
    input.addEventListener('input', () => {
      input.classList.remove('error');
    });

    // אירועי מקלדת
    const handleKeyPress = (e) => {
      if (e.key === 'Escape') {
        closeModal();
        document.removeEventListener('keydown', handleKeyPress);
      } else if (e.key === 'Enter' && e.target === input) {
        saveBtn.click();
      }
    };
    document.addEventListener('keydown', handleKeyPress);

    // סגירה עם לחיצה על הרקע
    modalElement.onclick = (e) => {
      if (e.target === modalElement) {
        closeModal();
      }
    };
  }
 }