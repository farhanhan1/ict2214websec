// Delay (in milliseconds) before checking and deleting cookies
const DELETE_COOKIES_DELAY_MS = 3000; // 3 seconds

chrome.runtime.onInstalled.addListener(() => {
  console.log('CookieCrypt installed.');
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCookies") {
    chrome.cookies.getAll({ url: request.url }, (cookies) => {
      sendResponse({ data: cookies });
    });
    return true; // Keep the message channel open for async response
  }
});

// This function runs when a tab is updated, e.g., when the user navigates to a page
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  console.log(`Tab ${tabId} updated. Status: ${changeInfo.status}, URL: ${tab.url}`);
  if (changeInfo.status === 'complete' && tab.url) {
    chrome.storage.sync.get(['blacklistedCookies'], function (result) {
      const blacklistedCookies = result.blacklistedCookies || [];
      blacklistedCookies.forEach(function (cookie) {
        const cookieDetails = {
          url: `https://${cookie.domain}${cookie.path}`,
          name: cookie.name
        };
        // Try blacklisting for both http and https
        chrome.cookies.remove(cookieDetails);
        cookieDetails.url = `http://${cookie.domain}${cookie.path}`;
        chrome.cookies.remove(cookieDetails);
        console.log(`Blacklisted cookies for ${cookie.name}' in '${cookie.domain}`)
      });
    });
  }
});

// Function to delete cookies for a specific domain.
function deleteCookiesForDomain(domain) {
  const cookieDetailsHttp = { url: `http://${domain}/*` };
  const cookieDetailsHttps = { url: `https://${domain}/*` };
  // Remove cookies for both http and https versions of the domain
  chrome.cookies.getAll({ domain }, function (cookies) {
    cookies.forEach(function (cookie) {
      chrome.cookies.remove({ url: cookieDetailsHttp.url, name: cookie.name });
      chrome.cookies.remove({ url: cookieDetailsHttps.url, name: cookie.name });
    });
  });
}

// Function to handle the deletion of cookies based on user preferences.
function checkAndDeleteCookies() {
  chrome.storage.sync.get(['blacklistedCookies'], function (result) {
    const blacklistedCookies = result.blacklistedCookies || [];
    blacklistedCookies.forEach(function (cookie) {
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
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url) {
    delayedCheckAndDeleteCookies();
  }
});

// Also delete cookies with a delay when a new tab is created
chrome.tabs.onCreated.addListener(delayedCheckAndDeleteCookies);

// Listen for browser startup event
chrome.runtime.onStartup.addListener(function () {
  // Clear session storage
  chrome.storage.session.clear(function() {
    console.log('Session storage cleared.');
  });
  checkAndDeleteCookies();
});

// When a tab is updated, delete cookies again.
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url) {
    checkAndDeleteCookies();
  }
});

//Function to generate a unique ID for each cookie
function getCookieId(cookie) {
  return `${cookie.name}@${cookie.domain}`;
}

// Function to compare cookies to find added or removed ones
function compareCookies(initialCookies, currentCookies) {
  const initialSet = new Set(initialCookies.map(getCookieId));
  const currentSet = new Set(currentCookies.map(getCookieId));

  const added = currentCookies.filter(cookie => !initialSet.has(getCookieId(cookie)));
  const removed = initialCookies.filter(cookie => !currentSet.has(getCookieId(cookie)));

  return { added, removed };
}

// Saves the initial state of cookies for a domain in local storage
function saveInitialStateOfCookies(cookies, domain) {
  // Using a dynamic key for each domain to separate the cookie states
  let domainKey = `initialCookies_${domain}`;
  chrome.storage.local.set({[domainKey]: cookies});
}
// Function to get cookies for the current active tab's domain
function getCookiesForActiveTab(callback) {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs.length === 0) return; // No active tab
    const url = new URL(tabs[0].url);
    const domain = url.hostname;

    chrome.cookies.getAll({domain}, function(cookies) {
      callback(cookies, domain);
    });
  });
}

// Initialize local storage with existing cookies on the first run
chrome.runtime.onInstalled.addListener(() => {
  getCookiesForActiveTab((cookies, domain) => {
    saveInitialStateOfCookies(cookies);
  });
});

// Monitoring logic to check cookies every second
setInterval(() => {
  getCookiesForActiveTab((currentCookies, domain) => {
    let domainKey = `initialCookies_${domain}`;
    chrome.storage.local.get([domainKey], function(result) {
      const initialCookies = result[domainKey] || [];
      const { added, removed } = compareCookies(initialCookies, currentCookies);

      if (added.length > 0 || removed.length > 0) {
        // Update initialCookies in local storage for the current domain
        saveInitialStateOfCookies(currentCookies, domain);

        // Append and save cookie changes to session storage
        appendAndSaveCookieChanges(added, removed, domain); // Ensure 'domain' is defined in this scope

        // Trigger notification
        showNotification(added, removed, domain);
      }
    });
  });
}, 1000);

// Function to append and save cookie changes to session storage, now using domain
function appendAndSaveCookieChanges(added, removed, domain) {
  chrome.storage.session.get(['cookieChanges'], function(result) {
    // Retrieve existing records, or initialize an empty object if none
    let existingChanges = result.cookieChanges || {};
    existingChanges[domain] = existingChanges[domain] || {added: [], removed: []};

    // Append new actions to the existing records within the specific domain
    let updatedAdded = existingChanges[domain].added.concat(added);
    let updatedRemoved = existingChanges[domain].removed.concat(removed);

    // Update the domain-specific changes
    existingChanges[domain] = {added: updatedAdded, removed: updatedRemoved};

    // Save the updated records back to session storage
    chrome.storage.session.set({cookieChanges: existingChanges});
  });
}

// Function to trigger notifications, now includes the domain in the notification title
function showNotification(added, removed, domain) {
  let addedCookiesString = added.map(cookie => `${cookie.name}@${cookie.domain}`).join(', ');
  let removedCookiesString = removed.map(cookie => `${cookie.name}@${cookie.domain}`).join(', ');

  if (addedCookiesString.length > 100) addedCookiesString = addedCookiesString.substring(0, 100) + "...";
  if (removedCookiesString.length > 100) removedCookiesString = removedCookiesString.substring(0, 100) + "...";

  if (added.length > 0 || removed.length > 0) {
    chrome.notifications.create('', {
      type: "basic",
      iconUrl: "assets/icon.png",
      title: `Cookie Changes Detected - ${domain}`,
      message: `Added: ${addedCookiesString}, Removed: ${removedCookiesString}`
    });
  }
}


