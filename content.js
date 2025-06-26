(async () => {
  let lastOptimizedPrompt = ""; // לשמירת הפרומפט המאופטמיזה לצפייה

  const createEditableModal = (content) => {
    document.querySelector("#gpt-prompt-modal")?.remove();

    const modal = document.createElement("div");
    modal.id = "gpt-prompt-modal";
    modal.style.cssText = `
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.6);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 10000;
    `;

    const inner = document.createElement("div");
    inner.style.cssText = `
      background: white;
      padding: 20px;
      border-radius: 8px;
      max-width: 90vw;
      max-height: 90vh;
      overflow: hidden;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      position: relative;
      display: flex;
      flex-direction: column;
    `;

    // כותרת
    const header = document.createElement("div");
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    `;

    const title = document.createElement("h3");
    title.textContent = "Edit Optimized System Prompt";
    title.style.cssText = `
      margin: 0;
      color: #333;
      font-size: 18px;
    `;

    const closeBtn = document.createElement("button");
    closeBtn.innerText = "✖";
    closeBtn.style.cssText = `
      background: transparent;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #666;
      padding: 5px;
    `;
    closeBtn.onclick = () => modal.remove();

    header.appendChild(title);
    header.appendChild(closeBtn);

    // אזור העריכה
    const textarea = document.createElement("textarea");
    textarea.value = content;
    textarea.style.cssText = `
      width: 100%;
      height: 400px;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 10px;
      font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
      font-size: 13px;
      line-height: 1.4;
      resize: vertical;
      outline: none;
      margin-bottom: 15px;
    `;

    // כפתורים
    const buttonContainer = document.createElement("div");
    buttonContainer.style.cssText = `
      display: flex;
      gap: 10px;
      justify-content: flex-end;
    `;

    const copyBtn = document.createElement("button");
    copyBtn.innerText = "📋 Copy to Clipboard";
    copyBtn.style.cssText = `
      padding: 8px 16px;
      background: #6c757d;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    copyBtn.onclick = () => {
      navigator.clipboard.writeText(textarea.value).then(() => {
        const originalText = copyBtn.innerText;
        copyBtn.innerText = "✅ Copied!";
        setTimeout(() => {
          copyBtn.innerText = originalText;
        }, 2000);
      });
    };

    const useBtn = document.createElement("button");
    useBtn.innerText = "🔄 Use as System Prompt";
    useBtn.style.cssText = `
      padding: 8px 16px;
      background: #28a745;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    useBtn.onclick = () => {
      const editedContent = textarea.value.trim();
      if (editedContent) {
        // עדכון הפרומפט המאופטמיזה עם התוכן הערוך
        lastOptimizedPrompt = editedContent;
        
        // שמירה ב-storage כ-system prompt מותאם אישית
        chrome.storage.local.set({ 
          custom_system_prompt: editedContent,
          use_custom_prompt: true 
        }, () => {
          const originalText = useBtn.innerText;
          useBtn.innerText = "✅ Saved!";
          setTimeout(() => {
            useBtn.innerText = originalText;
          }, 2000);
        });
      }
    };

    const replaceBtn = document.createElement("button");
    replaceBtn.innerText = "📝 Replace Current Text";
    replaceBtn.style.cssText = `
      padding: 8px 16px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    `;
    replaceBtn.onclick = () => {
      const editedContent = textarea.value.trim();
      if (editedContent) {
        // מחפש את תיבת הטקסט של ChatGPT
        const chatTextarea = document.querySelector('textarea[data-id="root"]') || 
                           document.querySelector('textarea[placeholder*="Message"]') ||
                           document.querySelector('div[contenteditable="true"]') ||
                           document.querySelector('textarea');
        
        if (chatTextarea) {
          if (chatTextarea.tagName.toLowerCase() === 'textarea') {
            chatTextarea.value = editedContent;
          } else {
            chatTextarea.textContent = editedContent;
          }
          
          // מפעיל אירוע שינוי
          const event = new Event('input', { bubbles: true });
          chatTextarea.dispatchEvent(event);
          
          modal.remove();
        } else {
          alert("לא נמצאה תיבת הטקסט");
        }
      }
    };

    buttonContainer.appendChild(copyBtn);
    buttonContainer.appendChild(useBtn);
    buttonContainer.appendChild(replaceBtn);

    // סגירה בלחיצה על הרקע
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };

    inner.appendChild(header);
    inner.appendChild(textarea);
    inner.appendChild(buttonContainer);
    modal.appendChild(inner);
    document.body.appendChild(modal);
    
    // פוקוס על ה-textarea
    setTimeout(() => textarea.focus(), 100);
  };

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
            // שמירת הפרומפט המאופטמיזה לצפייה בלבד - לא מחליף את הטקסט
            lastOptimizedPrompt = optimized;
            console.log("✅ פרומפט אופטימיזד נשמר לצפייה");
          } else {
            throw new Error("לא התקבלה תשובה תקינה מה-API");
          }

        } catch (error) {
          console.error("❌ שגיאה:", error);
          alert(`שגיאה: ${error.message}`);
        } finally {
          button.disabled = false;
          button.innerText = "⚙️ Optimize";

          // הוספת כפתור העין רק אחרי שיש פרומפט מאופטמיזה
          if (lastOptimizedPrompt && !document.querySelector("#gpt-eye-btn")) {
            const eyeBtn = document.createElement("button");
            eyeBtn.id = "gpt-eye-btn";
            eyeBtn.innerText = "👁️";
            eyeBtn.title = "הצג את הפרומפט המאופטמיזה (לא מחליף את הטקסט)";
            eyeBtn.style.cssText = `
              position: fixed;
              bottom: 20px;
              right: 130px;
              z-index: 9999;
              padding: 8px 12px;
              background: #4a90e2;
              color: white;
              border: none;
              border-radius: 6px;
              cursor: pointer;
              font-size: 16px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
              transition: all 0.2s ease;
            `;
            
            eyeBtn.onmouseenter = () => {
              eyeBtn.style.backgroundColor = "#357abd";
              eyeBtn.style.transform = "scale(1.05)";
            };

            eyeBtn.onmouseleave = () => {
              eyeBtn.style.backgroundColor = "#4a90e2";
              eyeBtn.style.transform = "scale(1)";
            };
            
            eyeBtn.onclick = () => {
              if (lastOptimizedPrompt) {
                createEditableModal(lastOptimizedPrompt);
              } else {
                alert("אין פרומפט מאופטמיזה זמין");
              }
            };
            
            document.body.appendChild(eyeBtn);
          }
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