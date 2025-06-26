document.getElementById("saveBtn").addEventListener("click", () => {
  const key = document.getElementById("apiKeyInput").value;
  chrome.storage.local.set({ openai_key: key }, () => {
    alert("API Key saved!");
  });
});