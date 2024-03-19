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

// Ensure cookies are deleted when the browser starts.
chrome.runtime.onStartup.addListener(function () {
  checkAndDeleteCookies();
});

// When a tab is updated, delete cookies again.
chrome.tabs.onUpdated.addListener(function (tabId, changeInfo, tab) {
  if (changeInfo.status === 'complete' && tab.url) {
    checkAndDeleteCookies();
  }
});

// // Real time monitoring of addition or deletion of cookies
// chrome.webNavigation.onCompleted.addListener((details) => {
//   const url = new URL(details.url).toString(); // Convert URL to string

//   chrome.storage.local.get([url], (result) => {
//     const storedData = result[url] ? result[url] : { cookies: [], visits: 0 };
//     const storedCookies = storedData.cookies;
//     const visits = storedData.visits;

//     chrome.cookies.getAll({ url: details.url }, (currentCookies) => {
//       const currentCookieNames = currentCookies.map(cookie => cookie.name);
//       const addedCookies = currentCookieNames.filter(name => !storedCookies.includes(name));
//       const removedCookies = storedCookies.filter(name => !currentCookieNames.includes(name));
//       const isSecondVisitOnwards = visits > 0; // Only true if visits counter is more than 0

//       // Update the storage with the current list of cookies and increment the visit count
//       chrome.storage.local.set({ [url]: { cookies: currentCookieNames, visits: visits + 1, addedCookies, removedCookies } }, () => {
//         if (chrome.runtime.lastError) {
//           console.error(`Error setting storage for ${url}: ${chrome.runtime.lastError.message}`);
//         } else if (isSecondVisitOnwards) {
//           let notificationMessage = '';
//           let notificationTitle = "Cookie Changes Detected";

//           if (addedCookies.length > 0 && removedCookies.length === 0) {
//             notificationMessage = `${addedCookies.length} cookie(s) added for ${url}.`;
//           } else if (removedCookies.length > 0 && addedCookies.length === 0) {
//             notificationMessage = `${removedCookies.length} cookie(s) removed for ${url}.`;
//           } else if (addedCookies.length > 0 && removedCookies.length > 0) {
//             notificationMessage = `${addedCookies.length} cookie(s) added, ${removedCookies.length} cookie(s) removed for ${url}.`;
//           }

//           if (addedCookies.length > 0 || removedCookies.length > 0) {
//             const notificationOptions = {
//               type: "basic",
//               iconUrl: "assets/icon.png", // Make sure this path is correct and the icon exists in your extension directory
//               title: notificationTitle,
//               message: notificationMessage,
//               buttons: [{ title: "View cookie changes" }],
//               requireInteraction: true // This makes the notification stay until the user interacts with it
//             };

//             // Create the notification
//             chrome.notifications.create("cookieNotification", notificationOptions);
//           }
//         }
//       });
//     });
//   });
// });

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
function saveInitialStateOfCookies(cookies) {
  chrome.storage.local.set({initialCookies: cookies});
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
    chrome.storage.local.get(['initialCookies'], function(result) {
      const initialCookies = result.initialCookies || [];
      const { added, removed } = compareCookies(initialCookies, currentCookies);

      if (added.length > 0 || removed.length > 0) {
        // Update initialCookies in local storage
        saveInitialStateOfCookies(currentCookies);

        // Update session storage with added/removed cookies
        chrome.storage.session.set({ addedCookies: added, removedCookies: removed });

        // Trigger notification
        showNotification(added, removed);
      }
    });
  });
}, 1000);

// Function to trigger Windows notification
function showNotification(added, removed) {
  let addedCookiesString = added.map(cookie => `${cookie.name}@${cookie.domain}`).join(', ');
  let removedCookiesString = removed.map(cookie => `${cookie.name}@${cookie.domain}`).join(', ');

  if (addedCookiesString.length > 100) addedCookiesString = addedCookiesString.substring(0, 100) + "...";
  if (removedCookiesString.length > 100) removedCookiesString = removedCookiesString.substring(0, 100) + "...";

  if (added.length > 0 || removed.length > 0) {
    chrome.notifications.create('', {
      type: "basic",
      iconUrl: "assets/icon.png",
      title: "Cookie Changes Detected",
      message: `Added: ${addedCookiesString}, Removed: ${removedCookiesString}`
    });
  }
}

