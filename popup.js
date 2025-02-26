document.addEventListener("DOMContentLoaded", function () {
  let toggleSwitch = document.getElementById("toggleExtension");
  let toggleText = document.getElementById("toggleText");

  // Load the current state from Chrome storage
  chrome.storage.sync.get(["extensionEnabled"], function (result) {
      toggleSwitch.checked = result.extensionEnabled || false;
      toggleText.innerText = toggleSwitch.checked ? "Extension Enabled" : "Extension Disabled";
  });

  // Listen for toggle switch changes
  toggleSwitch.addEventListener("change", function () {
      let isEnabled = toggleSwitch.checked;
      chrome.storage.sync.set({ "extensionEnabled": isEnabled }, function () {
          toggleText.innerText = isEnabled ? "Extension Enabled" : "Extension Disabled";
          
          // Send a message to background.js
          chrome.runtime.sendMessage({ action: isEnabled ? "ENABLE_EXTENSION" : "DISABLE_EXTENSION" });
      });
  });
});
