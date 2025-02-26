let isExtentionEnabled = false;
let istargetSiteActive = false;
let tabActivatedListener = null;
let websocket = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received Message:", message);
    
    if (message?.action === "ENABLE_EXTENSION") {
        isExtentionEnabled = true;
        if (!tabActivatedListener) {
            tabActivatedListener = () => {
                console.log("Strike Auto extension is active: " + isExtentionEnabled);
                checkActiveTabsAndExecute();
            };
            chrome.tabs.onActivated.addListener(tabActivatedListener);
            console.log("Event Listener Added");
        }
    } else if (message?.action === "DISABLE_EXTENSION") {
        isExtentionEnabled = false;
        if (tabActivatedListener) {
            chrome.tabs.onActivated.removeListener(tabActivatedListener);
            console.log("Event Listener Removed");
            tabActivatedListener = null;
        }
    }
    manageWebSocket();
});

function checkActiveTabsAndExecute() {
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        if (tabs.length === 0) return;
        let activeTab = tabs[0];
        let url = activeTab?.url;
        istargetSiteActive = url?.includes("streak.tech") || url?.includes("zerodha.com");
        console.log(istargetSiteActive ? " Target Site is Active!" : " Target Site is NOT Active.");
        manageWebSocket();
    });
}

function manageWebSocket() {
    if (isExtentionEnabled && istargetSiteActive) {
        if (!websocket) {
            createWebSocketConnection();
        }
    } else {
        closeWebSocketConnection();
    }
}

function createWebSocketConnection() {
    if (!("WebSocket" in self)) return;
    if (websocket) return;

    chrome.storage.local.get("instance", (data) => {
        if (data.instance) {
            websocket = new WebSocket(`wss://${data.instance}/ws/demoPushNotifications`);
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
