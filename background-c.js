import { logMessage } from './logutil.js';

let isExtentionEnabled = false;
let istargetSiteActive = false;
let tabActivatedListener = null;
let websocket = null;


chrome.storage.sync.get({ "isExtensionEnabled":{} }, (result) => {
    console.log(result);
    isExtentionEnabled = result?.isExtensionEnabled ?? false;
    const msg=  "Strike Auto extension is active: " + isExtentionEnabled;
    logMessage(msg);
    console.log(msg);
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    
  if (area === 'sync' && changes.isExtensionEnabled) {
    console.log("change:"+ JSON.stringify(changes));
    isExtentionEnabled = changes.isExtensionEnabled.newValue;
    checkActiveTabsAndExecute();
    console.log(isExtentionEnabled);
  }
});

if(isExtentionEnabled){
    checkActiveTabsAndExecute()
}
  function checkActiveTabsAndExecute() {
      chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
          if (tabs.length === 0) return;
          let activeTab = tabs[0];
          let url = activeTab?.url;
          istargetSiteActive = url?.includes("streak.tech") || url?.includes("zerodha.com");
          console.log(istargetSiteActive ? " Target Site is Active!" : " Target Site is NOT Active.");
          if(istargetSiteActive){
              const msg=  "Target Site is Active! : " + url;
                 logMessage(msg);
             sendColorChangeToActiveTab();
             //manageWebSocket();
          }
          
      });
  }
  function sendColorChangeToActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.id) {
        console.log("current tab : "+tab?.id)
      //chrome.tabs.sendMessage(tab.id, { action: "change-color" });
    }
  });
}
