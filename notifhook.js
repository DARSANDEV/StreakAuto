// (function() {
//     // save the original function
//     var origCreateNotif = webkitNotifications.createNotification;

//     // overwrite createNotification with a new function
//     webkitNotifications.createNotification = function(img, title, body) {

//         // call the original notification function
//         var result = origCreateNotif.apply(this, arguments);

//         // bind a listener for when the notification is displayed
//         result.addEventListener("display", function() {
//             // do something when the notification is displayed
//             // use img, title, and body to read the notification
//             // YOUR TRIGGERED CODE HERE!
//             console.log("notification triggered");
//         });

//         return result;
//     }
// })();

// function sendMessage(message) {
//     return new Promise(function(resolve, reject) {
//       var messageChannel = new MessageChannel();
//       messageChannel.port1.onmessage = function(event) {
//         if (event.data.error) {
//           reject(event.data.error);
//         } else {
//           resolve(event.data);
//         }
//       };
//       navigator.serviceWorker.controller.postMessage(message,
//         [messageChannel.port2]);
//     });
//   }
  
//   (function() {
//     if ('serviceWorker' in navigator) {
//       var register = navigator.serviceWorker.register;
//       navigator.serviceWorker.register = function() {
//         register.call(navigator.serviceWorker, "yourscript.js").then(function() {
//           sendMessage({args: [].slice.call(arguments)});
//         });
//       };
//     }
//   })();