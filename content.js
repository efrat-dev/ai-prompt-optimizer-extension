// content.js - גרסה מעודכנת
(async () => {  
  const addOptimizeButton = () => {
    try {
      // מחפש את התיבת הטקסט עם כמה אפשרויות
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
          
          // מחפש את הקונטיינר המתאים
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
      
      // בודק אם הכפתור כבר קיים
      if (document.querySelector('#gpt-optimize-btn')) {
        return true;
      }
      
      // יוצר את הכפתור
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
      
      // אפקטי hover
      button.onmouseenter = () => {
        button.style.backgroundColor = "#0d8f6b";
        button.style.transform = "scale(1.05)";
      };
      
      button.onmouseleave = () => {
        button.style.backgroundColor = "#10a37f";
        button.style.transform = "scale(1)";
      };
      
      // פונקציונליות הכפתור
      button.onclick = async () => {
        try {
          button.disabled = true;
          button.innerText = "⏳ מעבד...";
          
          const input = textarea.value || textarea.textContent || "";
          
          if (!input.trim()) {
            alert("אנא הכנס טקסט לאופטימיזציה");
            return;
          }
          
          // שליפת המפתח והפרומפט
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
              chrome.runtime.sendMessage({action: "openOptions"});
            }
            return;
          }
          
          // קריאה ל-API
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
            // מחליף את הטקסט
            if (textarea.tagName.toLowerCase() === 'textarea') {
              textarea.value = optimized;
            } else {
              textarea.textContent = optimized;
            }
            
            // מפעיל אירוע שינוי
            const event = new Event('input', { bubbles: true });
            textarea.dispatchEvent(event);
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
      
      // מוסיף את הכפתור לעמוד
      document.body.appendChild(button);
      return true;
      
    } catch (error) {
      console.error("❌ שגיאה בהוספת הכפתור:", error);
      return false;
    }
  };
  
  // מנסה להוסיף את הכפתור
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
  
  // מתחיל את התהליך
  setTimeout(tryAddButton, 1000);
  
  // מקשיב לשינויים בעמוד (למקרה של SPA)
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