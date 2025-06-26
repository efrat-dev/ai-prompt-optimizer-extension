export class NotificationManager {
    constructor() {
      this.notifications = new Set();
      this.cssInjected = false;
    }
    
    // Inject CSS only once
    injectCSS() {
      if (this.cssInjected) return;
      
      const cssUrl = chrome.runtime.getURL('css/notifications.css');
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = cssUrl;
      document.head.appendChild(link);
      
      this.cssInjected = true;
    }
    
    showNotification(message, type = 'success', duration = 3000) {
      this.injectCSS();
      
      const notification = this.createNotification(message, type);
      this.addNotification(notification);
      
      // Auto-close notification
      if (duration > 0) {
        setTimeout(() => {
          this.closeNotification(notification);
        }, duration);
      }
      
      return notification;
    }
    
    createNotification(message, type) {
      const notification = document.createElement('div');
      notification.className = `gpt-optimize-notification gpt-optimize-notification--${type}`;
      notification.textContent = message;
      
      // Close on click
      notification.addEventListener('click', () => {
        this.closeNotification(notification);
      });
      
      return notification;
    }
    
    addNotification(notification) {
      // Update existing notification positions
      this.updateNotificationPositions();
      
      document.body.appendChild(notification);
      this.notifications.add(notification);
    }
    
    closeNotification(notification) {
      if (!this.notifications.has(notification)) return;
      
      return new Promise((resolve) => {
        notification.classList.add('gpt-optimize-notification--closing');
        
        setTimeout(() => {
          if (notification.parentNode) {
            notification.remove();
          }
          this.notifications.delete(notification);
          this.updateNotificationPositions();
          resolve();
        }, 300);
      });
    }
    
    updateNotificationPositions() {
      const activeNotifications = Array.from(this.notifications);
      activeNotifications.forEach((notification, index) => {
        if (notification.parentNode) {
          notification.style.setProperty('--notification-index', index.toString());
        }
      });
    }
    
    clearAll() {
      const promises = Array.from(this.notifications).map(notification =>
        this.closeNotification(notification)
      );
      return Promise.all(promises);
    }
    
    // Convenience methods
    showSuccess(message, duration = 3000) {
      return this.showNotification(message, 'success', duration);
    }
    
    showError(message, duration = 5000) {
      return this.showNotification(message, 'error', duration);
    }
    
    showWarning(message, duration = 4000) {
      return this.showNotification(message, 'warning', duration);
    }
    
    showInfo(message, duration = 3000) {
      return this.showNotification(message, 'info', duration);
    }
    
    // Notification that doesn't auto-close
    showPersistent(message, type = 'info') {
      return this.showNotification(message, type, 0);
    }
  }