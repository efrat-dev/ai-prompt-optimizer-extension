export class ModalManager {
    async showApiKeyModal() {
      return new Promise(async (resolve) => {
        try {
          // Load HTML template
          const templateUrl = chrome.runtime.getURL('templates/modal-template.html');
          const response = await fetch(templateUrl);
          const htmlContent = await response.text();
          
          // Create HTML parser
          const parser = new DOMParser();
          const doc = parser.parseFromString(htmlContent, 'text/html');
          const modalElement = doc.querySelector('.gpt-optimize-modal-overlay');
          
          // Add event listeners
          this.setupModalEventListeners(modalElement, resolve);
          
          // Add to page
          document.body.appendChild(modalElement);
          
          // Focus on input field
          setTimeout(() => {
            const input = modalElement.querySelector('.gpt-optimize-modal-input');
            input?.focus();
          }, 100);
          
        } catch (error) {
          console.error('Error loading modal:', error);
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
  
      // Save button
      saveBtn.onclick = () => {
        const apiKey = input.value.trim();
        if (!apiKey) {
          input.classList.add('error');
          input.focus();
          return;
        }
        closeModal(apiKey);
      };
  
      // Cancel button
      cancelBtn.onclick = () => closeModal();
  
      // Remove error during typing
      input.addEventListener('input', () => {
        input.classList.remove('error');
      });
  
      // Keyboard events
      const handleKeyPress = (e) => {
        if (e.key === 'Escape') {
          closeModal();
          document.removeEventListener('keydown', handleKeyPress);
        } else if (e.key === 'Enter' && e.target === input) {
          saveBtn.click();
        }
      };
      document.addEventListener('keydown', handleKeyPress);
  
      // Close by clicking background
      modalElement.onclick = (e) => {
        if (e.target === modalElement) {
          closeModal();
        }
      };
    }
  }