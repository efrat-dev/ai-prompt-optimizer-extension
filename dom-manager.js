import { NotificationManager } from './notification-manager.js';

export class DOMManager {
  constructor() {
    this.textareaSelectors = [
      'textarea[data-id="root"]',
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="הודעה"]',
      'div[contenteditable="true"]',
      'textarea'
    ];
    
    // יצירת מנהל התזכורות
    this.notificationManager = new NotificationManager();
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

  // שיטות התזכורות החדשות
  showSuccessNotification(message = "✅ Prompt Added!") {
    return this.notificationManager.showSuccess(message);
  }

  showErrorNotification(message = "❌ שגיאה התרחשה!") {
    return this.notificationManager.showError(message);
  }

  showWarningNotification(message = "⚠️ אזהרה!") {
    return this.notificationManager.showWarning(message);
  }

  showInfoNotification(message = "ℹ️ מידע") {
    return this.notificationManager.showInfo(message);
  }

  // התאמה לגרסה הישנה
  showNotification(message, type = 'success', duration = 3000) {
    return this.notificationManager.showNotification(message, type, duration);
  }

  clearNotifications() {
    return this.notificationManager.clearAll();
  }

  // שיטות נוספות לנוחות
  showLoadingNotification(message = "⏳ טוען...") {
    return this.notificationManager.showPersistent(message, 'info');
  }

  showApiKeyMissingNotification() {
    return this.notificationManager.showWarning("🔑 נדרש מפתח API", 5000);
  }

  showOptimizationCompleteNotification() {
    return this.notificationManager.showSuccess("🚀 האופטימיזציה הושלמה!", 4000);
  }
}