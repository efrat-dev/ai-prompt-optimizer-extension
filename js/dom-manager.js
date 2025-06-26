import { NotificationManager } from './notification-manager.js';

export class DOMManager {
  constructor() {
    // Common textarea selectors for different chat interfaces
    this.textareaSelectors = [
      'textarea[data-id="root"]',
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="הודעה"]',
      'div[contenteditable="true"]',
      'textarea'
    ];
    
    // Initialize notification manager
    this.notificationManager = new NotificationManager();
  }

  findTextareaAndContainer() {
    let textarea = null;
    let container = null;

    // Search for textarea using selectors
    for (const selector of this.textareaSelectors) {
      textarea = document.querySelector(selector);
      if (textarea) {
        // Find appropriate container for the textarea
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
      console.error("❌ Textarea not found");
      return { textarea: null, container: null };
    }

    if (!container) {
      console.warn("⚠️ No suitable container found, using body");
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
    
    // Trigger input event so the website detects the change
    const inputEvent = new Event('input', { bubbles: true });
    textarea.dispatchEvent(inputEvent);
    
    // Focus on the textarea
    textarea.focus();
  }

  // Notification methods
  showSuccessNotification(message = "✅ Prompt Added!") {
    return this.notificationManager.showSuccess(message);
  }

  showErrorNotification(message = "❌ Error occurred!") {
    return this.notificationManager.showError(message);
  }

  showWarningNotification(message = "⚠️ Warning!") {
    return this.notificationManager.showWarning(message);
  }

  showInfoNotification(message = "ℹ️ Information") {
    return this.notificationManager.showInfo(message);
  }

  // Backward compatibility method
  showNotification(message, type = 'success', duration = 3000) {
    return this.notificationManager.showNotification(message, type, duration);
  }

  clearNotifications() {
    return this.notificationManager.clearAll();
  }

  // Additional convenience methods
  showLoadingNotification(message = "⏳ Loading...") {
    return this.notificationManager.showPersistent(message, 'info');
  }

  showApiKeyMissingNotification() {
    return this.notificationManager.showWarning("🔑 API key required", 5000);
  }

  showOptimizationCompleteNotification() {
    return this.notificationManager.showSuccess("🚀 Optimization completed!", 4000);
  }
}