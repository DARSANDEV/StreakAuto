// logUtil.js
export function logMessage(message,) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ${message}`;

  chrome.storage.local.get({ logs: [] }, (result) => {
    const updatedLogs = [...result.logs, logEntry];
    chrome.storage.local.set({ logs: updatedLogs });
  });
}

export function getLogs(callback) {
  chrome.storage.local.get({ logs: [] }, (result) => {
    callback(result.logs);
  });
}
