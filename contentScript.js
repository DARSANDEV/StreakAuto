console.log("Streak Auto Content script loaded on:", window.location.href);
function changeColorOfPage(){
    var streak = document.getElementById("mainheader")
    if(streak){
        streak.style.backgroundColor = "yellow";
    }
}
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "change-color") {
   changeColorOfPage();
  }
});