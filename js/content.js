/**
 * Content script initialization - sets up the optimize button and DOM monitoring
 */
(async () => {
  const { DOMManager } = await import('./dom-manager.js');
  const { OptimizeButton } = await import('./optimize-button.js');
  const { APIService } = await import('./api-service.js');
  
  const domManager = new DOMManager();
  const apiService = new APIService();
  const optimizeButton = new OptimizeButton(domManager, apiService);
  
  const maxAttempts = 5;
  let attempts = 0;

  /**
   * Attempts to add the optimize button with retry logic
   */
  const tryAddButton = () => {
    attempts++;
    if (optimizeButton.addButton()) {
      return;
    }
    if (attempts < maxAttempts) {
      setTimeout(tryAddButton, 2000); // Retry every 2 seconds
    } else {
      console.error("Failed to add button after all attempts");
    }
  };

  // Initial delay to ensure page is loaded
  setTimeout(tryAddButton, 1000);

  // Watch for DOM changes and re-add button if removed
  const observer = new MutationObserver(() => {
    if (!document.querySelector('#gpt-optimize-btn')) {
      setTimeout(tryAddButton, 1000);
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
})();