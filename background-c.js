import { logMessage } from './logutil.js';

let isExtentionEnabled = false;
let istargetSiteActive = false;
let tabActivatedListener = null;



chrome.storage.sync.get({ "isExtensionEnabled": {} }, (result) => {
  console.log(result);
  isExtentionEnabled = result?.isExtensionEnabled ?? false;
  const msg = "Strike Auto extension is active: " + isExtentionEnabled;
  logMessage(msg);
  console.log(msg);
});

chrome.storage.onChanged.addListener((changes, area) => {

  if (area === 'sync' && changes.isExtensionEnabled) {
    isExtentionEnabled = changes.isExtensionEnabled.newValue;
    console.log(isExtentionEnabled);
    activateTabListner();
  }
});
activateTabListner();
function activateTabListner() {
  if (isExtentionEnabled) {
    tabActivatedListener = checkActiveTabsAndExecute();
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      tabActivatedListener;
      const msg = "tab active listner " + JSON.stringify(tabActivatedListener);
      console.log(msg);
    });
  } else {
    tabActivatedListener = null;
    const msg = "tab active listner " + JSON.stringify(tabActivatedListener);
    console.log(msg);
  }
}


function checkActiveTabsAndExecute() {
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    if (tabs.length === 0) return;
    let activeTab = tabs[0];
    let url = activeTab?.url;
    istargetSiteActive = url?.includes("streak.tech") || url?.includes("zerodha.com");
    console.log(istargetSiteActive ? " Target Site is Active!" : " Target Site is NOT Active.");
    if (istargetSiteActive) {
      const msg = "Target Site is Active! : " + url;
      logMessage(msg);
      sendColorChangeToActiveTab();
      startNotificationObserver();
    }

  });
}
function sendColorChangeToActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.id) {
      console.log("current tab : " + tab?.id)
      chrome.tabs.sendMessage(tab.id, { action: "change-colour", colour: "blue" });
    }
  });
}

let notifications = [];

// Extract data from a single .jss143 node
function extractNotificationData(node) {
  const instrument = node.querySelector('.jss146 p')?.innerText || '';
  const strategy = node.querySelector('.jss147 p')?.innerText || '';
  const price = node.querySelector('.jss154')?.innerText || '';
  const qty = node.querySelector('.jss145 p')?.innerText || '';
  const time = node.querySelector('.jss152')?.innerText || '';
  const status = node.querySelector('.jss150 p')?.innerText || '';
  return { instrument, strategy, price, qty, time, status };
}

// Method to initialize observer and update notifications
function startNotificationObserver() {
  // Initial fetch
   console.log('Mutation observer started...');
  const initialNodes = document.querySelectorAll('.jss143');
  notifications = Array.from(initialNodes).map(extractNotificationData);
  console.log('Initial Notifications:', notifications);

  const targetNode = document.querySelector('.jss138') || document.body;

  const observer = new MutationObserver(mutations => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1 && node.classList.contains('jss143')) {
            const data = extractNotificationData(node);
            notifications.push(data);
            console.log('New Notification:', data);
          }

          const nested = node.querySelectorAll?.('.jss143') || [];
          nested.forEach(child => {
            const data = extractNotificationData(child);
            notifications.push(data);
            console.log('New Nested Notification:', data);
          });
        });
      }
    }
  });

  observer.observe(targetNode, {
    childList: true,
    subtree: true
  });

 
}



