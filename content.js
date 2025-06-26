(async () => {
  const { DOMManager } = await import('./dom-manager.js');
  const { OptimizeButton } = await import('./optimize-button.js');
  const { APIService } = await import('./api-service.js');
  
  const domManager = new DOMManager();
  const apiService = new APIService();
  const optimizeButton = new OptimizeButton(domManager, apiService);
  
  const maxAttempts = 5;
  let attempts = 0;

  const tryAddButton = () => {
    attempts++;
    if (optimizeButton.addButton()) {
      console.log("🎉 התוסף הופעל בהצלחה!");
      return;
    }
    if (attempts < maxAttempts) {
      setTimeout(tryAddButton, 2000);
    } else {
      console.error("❌ נכשל בהוספת הכפתור אחרי כל הניסיונות");
    }
  };

  setTimeout(tryAddButton, 1000);

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