# 🔧 Advanced Usage & Development Guide

**← [Getting Started](GETTING-STARTED.md)** | **[Technical Architecture](ARCHITECTURE.md)** | **[Main README](../README.md)**

This guide covers advanced usage, customization, development, and troubleshooting for the AI Prompt Optimizer Chrome extension.

## 📚 Advanced Usage

### API Provider Auto-Detection

The extension automatically detects your API provider based on key format:

- **OpenAI Keys**: Start with `sk-proj-` or `sk-`
- **Anthropic Keys**: Start with `sk-ant-`

If the primary provider fails, the extension automatically attempts the alternative provider as a fallback.

```javascript
// Example key detection logic
if (apiKey.startsWith('sk-ant-')) {
  provider = 'anthropic';
} else if (apiKey.startsWith('sk-')) {
  provider = 'openai';
}
```

## 🔍 Troubleshooting

### Debug Mode

Enable detailed logging by opening browser console (F12) and setting:

```javascript
// Enable debug mode
localStorage.setItem('ai_optimizer_debug', 'true');

// View debug logs
console.log('[AI Optimizer Debug] Enabled');
```

Look for messages prefixed with:
- `✅` - Success operations
- `❌` - Error conditions  
- `⚠️` - Warning conditions
- `🔍` - Debug information

## 🛠️ Development & Customization

### Development Environment Setup

1. **Clone Repository**
   ```bash
   git clone https://github.com/your-username/ai-prompt-optimizer-extension.git
   cd ai-prompt-optimizer-extension
   ```

2. **Install Development Tools**
   ```bash
   # Optional: Use local HTTP server for testing
   npm install -g http-server
   
   # Install development dependencies
   npm install --dev
   ```

3. **Load in Chrome**
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode"
   - Click "Load unpacked" and select extension directory

4. **Development Workflow**
   ```bash
   # Watch for file changes
   npm run watch
   
   # Build for production
   npm run build
   
   # Run tests
   npm test
   ```

### Project Architecture

```
ai-prompt-optimizer-extension/
├── manifest.json              # Extension configuration
├── README.md                  # Main documentation
├── prompt.md                  # System prompt template
├── docs/
│   ├── GETTING-STARTED.md     # Installation guide
│   ├── ADVANCED.md            # Advanced usage guide
│   ├── ARCHITECTURE.md        # System design overview
│   └── screenshots/           # Documentation images
│       ├── openai-integration.png
│       ├── optimize-button.png
│       └── ...
├── js/
│   ├── content.js             # Content script entry point
│   ├── api-service.js         # API communication
│   ├── dom-manager.js         # DOM manipulation
│   ├── optimize-button.js     # Button functionality
│   ├── modal-manager.js       # Modal dialogs
│   ├── notification-manager.js# User notifications
│   ├── api-providers.js       # API provider implementations
│   ├── button-styles.js       # Button styling
│   └── settings.js            # Settings page logic
├── css/
│   ├── modal-styles.css       # Modal dialog styles
│   └── notifications.css      # Notification styles
├── templates/
│   └── modal-template.html    # API key modal template
└── assets/
    ├── icon-16.png            # Extension icons
    ├── icon-48.png
    └── icon-128.png
```

### Adding New Websites

To support additional AI chat websites:

1. **Update Manifest**
   ```json
   {
     "content_scripts": [
       {
         "matches": [
           "https://chatgpt.com/*",
           "https://chat.openai.com/*",
           "https://claude.ai/*",
           "https://your-new-site.com/*"
         ],
         "js": ["js/content.js"],
         "css": ["css/modal-styles.css", "css/notifications.css"]
       }
     ]
   }
   ```

2. **Add Site-Specific DOM Selectors**
   ```javascript
   // In dom-manager.js
   const siteSelectors = {
     'chatgpt.com': {
       textarea: 'textarea[data-id="root"]',
       container: '[data-testid="conversation-turn-3"]'
     },
     'your-new-site.com': {
       textarea: '#chat-input',
       container: '.chat-container'
     }
   };
   ```

3. **Test Integration**
   ```javascript
   // Add site-specific tests
   const testSite = async (domain) => {
     const selectors = siteSelectors[domain];
     const textarea = document.querySelector(selectors.textarea);
     return !!textarea;
   };
   ```

### Customizing Button Appearance

Modify button styling in `js/button-styles.js`:

```javascript
export class ButtonStyles {
  static getButtonStyles() {
    return `
      position: fixed;
      bottom: 20px;
      right: 20px;
      padding: 12px 18px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      z-index: 10000;
      backdrop-filter: blur(10px);
    `;
  }
  
  static getHoverStyles() {
    return `
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
    `;
  }
}
```

### Adding New API Providers

Extend support for additional AI services:

1. **Add Provider Class**
   ```javascript
   // In api-providers.js
   export class NewProviderAPI {
     static async optimizePrompt(apiKey, systemPrompt, userInput) {
       const response = await fetch('https://api.newprovider.com/v1/optimize', {
         method: 'POST',
         headers: {
           'Authorization': `Bearer ${apiKey}`,
           'Content-Type': 'application/json'
         },
         body: JSON.stringify({
           system: systemPrompt,
           user: userInput,
           max_tokens: 150
         })
       });
       
       if (!response.ok) {
         throw new Error(`API Error: ${response.status}`);
       }
       
       const data = await response.json();
       return data.system_prompt;
     }
     
     static detectApiKey(apiKey) {
       return apiKey.startsWith('np-') && apiKey.length > 32;
     }
   }
   ```

2. **Register Provider**
   ```javascript
   // In api-service.js
   import { NewProviderAPI } from './api-providers.js';
   
   const providers = {
     openai: OpenAIAPI,
     anthropic: AnthropicAPI,
     newprovider: NewProviderAPI
   };
   ```

### Custom Notification System

Create custom notification styles:

```css
/* In css/notifications.css */
.ai-optimizer-notification.custom {
  background: linear-gradient(135deg, #ff6b6b, #ee5a24);
  border-left: 4px solid #fff;
  animation: slideInCustom 0.5s ease-out;
}

@keyframes slideInCustom {
  from {
    transform: translateX(100%) rotateY(-90deg);
    opacity: 0;
  }
  to {
    transform: translateX(0) rotateY(0);
    opacity: 1;
  }
}
```

### Advanced API Integration

#### Custom Headers & Authentication

```javascript
// Advanced API configuration
const apiConfig = {
  openai: {
    baseURL: 'https://api.openai.com/v1',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'User-Agent': 'AI-Prompt-Optimizer/1.0'
    }
  },
  anthropic: {
    baseURL: 'https://api.anthropic.com/v1',
    headers: {
      'x-api-key': apiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01'
    }
  }
};
```

## 🤝 Contributing

### Development Guidelines

1. **Code Style**
   - Use ES6+ features
   - Follow consistent naming conventions
   - Add JSDoc comments for functions
   - Use async/await instead of promises

2. **Testing**
   ```javascript
   // Example test structure
   describe('API Service', () => {
     test('should optimize prompt correctly', async () => {
       const result = await apiService.optimizePrompt('test prompt');
       expect(result).toContain('system_prompt');
     });
   });
   ```

3. **Documentation**
   - Update README files for new features
   - Add inline comments for complex logic
   - Include usage examples
   - Update screenshots when UI changes

### Submitting Changes

1. **Fork & Branch**
   ```bash
   git checkout -b feature/new-feature
   ```

2. **Make Changes**
   - Follow existing code patterns
   - Test thoroughly on multiple websites
   - Update documentation

3. **Submit Pull Request**
   - Clear description of changes
   - Include screenshots for UI changes
   - Reference related issues
   - Add tests if applicable

### Reporting Issues

Include in bug reports:
- Browser version and OS
- Extension version
- Steps to reproduce
- Console error messages
- Screenshots if relevant

## 🚀 Deployment

### Building for Production

```bash
# Clean build directory
rm -rf dist/

# Create production build
npm run build

# Validate manifest
npm run validate-manifest

# Create zip package
npm run package
```

## 📋 API Reference

### Core Classes

#### APIService
```javascript
class APIService {
  // Initialize service
  constructor();
  
  // Optimize a prompt
  async optimizePrompt(userInput: string): Promise<string>;
  
  // Set API key
  async setApiKey(apiKey: string): Promise<void>;
  
  // Validate API key
  async validateApiKey(apiKey: string): Promise<boolean>;
  
  // Detect API provider
  detectProvider(apiKey: string): string;
}
```

#### DOMManager
```javascript
class DOMManager {
  // Find textarea and container
  findTextareaAndContainer(): {textarea: HTMLElement, container: HTMLElement};
  
  // Get/set textarea content
  getTextareaContent(textarea: HTMLElement): string;
  setTextareaContent(textarea: HTMLElement, content: string): void;
  
  // Show notifications
  showSuccessNotification(message: string): void;
  showErrorNotification(message: string): void;
  showWarningNotification(message: string): void;
}
```

#### OptimizeButton
```javascript
class OptimizeButton {
  // Add button to page
  addButton(): boolean;
  
  // Handle optimization
  async handleOptimizeClick(buttonElement: HTMLElement): Promise<void>;
  
  // Update button state
  setButtonState(state: 'normal' | 'loading' | 'success' | 'error'): void;
}
```

### Configuration Options

```javascript
// Extension configuration
const config = {
  // API settings
  api: {
    timeout: 30000,
    retries: 3,
    defaultProvider: 'auto'
  },
  
  // UI settings
  ui: {
    buttonPosition: 'bottom-right',
    notificationDuration: 5000,
    animationSpeed: 300
  },
  
  // Feature flags
  features: {
    caching: true,
    analytics: false,
    debugging: false
  }
};
```

## 🏆 Best Practices

### Code Quality
- Use TypeScript for better type safety
- Implement comprehensive error handling
- Follow Chrome extension security guidelines
- Write maintainable, documented code

### User Experience
- Keep interactions simple and intuitive
- Provide clear feedback for all actions
- Respect user preferences and privacy
- Optimize for performance

### Security
- Minimize required permissions
- Validate all inputs and outputs
- Use secure communication protocols
- Regular security audits

## 📚 Resources

### Documentation
- [Chrome Extension API](https://developer.chrome.com/docs/extensions/reference/)
- [OpenAI API Documentation](https://platform.openai.com/docs/api-reference)
- [Anthropic API Documentation](https://docs.anthropic.com/claude/reference/)

### Tools & Libraries
- [Puppeteer](https://pptr.dev/) - Testing automation
- [Jest](https://jestjs.io/) - JavaScript testing
- [ESLint](https://eslint.org/) - Code linting
- [Prettier](https://prettier.io/) - Code formatting

---

**🔧 Happy Developing!**

**← [Getting Started](GETTING-STARTED.md)** | **[Technical Architecture](ARCHITECTURE.md)** | **[Main README](../README.md)**
