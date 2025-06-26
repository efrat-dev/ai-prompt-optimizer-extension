export class DOMManager {
    constructor() {
      this.textareaSelectors = [
        'textarea[data-id="root"]',
        'textarea[placeholder*="Message"]',
        'textarea[placeholder*="הודעה"]',
        'div[contenteditable="true"]',
        'textarea'
      ];
    }
  
    findTextareaAndContainer() {
      let textarea = null;
      let container = null;
  
      for (const selector of this.textareaSelectors) {
        textarea = document.querySelector(selector);
        if (textarea) {
          const possibleContainers = [
            textarea.closest('form'),
            textarea.closest('div[class*="composer"]'),
            textarea.closest('div[class*="input"]'),
            textarea.parentElement,
            textarea.parentElement?.parentElement
          ];
  
          for (const cont of possibleContainers) {
            if (cont && cont.style.display !== 'none') {
              container = cont;
              break;
            }
          }
          break;
        }
      }
  
      if (!textarea) {
        console.error("❌ לא נמצאה תיבת טקסט");
        return { textarea: null, container: null };
      }
  
      if (!container) {
        console.warn("⚠️ לא נמצא קונטיינר מתאים, משתמש ב-body");
        container = document.body;
      }
  
      return { textarea, container };
    }
  
    getTextareaContent(textarea) {
      return textarea.value || textarea.textContent || "";
    }
  
    setTextareaContent(textarea, content) {
      if (textarea.tagName.toLowerCase() === 'textarea') {
        textarea.value = content;
      } else {
        textarea.textContent = content;
      }
      
      // מפעיל אירוע שינוי כדי שהאתר יזהה את השינוי
      const inputEvent = new Event('input', { bubbles: true });
      textarea.dispatchEvent(inputEvent);
      
      // מפעיל פוקוס על התיבה
      textarea.focus();
    }
  
    showSuccessNotification() {
      const successIndicator = document.createElement("div");
      successIndicator.innerText = "✅ Prompt Added!";
      successIndicator.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        padding: 8px 16px;
        background: #28a745;
        color: white;
        border-radius: 6px;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        animation: slideIn 0.3s ease;
      `;
      
      // הוספת אנימציה
      if (!document.querySelector('#success-animation-style')) {
        const style = document.createElement('style');
        style.id = 'success-animation-style';
        style.textContent = `
          @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `;
        document.head.appendChild(style);
      }
      
      document.body.appendChild(successIndicator);
      
      // הסרת ההודעה אחרי 3 שניות
      setTimeout(() => {
        successIndicator.remove();
      }, 3000);
    }
  }