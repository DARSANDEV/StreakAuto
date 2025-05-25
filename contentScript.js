console.log("Streak Auto Content script loaded on:", window.location.href);
function changeColorOfPage(colour){
    var streak = document.getElementById("mainheader")
    if(streak){
        streak.style.backgroundColor = colour;
    }
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "ping") {
    sendResponse({ status: "alive" });
  }
  if (message.action === "change-colour") {
    changeColorOfPage(message.colour); 
    sendResponse({ status: "Colour changed" }); 
  }
  else if (message.action === "start-notificationObserver") {
    if(window.location.pathname.includes("/notifications")){
      waitForElement(".jss138", () => {
      console.log("Target container detected, starting MutationObserver...");
      startNotificationObserver();
      startLiveNotificationObserverV2();
    });
    }
    
  }
});


function waitForElement(selector, callback) {
  const el = document.querySelector(selector);
  if (el) {
    callback(el);
    return;
  }

  const observer = new MutationObserver(() => {
    const el = document.querySelector(selector);
    if (el) {
      observer.disconnect();
      callback(el);
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function startNotificationObserver() {
  const initialNodes = document.querySelectorAll('.jss143');
  let notifications = Array.from(initialNodes).map(extractNotificationData);
  console.log('Initial Notifications:', notifications);
  selectNoftification(initialNodes);
  const targetNode = document.querySelector('.jss138') || document.body;

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType === 1 && node.classList.contains('jss143')) {
          const data = extractNotificationData(node);
          selectNoftification(node);
          notifications.push(data);
          console.log('New Notification: ', data);
        }

        const nested = node.querySelectorAll?.('.jss143') || [];
        nested.forEach(child => {
          const data = extractNotificationData(child);
          selectNoftification(node);
          notifications.push(data);
          console.log('New Nested Notification:', data);
        });
      }
    }
  });

  observer.observe(targetNode, {
    childList: true,
    subtree: true
  });
}

function extractNotificationData(node) {
  const instrument = node.querySelector('.jss146 p')?.innerText || '';
  const strategy = node.querySelector('.jss147 p')?.innerText || '';
  const price = node.querySelector('.jss154')?.innerText || '';
  const qty = node.querySelector('.jss145 p')?.innerText || '';
  const time = node.querySelector('.jss152')?.innerText || '';
  const status = node.querySelector('.jss150 p')?.innerText || '';
  return { instrument, strategy, price, qty, time, status };
}

// fix needed
function selectNoftification(node){
   const isActive = node.querySelector('img[src*="blue-blinker-light"]');

          if (isActive) {
            console.log('🟢 Active Live Notification found, clicking...');
            card.click();
          }
}

function startLiveNotificationObserverV2() {
  const notifications = [];

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;

        // Watch for main live trading card
        const liveCards = node.classList.contains('jss356')
          ? [node]
          : Array.from(node.querySelectorAll?.('.jss356') || []);

        liveCards.forEach(card => {
          const isActive = card.querySelector('img[src*="blue-blinker-light"]');

          if (isActive) {
            console.log('🟢 Active Live Notification found, clicking...');
            card.click();
          } else {
            console.log('⚪️ Inactive or irrelevant card skipped.');
          }
        });
      }
    }
  });

  const targetNode = document.body;
  observer.observe(targetNode, {
    childList: true,
    subtree: true
  });

  console.log('🔍 Live notification observer started.');
}

