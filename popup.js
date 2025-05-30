document.addEventListener("DOMContentLoaded", function () {
  let toggleSwitch = document.getElementById("toggleExtension");
  let toggleText = document.getElementById("toggleText");

  // Load the current state from Chrome storage
  chrome.storage.sync.get(["isExtensionEnabled"], function (result) {
      toggleSwitch.checked = result.isExtensionEnabled || false;
      toggleText.innerText = toggleSwitch.checked ? "Extension Enabled" : "Extension Disabled";
  });
const viewLogsBtn = document.getElementById('viewLogsBtn');

viewLogsBtn.addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL("logs.html") });
});
  // Listen for toggle switch changes
  toggleSwitch.addEventListener("change", function () {
      let isEnabled = toggleSwitch.checked;
      chrome.storage.sync.set({ "isExtensionEnabled": isEnabled }, function () {
          toggleText.innerText = isEnabled ? "Extension Enabled" : "Extension Disabled";
          
          // Send a message to background.js
          //chrome.runtime.sendMessage({ action: isEnabled ? "ENABLE_EXTENSION" : "DISABLE_EXTENSION" });
      });
  });
  
});
