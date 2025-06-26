(async () => {
  const addOptimizeButton = () => {
    try {
      const textareaSelectors = [
        'textarea[data-id="root"]',
        'textarea[placeholder*="Message"]',
        'textarea[placeholder*="הודעה"]',
        'div[contenteditable="true"]',
        'textarea'
      ];

      let textarea = null;
      let container = null;

      for (const selector of textareaSelectors) {
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
        return false;
      }

      if (!container) {
        console.warn("⚠️ לא נמצא קונטיינר מתאים, משתמש ב-body");
        container = document.body;
      }

      if (document.querySelector('#gpt-optimize-btn')) {
        return true;
      }

      const button = document.createElement("button");
      button.id = "gpt-optimize-btn";
      button.innerText = "⚙️ Optimize";
      button.style.cssText = `
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

      button.onmouseenter = () => {
        button.style.backgroundColor = "#0d8f6b";
        button.style.transform = "scale(1.05)";
      };

      button.onmouseleave = () => {
        button.style.backgroundColor = "#10a37f";
        button.style.transform = "scale(1)";
      };

      button.onclick = async () => {
        try {
          button.disabled = true;
          button.innerText = "⏳ מעבד...";

          const input = textarea.value || textarea.textContent || "";
          if (!input.trim()) {
            alert("אנא הכנס טקסט לאופטימיזציה");
            return;
          }

          const [key, prompt] = await Promise.all([
            new Promise((resolve) => {
              chrome.storage.local.get(["openai_key", "custom_system_prompt", "use_custom_prompt"], (result) => {
                resolve({
                  key: result.openai_key,
                  customPrompt: result.custom_system_prompt,
                  useCustom: result.use_custom_prompt
                });
              });
            }),
            fetch(chrome.runtime.getURL("prompt.md"))
              .then(res => res.text())
              .catch(() => "אתה עוזר מקצועי לשיפור פרומפטים. שפר את הפרומפט הבא:")
          ]);

          if (!key.key) {
            if (confirm("מפתח API לא נמצא. האם תרצה לפתוח את ההגדרות?")) {
              chrome.runtime.sendMessage({ action: "openOptions" });
            }
            return;
          }

          // בחירת הפרומפט - מותאם אישית או ברירת מחדל
          const systemPrompt = key.useCustom && key.customPrompt ? key.customPrompt : prompt;

          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${key.key}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: input }
              ],
              max_tokens: 1000,
              temperature: 0.1
            })
          });

          if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
          }

          const data = await response.json();
          const optimized = data.choices?.[0]?.message?.content;

          if (optimized) {
            // שירשור הפרומפט המאופטמיזר לפני הטקסט המקורי
            const originalText = input.trim();
            const combinedText = optimized.trim() + "\n\n" + originalText;
            
            if (textarea.tagName.toLowerCase() === 'textarea') {
              textarea.value = combinedText;
            } else {
              textarea.textContent = combinedText;
            }
            
            // מפעיל אירוע שינוי כדי שהאתר יזהה את השינוי
            const inputEvent = new Event('input', { bubbles: true });
            textarea.dispatchEvent(inputEvent);
            
            // מפעיל פוקוס על התיבה
            textarea.focus();
            
            console.log("✅ פרומפט אופטימיזד התווסף לפני הטקסט המקורי");
            
            // הצגת הודעת הצלחה קצרה
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
            
          } else {
            throw new Error("לא התקבלה תשובה תקינה מה-API");
          }

        } catch (error) {
          console.error("❌ שגיאה:", error);
          alert(`שגיאה: ${error.message}`);
        } finally {
          button.disabled = false;
          button.innerText = "⚙️ Optimize";
        }
      };

      document.body.appendChild(button);
      return true;

    } catch (error) {
      console.error("❌ שגיאה בהוספת הכפתור:", error);
      return false;
    }
  };

  const maxAttempts = 5;
  let attempts = 0;

  const tryAddButton = () => {
    attempts++;
    if (addOptimizeButton()) {
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