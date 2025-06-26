(async () => {
  let lastOptimizedPrompt = ""; // לשמירת הפרומפט המאופטמיזה לצפייה

  const createModal = (content) => {
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
      max-width: 80vw;
      max-height: 80vh;
      overflow: auto;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      white-space: pre-wrap;
      position: relative;
      line-height: 1.5;
      font-size: 14px;
    `;
    inner.textContent = content;

    const closeBtn = document.createElement("button");
    closeBtn.innerText = "✖";
    closeBtn.style.cssText = `
      position: absolute;
      top: 8px;
      right: 12px;
      background: transparent;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #666;
    `;
    closeBtn.onclick = () => modal.remove();

    // סגירה בלחיצה על הרקע
    modal.onclick = (e) => {
      if (e.target === modal) modal.remove();
    };

    inner.appendChild(closeBtn);
    modal.appendChild(inner);
    document.body.appendChild(modal);
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
              chrome.storage.local.get(["openai_key"], (result) => {
                resolve(result.openai_key);
              });
            }),
            fetch(chrome.runtime.getURL("prompt.md"))
              .then(res => res.text())
              .catch(() => "אתה עוזר מקצועי לשיפור פרומפטים. שפר את הפרומפט הבא:")
          ]);

          if (!key) {
            if (confirm("מפתח API לא נמצא. האם תרצה לפתוח את ההגדרות?")) {
              chrome.runtime.sendMessage({ action: "openOptions" });
            }
            return;
          }

          const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${key}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "gpt-3.5-turbo",
              messages: [
                { role: "system", content: prompt },
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
            eyeBtn.title = "Show Optimized System Prompt";
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
                createModal(lastOptimizedPrompt);
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