import { logMessage } from './logutil.js';

let isExtensionEnabled = false;
let isTargetSiteActive = false;

chrome.storage.sync.get({ isExtensionEnabled: false }, (result) => {
  isExtensionEnabled = result.isExtensionEnabled;
  const msg = "Strike Auto extension is active: " + isExtensionEnabled;
  logMessage(msg);
  console.log(msg);
  if (isExtensionEnabled) activateTabListener();
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes.isExtensionEnabled) {
    isExtensionEnabled = changes.isExtensionEnabled.newValue;
    console.log("Extension status changed:", isExtensionEnabled);
    if (isExtensionEnabled) {
      activateTabListener();
    }
  }
});

function activateTabListener() {
  chrome.tabs.onActivated.addListener(() => {
    checkActiveTabAndExecute();
  });

  // Also handle tab updates (e.g., navigation)
  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      checkActiveTabAndExecute();
    }
  });

  // Immediate check on first activation
  checkActiveTabAndExecute();
}

function checkActiveTabAndExecute() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs.length === 0) return;

    const activeTab = tabs[0];
    const url = activeTab.url || '';
    isTargetSiteActive = url.includes("streak.tech") || url.includes("zerodha.com");
    console.log(isTargetSiteActive ? "Target site is ACTIVE!" : "Target site is NOT active.");

    if (isTargetSiteActive) {
      //injectContentScript(activeTab.id)
      ensureContentScript(activeTab.id, () => {
        const msg = "Target site is Active! : " + url;
        logMessage(msg);
        sendColorChangeToActiveTab(activeTab.id);
        sendStartObserverMessageToTab(activeTab.id);
      });
    }
  });
}
function injectContentScript(tabId) {
  chrome.scripting.executeScript({
    target: { tabId },
    files: ['contentScript.js']
  }, () => {
    console.log("contentScript.js injected into tab:", tabId);
  });
}
function ensureContentScript(tabId, callback) {
  chrome.tabs.sendMessage(tabId, { action: "ping" }, (response) => {
    if (chrome.runtime.lastError || !response) {
      console.log("Content script not found, injecting...");
      chrome.scripting.executeScript({
        target: { tabId },
        files: ["contentScript.js"]
      }, () => {
        if (chrome.runtime.lastError) {
          console.warn("Injection failed:", chrome.runtime.lastError.message);
        } else {
          console.log("Content script injected.");
          callback?.(); // Run next logic only after injection
        }
      });
    } else {
      console.log("✅ Content script already injected.");
      callback?.(); // Already injected, run next logic
    }
  });
}


function sendColorChangeToActiveTab(tabId) {
  if (tabId) {
    chrome.tabs.sendMessage(tabId, { action: "change-colour", colour: "blue" }, (response) => {
      if (chrome.runtime.lastError) {
        console.warn("Color change failed:", chrome.runtime.lastError.message);
      } else {
        console.log("Color change message sent successfully.");
      }
    });
  }
}

function sendStartObserverMessageToTab(tabId) {
  chrome.tabs.sendMessage(tabId, { action: "start-notificationObserver" }, (response) => {
    if (chrome.runtime.lastError) {
      console.warn("Observer start failed:", chrome.runtime.lastError.message);
    } else {
      console.log("Observer start message sent successfully.");
    }
  });
}

