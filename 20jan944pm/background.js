chrome.runtime.onInstalled.addListener(() => {
  console.log('Cookies N Crypt installed.');
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCookies") {
    chrome.cookies.getAll({url: request.url}, (cookies) => {
      sendResponse({data: cookies});
    });
    return true; // Keep the message channel open for async response
  }
});

// background.js

chrome.webNavigation.onCompleted.addListener((details) => {
  const url = new URL(details.url).toString(); // Convert URL to string

  chrome.storage.local.get([url], (result) => {
    const storedData = result[url] ? result[url] : { cookies: [], visits: 0 };
    const storedCookies = storedData.cookies;
    const visits = storedData.visits;

    chrome.cookies.getAll({ url: details.url }, (currentCookies) => {
      const currentCookieNames = currentCookies.map(cookie => cookie.name);
      const addedCookies = currentCookieNames.filter(name => !storedCookies.includes(name));
      const removedCookies = storedCookies.filter(name => !currentCookieNames.includes(name));
      const isSecondVisitOnwards = visits > 0; // Only true if visits counter is more than 0

      // Update the storage with the current list of cookies and increment the visit count
      chrome.storage.local.set({ [url]: { cookies: currentCookieNames, visits: visits + 1, addedCookies, removedCookies } }, () => {
        if (chrome.runtime.lastError) {
          console.error(`Error setting storage for ${url}: ${chrome.runtime.lastError.message}`);
        } else if (isSecondVisitOnwards) {
          let notificationMessage = '';
          let notificationTitle = "Cookie Changes Detected";

          if (addedCookies.length > 0 && removedCookies.length === 0) {
            notificationMessage = `${addedCookies.length} cookie(s) added for ${url}.`;
          } else if (removedCookies.length > 0 && addedCookies.length === 0) {
            notificationMessage = `${removedCookies.length} cookie(s) removed for ${url}.`;
          } else if (addedCookies.length > 0 && removedCookies.length > 0) {
            notificationMessage = `${addedCookies.length} cookie(s) added, ${removedCookies.length} cookie(s) removed for ${url}.`;
          }

          if (addedCookies.length > 0 || removedCookies.length > 0) {
            const notificationOptions = {
              type: "basic",
              iconUrl: "icon.png", // Make sure this path is correct and the icon exists in your extension directory
              title: notificationTitle,
              message: notificationMessage,
              buttons: [{ title: "View cookie changes" }],
              requireInteraction: true // This makes the notification stay until the user interacts with it
            };

            // Create the notification
            chrome.notifications.create("cookieNotification", notificationOptions);
          }
        }
      });
    });
  });
});
