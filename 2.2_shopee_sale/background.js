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