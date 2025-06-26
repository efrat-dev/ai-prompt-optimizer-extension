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

  showApiKeyModal() {
    return new Promise((resolve) => {
      // יצירת הרקע הכהה
      const overlay = document.createElement('div');
      overlay.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.7);
        z-index: 10000;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      `;

      // יצירת החלון המרכזי
      const modal = document.createElement('div');
      modal.style.cssText = `
        background: white;
        border-radius: 12px;
        padding: 24px;
        width: 90%;
        max-width: 450px;
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
        position: relative;
        direction: rtl;
        text-align: right;
      `;

      modal.innerHTML = `
        <div style="margin-bottom: 20px;">
          <h3 style="margin: 0 0 8px 0; color: #333; font-size: 20px; font-weight: 600;">
            🔑 הזן מפתח API
          </h3>
          <p style="margin: 0; color: #666; font-size: 14px; line-height: 1.4;">
            כדי להשתמש בתוסף, יש צורך במפתח API של OpenAI או Anthropic
          </p>
        </div>

        <div style="margin-bottom: 20px;">
          <label style="display: block; margin-bottom: 6px; color: #333; font-weight: 500; font-size: 14px;">
            מפתח API:
          </label>
          <input 
            type="password" 
            id="api-key-input" 
            placeholder="הכנס את המפתח שלך..."
            style="
              width: 100%;
              padding: 12px;
              border: 2px solid #e1e5e9;
              border-radius: 8px;
              font-size: 14px;
              transition: border-color 0.2s;
              box-sizing: border-box;
            "
          />
        </div>

        <div style="margin-bottom: 20px;">
          <div style="background: #f8f9fa; padding: 12px; border-radius: 6px; font-size: 12px; color: #666;">
            💡 <strong>עצה:</strong> המפתח יישמר רק במפגש הנוכחי ולא יישלח לשום מקום חוץ מה-API הרשמי
          </div>
        </div>

        <div style="display: flex; gap: 10px; justify-content: flex-start;">
          <button 
            id="save-api-key" 
            style="
              background: #10a37f;
              color: white;
              border: none;
              padding: 10px 20px;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: background 0.2s;
            "
          >
            שמור והמשך
          </button>
          <button 
            id="cancel-api-key" 
            style="
              background: #f3f4f6;
              color: #374151;
              border: none;
              padding: 10px 20px;
              border-radius: 6px;
              font-size: 14px;
              font-weight: 500;
              cursor: pointer;
              transition: background 0.2s;
            "
          >
            ביטול
          </button>
        </div>
      `;

      // הוספת אפקטי hover
      const saveBtn = modal.querySelector('#save-api-key');
      const cancelBtn = modal.querySelector('#cancel-api-key');
      const input = modal.querySelector('#api-key-input');

      saveBtn.addEventListener('mouseenter', () => {
        saveBtn.style.background = '#0d8f6f';
      });
      saveBtn.addEventListener('mouseleave', () => {
        saveBtn.style.background = '#10a37f';
      });

      cancelBtn.addEventListener('mouseenter', () => {
        cancelBtn.style.background = '#e5e7eb';
      });
      cancelBtn.addEventListener('mouseleave', () => {
        cancelBtn.style.background = '#f3f4f6';
      });

      input.addEventListener('focus', () => {
        input.style.borderColor = '#10a37f';
        input.style.outline = 'none';
      });
      input.addEventListener('blur', () => {
        input.style.borderColor = '#e1e5e9';
      });

      // מתמחה באירועים
      const closeModal = (apiKey = null) => {
        document.body.removeChild(overlay);
        resolve(apiKey);
      };

      saveBtn.onclick = () => {
        const apiKey = input.value.trim();
        if (!apiKey) {
          input.style.borderColor = '#ef4444';
          input.focus();
          return;
        }
        closeModal(apiKey);
      };

      cancelBtn.onclick = () => closeModal();

      // סגירה עם ESC
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
      overlay.onclick = (e) => {
        if (e.target === overlay) {
          closeModal();
        }
      };

      overlay.appendChild(modal);
      document.body.appendChild(overlay);
      
      // מיקוד על השדה
      setTimeout(() => input.focus(), 100);
    });
  }
}