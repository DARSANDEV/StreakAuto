import { getLogs } from './logutil.js';

const logList = document.getElementById('logList');
const clearLogsBtn = document.getElementById('clearLogsBtn');

getLogs((logs) => {
  if (logs.length === 0) {
    const li = document.createElement('li');
    li.textContent = 'No logs yet.';
    logList.appendChild(li);
  } else {
    logs.forEach((log) => {
      const li = document.createElement('li');
      li.textContent = log;
      logList.appendChild(li);
    });
  }
});

clearLogsBtn.addEventListener('click', () => {
  chrome.storage.local.set({ logs: [] }, () => {
    logList.innerHTML = '<li>Logs cleared.</li>';
  });
});
