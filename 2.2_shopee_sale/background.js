// Delay (in milliseconds) before checking and deleting cookies
const DELETE_COOKIES_DELAY_MS = 3000; // 3 seconds

chrome.runtime.onInstalled.addListener(() => {
  console.log('CookieCrypt installed.');
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

// This function runs when a tab is updated, e.g., when the user navigates to a page
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.storage.sync.get(['deletedCookies'], function (result) {
      const deletedCookies = result.deletedCookies || [];
      deletedCookies.forEach(function(cookie) {
        const cookieDetails = {
          url: `https://${cookie.domain}${cookie.path}`, 
          name: cookie.name
        };
        // Try deleting for both http and https
        chrome.cookies.remove(cookieDetails);
        cookieDetails.url = `http://${cookie.domain}${cookie.path}`;
        chrome.cookies.remove(cookieDetails);
      });
    });
  }
});

// Function to delete cookies for a specific domain.
function deleteCookiesForDomain(domain) {
  const cookieDetailsHttp = { url: `http://${domain}/*` };
  const cookieDetailsHttps = { url: `https://${domain}/*` };
  // Remove cookies for both http and https versions of the domain
  chrome.cookies.getAll({domain}, function(cookies) {
    cookies.forEach(function(cookie) {
      chrome.cookies.remove({ url: cookieDetailsHttp.url, name: cookie.name });
      chrome.cookies.remove({ url: cookieDetailsHttps.url, name: cookie.name });
    });
  });
}

// Function to handle the deletion of cookies based on user preferences.
function checkAndDeleteCookies() {
  chrome.storage.sync.get(['deletedCookies'], function (result) {
    const deletedCookies = result.deletedCookies || [];
    deletedCookies.forEach(function(cookie) {
      deleteCookiesForDomain(cookie.domain);
    });
  });
}

// Delayed check and delete cookies function
function delayedCheckAndDeleteCookies() {
  setTimeout(checkAndDeleteCookies, DELETE_COOKIES_DELAY_MS);
}

// Ensure cookies are deleted when the browser starts.
chrome.runtime.onStartup.addListener(delayedCheckAndDeleteCookies);

// When a tab is updated, delete cookies with a delay.
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url) {
    delayedCheckAndDeleteCookies();
  }
});

// Also delete cookies with a delay when a new tab is created
chrome.tabs.onCreated.addListener(delayedCheckAndDeleteCookies);

// Ensure cookies are deleted when the browser starts.
chrome.runtime.onStartup.addListener(function() {
  checkAndDeleteCookies();
});

// When a tab is updated, delete cookies again.
chrome.tabs.onUpdated.addListener(function(tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url) {
    checkAndDeleteCookies();
  }
});


// Function to check for new cookies
function checkForNewCookies() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const url = new URL(tabs[0].url).toString(); // Convert URL to string for consistency

    chrome.storage.local.get([url], (result) => {
      const storedCookies = result[url] ? result[url] : { cookies: [] };

      chrome.cookies.getAll({ url: tabs[0].url }, (currentCookies) => {
        const currentCookieNames = currentCookies.map(cookie => cookie.name);
        const addedCookies = currentCookieNames.filter(name => !storedCookies.cookies.includes(name));
        const removedCookies = storedCookies.cookies.filter(name => !currentCookieNames.includes(name));

        // Update the storage with the current list of cookies, added cookies, and removed cookies
        chrome.storage.local.set({ [url]: { cookies: currentCookieNames, addedCookies, removedCookies } }, () => {
          if (chrome.runtime.lastError) {
            console.error(`Error setting storage for ${url}: ${chrome.runtime.lastError.message}`);
          } else {
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
}

// Check for new cookies every 30 seconds
setInterval(checkForNewCookies, 500);
