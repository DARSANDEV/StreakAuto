import { logMessage } from './logutil.js';

let isExtentionEnabled = false;
let istargetSiteActive = false;
let tabActivatedListener = null;
let websocket = null;

chrome.storage.sync.get({ "isExtensionEnabled":Boolean }, (result) => {
    isExtentionEnabled = result;
    const msg=  "Strike Auto extension is active: " + isExtentionEnabled;
    logMessage(msg);
  });

  // Functione moved to storage based event instead of message based
// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message?.action === "ENABLE_EXTENSION") {
//         isExtentionEnabled = true;
//         if (!tabActivatedListener) {
//             tabActivatedListener = () => {
//                const msg=  "Strike Auto extension is active: " + isExtentionEnabled;
//                logMessage(msg);
//                 checkActiveTabsAndExecute();
//             };
//             chrome.tabs.onActivated.addListener(tabActivatedListener);
//             console.log("Event Listener Added");
            
//         }
//     } else if (message?.action === "DISABLE_EXTENSION") {
//         isExtentionEnabled = false;
//         if (tabActivatedListener) {
//             chrome.tabs.onActivated.removeListener(tabActivatedListener);
//             console.log("Event Listener Removed");
//             tabActivatedListener = null;
//         }
//     }
//     //manageWebSocket();
// });
//if(isExtentionEnabled){
    checkActiveTabsAndExecute();
//}
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
          // manageWebSocket();
        }
        
    });
}
function sendColorChangeToActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, ([tab]) => {
    if (tab?.id) {
      chrome.tabs.sendMessage(tab.id, { action: "change-color" });
    }
  });
}
manageWebSocket();
function manageWebSocket() {
    if (isExtentionEnabled && istargetSiteActive) {
        if (!websocket) {
            createWebSocketConnection();
        }
    } 
    // else {
    //     closeWebSocketConnection();
    // }
}

function createWebSocketConnection() {
    if (!("WebSocket" in self)) return;
    if (websocket) return;
    const msg = "websocket cration started";
    logMessage(msg)
    chrome.storage.local.get("instance", (data) => {
        if (data.instance) {
            websocket = new WebSocket('wss://nt-op.streak.tech/notification');
            console.log("websocket connection created")
            setupWebSocketHandlers();
        }
    });
}

function setupWebSocketHandlers() {
    websocket.onopen = () => {
        chrome.storage.local.get("username", (data) => {
            if (data.username) {
                websocket.send(JSON.stringify({ userLoginId: data.username }));
            }
        });
    };

    websocket.onmessage = (event) => {
        let received_msg = JSON.parse(event.data);
        const msg = "message received :"+ JSON.stringify(event);
        let demoNotificationOptions = {
            type: "basic",
            title: received_msg.subject,
            message: received_msg.message,
            iconUrl: "images/demo-icon.png",
        };
        chrome.notifications.create("", demoNotificationOptions);
    };

    websocket.onclose = () => {
        console.log(" WebSocket Disconnected");
        websocket = null;
        manageWebSocket(); // Attempt reconnection if needed
    };
}

function closeWebSocketConnection() {
    if (websocket) {
        websocket.close();
        websocket = null;
        console.log(" WebSocket Connection Closed");
    }
}
