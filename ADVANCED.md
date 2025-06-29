# 🔧 Advanced Usage & Development Guide

**← [Getting Started](GETTING-STARTED.md)** | **[Main README](README.md)**

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

### Multiple API Keys

The extension supports switching between different API keys:

1. **Session Management**: Keys are stored only for the current session
2. **Provider Switching**: Automatically detects provider changes
3. **Fallback System**: Tries alternative providers if primary fails

```javascript
// Clear current session
sessionStorage.removeItem('ai_optimizer_api_key');
// Refresh page to reset
location.reload();
```

### Advanced Configuration

Create custom configurations for different use cases:

```javascript
// Custom configurations
const configs = {
  technical: {
    maxTokens: 80,
    temperature: 0.1,
    systemPrompt: "You are a technical expert..."
  },
  creative: {
    maxTokens: 120,
    temperature: 0.7,
    systemPrompt: "You are a creative writing assistant..."
  }
};
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

### Common Issues & Solutions

#### Extension Button Not Appearing

```javascript
// Check if content script loaded
console.log('Content script loaded:', !!window.aiOptimizerLoaded);

// Manually trigger button creation
if (window.aiOptimizer) {
  window.aiOptimizer.addButton();
}
```

**Solutions:**
- Ensure you're on a supported website
- Check extension permissions in `chrome://extensions/`
- Verify content script injection
- Try hard refresh (Ctrl+F5)

#### API Authentication Errors

```
Error: OpenAI API Error: 401 - Invalid API key provided
Error: Anthropic API Error: 403 - Permission denied
```

**Diagnostic Steps:**
```javascript
// Test API key format
const isValidOpenAI = apiKey.startsWith('sk-') && apiKey.length > 40;
const isValidAnthropic = apiKey.startsWith('sk-ant-') && apiKey.length > 50;

// Test API connection
fetch('https://api.openai.com/v1/models', {
  headers: { 'Authorization': `Bearer ${apiKey}` }
})
.then(response => console.log('API Status:', response.status));
```

#### DOM Manipulation Issues

```javascript
// Check for textarea elements
const textareas = document.querySelectorAll('textarea');
console.log('Found textareas:', textareas.length);

// Verify DOM structure
const container = document.querySelector('[data-testid="conversation-turn-3"]');
console.log('Chat container:', container);
```

### Performance Optimization

#### Reducing API Costs

```javascript
// Implement request debouncing
const debouncedOptimize = debounce(async (prompt) => {
  return await apiService.optimizePrompt(prompt);
}, 1000);

// Cache common optimizations
const promptCache = new Map();
if (promptCache.has(prompt)) {
  return promptCache.get(prompt);
}
```

#### Memory Management

```javascript
// Clear session data periodically
setInterval(() => {
  if (sessionStorage.length > 10) {
    sessionStorage.clear();
  }
}, 300000); // 5 minutes
```

### Network Issues

#### Proxy & Firewall Problems

```javascript
// Test connectivity
const testConnection = async () => {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      method: 'HEAD',
      headers: { 'Authorization': `Bearer ${apiKey}` }
    });
    console.log('Connection test:', response.status);
  } catch (error) {
    console.error('Network error:', error);
  }
};
```

#### Rate Limiting

```javascript
// Implement exponential backoff
const retryWithBackoff = async (fn, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) {
        const delay = Math.pow(2, i) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw error;
    }
  }
};
```

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
├── README.md                 # Main documentation
├── GETTING-STARTED.md        # Installation guide
├── ADVANCED.md               # This file
├── prompt.md                 # System prompt template
├── js/
│   ├── content.js           # Content script entry point
│   ├── api-service.js       # API communication
│   ├── dom-manager.js       # DOM manipulation
│   ├── optimize-button.js   # Button functionality
│   ├── modal-manager.js     # Modal dialogs
│   ├── notification-manager.js # User notifications
│   ├── api-providers.js     # API provider implementations
│   ├── button-styles.js     # Button styling
│   └── settings.js          # Settings page logic
├── css/
│   ├── modal-styles.css     # Modal dialog styles
│   └── notifications.css    # Notification styles
├── templates/
│   └── modal-template.html  # API key modal template
├── screenshots/             # Documentation images
└── assets/
    ├── icon-16.png         # Extension icons
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

#### Response Processing

```javascript
// Advanced response handling
const processResponse = (response, provider) => {
  switch (provider) {
    case 'openai':
      return response.choices[0].message.content;
    case 'anthropic':
      return response.content[0].text;
    default:
      throw new Error(`Unknown provider: ${provider}`);
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

## 📊 Analytics & Monitoring

### Usage Tracking

```javascript
// Optional usage analytics (privacy-focused)
const trackUsage = (event, data) => {
  if (localStorage.getItem('analytics_enabled') === 'true') {
    console.log(`Analytics: ${event}`, data);
    // Send to analytics service
  }
};

// Track optimization events
trackUsage('prompt_optimized', {
  provider: 'openai',
  length: prompt.length,
  website: window.location.hostname
});
```

### Performance Monitoring

```javascript
// Performance tracking
const performanceTracker = {
  start: (operation) => {
    performance.mark(`${operation}-start`);
  },
  
  end: (operation) => {
    performance.mark(`${operation}-end`);
    performance.measure(operation, `${operation}-start`, `${operation}-end`);
    const measure = performance.getEntriesByName(operation)[0];
    console.log(`${operation} took ${measure.duration}ms`);
  }
};
```

## 🔒 Security Considerations

### API Key Security

```javascript
// Secure key storage
const secureStorage = {
  setKey: (key) => {
    // Encrypt key before storage
    const encrypted = btoa(key); // Basic example
    sessionStorage.setItem('ai_optimizer_api_key', encrypted);
  },
  
  getKey: () => {
    const encrypted = sessionStorage.getItem('ai_optimizer_api_key');
    return encrypted ? atob(encrypted) : null;
  }
};
```

### Content Security Policy

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self';"
  }
}
```

### Input Sanitization

```javascript
// Sanitize user inputs
const sanitizeInput = (input) => {
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .trim();
};

// Validate API responses
const validateResponse = (response) => {
  if (typeof response !== 'object' || !response.system_prompt) {
    throw new Error('Invalid API response format');
  }
  return response;
};
```

## 📈 Performance Optimization

### Caching Strategies

```javascript
// Implement smart caching
class PromptCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, {
      value,
      timestamp: Date.now()
    });
  }
  
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // Check if cache is still valid (1 hour)
    const isValid = Date.now() - item.timestamp < 3600000;
    if (!isValid) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
}
```

### Lazy Loading

```javascript
// Lazy load components
const lazyLoadComponent = async (componentName) => {
  const module = await import(`./components/${componentName}.js`);
  return module.default;
};

// Load modal only when needed
const showModal = async () => {
  const Modal = await lazyLoadComponent('modal-manager');
  return new Modal();
};
```

### Memory Management

```javascript
// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  // Clear caches
  promptCache.clear();
  
  // Remove event listeners
  document.removeEventListener('click', handleClick);
  
  // Cancel pending requests
  controller.abort();
});
```

## 🧪 Testing

### Unit Testing

```javascript
// Example test file: tests/api-service.test.js
import { APIService } from '../js/api-service.js';

describe('APIService', () => {
  let apiService;
  
  beforeEach(() => {
    apiService = new APIService();
  });
  
  test('should detect OpenAI API key format', () => {
    const openaiKey = 'sk-proj-abcd1234...';
    expect(apiService.detectProvider(openaiKey)).toBe('openai');
  });
  
  test('should detect Anthropic API key format', () => {
    const anthropicKey = 'sk-ant-api03-abcd1234...';
    expect(apiService.detectProvider(anthropicKey)).toBe('anthropic');
  });
  
  test('should handle invalid API key', async () => {
    await expect(apiService.optimizePrompt('invalid-key', 'test'))
      .rejects.toThrow('Invalid API key');
  });
});
```

### Integration Testing

```javascript
// Test extension on different websites
const testWebsites = [
  'https://chatgpt.com',
  'https://claude.ai',
  'https://chat.openai.com'
];

const runIntegrationTests = async () => {
  for (const site of testWebsites) {
    console.log(`Testing ${site}...`);
    
    // Test button injection
    const buttonExists = document.querySelector('.ai-optimizer-button');
    console.assert(buttonExists, `Button not found on ${site}`);
    
    // Test textarea detection
    const textarea = document.querySelector('textarea');
    console.assert(textarea, `Textarea not found on ${site}`);
  }
};
```

### End-to-End Testing

```javascript
// Automated testing with Puppeteer
const puppeteer = require('puppeteer');

const testExtension = async () => {
  const browser = await puppeteer.launch({
    headless: false,
    args: [
      '--load-extension=./ai-prompt-optimizer-extension',
      '--disable-extensions-except=./ai-prompt-optimizer-extension'
    ]
  });
  
  const page = await browser.newPage();
  await page.goto('https://chatgpt.com');
  
  // Wait for extension to load
  await page.waitForSelector('.ai-optimizer-button');
  
  // Test optimization flow
  await page.type('textarea', 'Test prompt');
  await page.click('.ai-optimizer-button');
  
  // Verify results
  const optimizedText = await page.$eval('textarea', el => el.value);
  console.assert(optimizedText.includes('system_prompt'), 'Optimization failed');
  
  await browser.close();
};
```

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

### Chrome Web Store Submission

1. **Prepare Assets**
   ```bash
   # Screenshots (1280x800 recommended)
   screenshots/
   ├── main-screenshot.png
   ├── feature-1.png
   ├── feature-2.png
   └── feature-3.png
   
   # Store assets
   store-assets/
   ├── icon-128.png
   ├── promo-440x280.png
   └── promo-920x680.png
   ```

2. **Store Listing**
   - Clear, descriptive title
   - Detailed description with bullet points
   - Relevant keywords for SEO
   - High-quality screenshots showing features
   - Privacy policy if collecting data

3. **Review Process**
   - Ensure compliance with Chrome Web Store policies
   - Test on multiple Chrome versions
   - Verify all permissions are necessary
   - Include clear permission explanations

### Version Management

```json
{
  "manifest_version": 3,
  "version": "1.0.0",
  "version_name": "1.0.0 - Initial Release"
}
```

## 🔄 Maintenance

### Update Strategies

```javascript
// Auto-update detection
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'update') {
    console.log('Extension updated to', chrome.runtime.getManifest().version);
    
    // Migrate settings if needed
    migrateSettings(details.previousVersion);
    
    // Show update notification
    showUpdateNotification();
  }
});
```

### Monitoring & Feedback

```javascript
// Error tracking
window.addEventListener('error', (event) => {
  console.error('Extension error:', event.error);
  
  // Optional: Send to error tracking service
  if (localStorage.getItem('error_reporting') === 'true') {
    sendErrorReport({
      message: event.error.message,
      stack: event.error.stack,
      version: chrome.runtime.getManifest().version
    });
  }
});
```

### Backwards Compatibility

```javascript
// Handle legacy settings
const migrateSettings = (previousVersion) => {
  if (compareVersions(previousVersion, '1.0.0') < 0) {
    // Migrate from old storage format
    const oldSettings = localStorage.getItem('ai_optimizer_settings');
    if (oldSettings) {
      const newSettings = convertLegacySettings(oldSettings);
      chrome.storage.local.set(newSettings);
      localStorage.removeItem('ai_optimizer_settings');
    }
  }
};
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

**← [Getting Started](GETTING-STARTED.md)** | **[Main README](README.md)**
