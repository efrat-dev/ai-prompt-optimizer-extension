/**
 * Button styling and interaction utilities
 */
export class ButtonStyles {
    /**
     * Returns CSS styles for the optimize button
     */
    static getButtonStyles() {
      return `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        padding: 8px 16px;
        background: #10a37f;
        color: white;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        transition: all 0.2s ease;
      `;
    }
  
    /**
     * Apply hover effects to button element
     */
    static applyHoverEffects(button) {
      button.onmouseenter = () => {
        button.style.backgroundColor = "#0d8f6b";
        button.style.transform = "scale(1.05)";
      };
  
      button.onmouseleave = () => {
        button.style.backgroundColor = "#10a37f";
        button.style.transform = "scale(1)";
      };
    }
  
    /**
     * Toggle button loading state
     */
    static setLoadingState(button, isLoading = true) {
      if (isLoading) {
        button.disabled = true;
        button.innerText = "⏳ Processing...";
      } else {
        button.disabled = false;
        button.innerText = "⚙️ Optimize";
      }
    }
  }