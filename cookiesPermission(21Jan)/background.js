/* Version 2 */
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'block') {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var currentTab = tabs[0];
      if (currentTab) {
        console.log("Attempting to block cookies for:", currentTab.url);
        blockCookies(currentTab.url, sendResponse);
      }
    });
    return true; // Asynchronous response
  } else if (request.action === 'allow') {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      var currentTab = tabs[0];
      if (currentTab) {
        var domain = new URL(currentTab.url).hostname;
        allowCookies(domain, sendResponse);
      }
    });
    return true; // Asynchronous response
  } else if (request.action === 'remove') {
    removeAllBlockedCookies(sendResponse);
    return true; // Asynchronous response
  } else if (request.action === 'checkBlacklist') {
    logBlacklist(sendResponse);
    return true; // Indicate that the response is asynchronous
  }
});

// Update blockCookies to correctly remove cookies and handle async operations
function blockCookies(url, sendResponse) {
  chrome.cookies.getAll({url: url}, function(cookies) {
    var domain = new URL(url).hostname;
    var cookieNames = cookies.map(cookie => cookie.name);

    chrome.storage.sync.get({cookieBlacklist: {}}, function(data) {
      var blacklist = data.cookieBlacklist;
      blacklist[domain] = blacklist[domain] || [];
      cookieNames.forEach(name => {
        if (!blacklist[domain].includes(name)) {
          blacklist[domain].push(name);
        }
      });

      chrome.storage.sync.set({cookieBlacklist: blacklist}, function() {
        // Use promises to wait for all cookies to be removed
        Promise.all(cookies.map(cookie => {
          return new Promise((resolve, reject) => {
            chrome.cookies.remove({url: "https://" + domain, name: cookie.name}, function(details) {
              if (chrome.runtime.lastError) {
                console.error(`Error removing cookie ${cookie.name}: ${chrome.runtime.lastError}`);
                reject(chrome.runtime.lastError);
              } else {
                console.log(`Removed cookie: ${cookie.name}`);
                resolve(details);
              }
            });
          });
        })).then(() => {
          sendResponse({message: 'Cookies are blocked on this site'});
        }).catch(error => {
          console.error('Error removing cookies:', error);
          sendResponse({message: 'Error removing some cookies'});
        });
      });
    });
  });
  return true; // Asynchronous response
}

// function blockCookies(url, sendResponse) {
//   chrome.cookies.getAll({url: url}, function(cookies) {
//     var domain = new URL(url).hostname;
//     var cookieNames = cookies.map(cookie => cookie.name);

//     chrome.storage.sync.get({cookieBlacklist: {}}, function(data) {
//       var blacklist = data.cookieBlacklist;
//       blacklist[domain] = blacklist[domain] || [];
//       cookieNames.forEach(name => {
//         if (!blacklist[domain].includes(name)) {
//           blacklist[domain].push(name);
//         }
//       });

//       chrome.storage.sync.set({cookieBlacklist: blacklist}, function() {
//         cookies.forEach(cookie => {
//           chrome.cookies.remove({url: "https://" + domain, name: cookie.name});
//         });
//         sendResponse({message: 'Cookies are blocked on this site'});
//       });
//     });
//   });
// }

function allowCookies(domain, sendResponse) {
  chrome.storage.sync.get({cookieBlacklist: {}}, function(data) {
    var blacklist = data.cookieBlacklist;
    delete blacklist[domain];

    chrome.storage.sync.set({cookieBlacklist: blacklist}, function() {
      sendResponse({message: 'Cookies are now allowed on this site'});
    });
  });
}

function removeAllBlockedCookies(sendResponse) {
  chrome.storage.sync.get({cookieBlacklist: {}}, function(data) {
    var blacklist = data.cookieBlacklist;
    Object.keys(blacklist).forEach(domain => {
      blacklist[domain].forEach(cookieName => {
        chrome.cookies.remove({url: "https://" + domain, name: cookieName});
      });
    });

    chrome.storage.sync.set({cookieBlacklist: {}}, function() {
      sendResponse({message: 'All cookies from the blacklist have been removed'});
    });
  });
}

// Correctly log the current blacklist
function logBlacklist(sendResponse) {
  chrome.storage.sync.get('cookieBlacklist', function(data) {
    console.log('Current blacklist:', data.cookieBlacklist);
    if (sendResponse) {
      sendResponse({blacklist: data.cookieBlacklist});
    }
  });
}

// function logBlacklist(sendResponse) {
//   chrome.storage.sync.get('cookieBlacklist', function(data) {
//     console.log('Current blacklist:', data.cookieBlacklist);
//     if (sendResponse) {
//       sendResponse({blacklist: data.cookieBlacklist});
//     }
//   });
// }










/* Version 1 */
// // New global variable for the blacklist management
// var cookieBlacklist = {};

// chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
//   // Version 2: Allow/block cookies on the current site via 1 if statement
//   if (request.action === 'block') {
//     chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//       var currentTab = tabs[0];
//       if (currentTab) {
//         console.log("Attempting to block cookies for:", currentTab.url);
//         try {
//           var domain = new URL(currentTab.url).hostname;
//           cookieBlacklist[domain] = true;
//           blockCookies(currentTab.url, sendResponse);
//           chrome.storage.sync.set({'cookieBlacklist': cookieBlacklist});
//           logBlacklist();
//           console.log("Cookies successfully blocked for:", currentTab.url);
//         } catch (e) {
//           console.error("URL parsing error:", e.message);
//           sendResponse({message: "Error: Invalid URL"});
//           return;
//         }
//       }
//     });
//     return true; // Asynchronous response
//   }

//   if (request.action === 'allow') {
//     chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
//       var currentTab = tabs[0];
//       if (currentTab) {
//         var domain = new URL(currentTab.url).hostname;
//         removeAllBlockedCookies(sendResponse);
//       }
//     });
//     return true; // Asynchronous response
//   }

//   if (request.action === 'remove') {
//     // Get the blacklist and remove cookies for each domain
//     chrome.storage.sync.get('cookieBlacklist', function(data) {
//       var blacklist = data.cookieBlacklist || {};

//       // Remove cookies for each domain in the blacklist
//       Object.keys(blacklist).forEach(function(domain) {
//         // Assuming you have stored the full URL for each domain in the blacklist
//         chrome.cookies.getAll({url: domain}, function(cookies) {
//           for (let cookie of cookies) {
//             chrome.cookies.remove({url: domain, name: cookie.name});
//           }
//         });
//       });

//       // Clear the blacklist
//       chrome.storage.sync.set({'cookieBlacklist': {}}, function() {
//         sendResponse({message: 'All cookies from the blacklist have been removed'});
//       });
//     });
//     return true; // Asynchronous response
//   }

//   if (request.action === 'checkBlacklist') {
//     chrome.storage.sync.get('cookieBlacklist', function(data) {
//       sendResponse({blacklist: data.cookieBlacklist});
//     });
//     return true; // Indicate that the response is asynchronous
//   }
// });

// // This function blocks cookies and adds them to the blacklist
// function blockCookies(url, sendResponse) {
//   chrome.cookies.getAll({url: url}, function(cookies) {
//     var domain = new URL(url).hostname;
//     var cookieNames = cookies.map(cookie => cookie.name);

//     // Save cookie names to blacklist under their domain
//     chrome.storage.sync.get({cookieBlacklist: {}}, function(data) {
//       var blacklist = data.cookieBlacklist;
//       blacklist[domain] = (blacklist[domain] || []).concat(cookieNames);

//       // Remove duplicates if any
//       blacklist[domain] = [...new Set(blacklist[domain])];

//       chrome.storage.sync.set({cookieBlacklist: blacklist}, function() {
//         // After storing them in the blacklist, remove the cookies
//         cookies.forEach(cookie => {
//           chrome.cookies.remove({url: "https://" + domain, name: cookie.name}, function(details) {
//             // Log removed cookie for confirmation
//             console.log(`Removed cookie: ${cookie.name}`);
//           });
//         });
//         sendResponse({message: 'Cookies are blocked on this site'});
//       });
//     });
//   });
// }

// // This function removes all cookies from the blacklist
// function removeAllBlockedCookies(sendResponse) {
//   chrome.storage.sync.get({cookieBlacklist: {}}, function(data) {
//     var blacklist = data.cookieBlacklist;
//     Object.keys(blacklist).forEach(domain => {
//       blacklist[domain].forEach(cookieName => {
//         chrome.cookies.remove({url: "https://" + domain, name: cookieName}, function(details) {
//           // Log removed cookie for confirmation
//           console.log(`Removed cookie: ${cookieName} from domain: ${domain}`);
//         });
//       });
//     });

//     // Clear the blacklist after removal
//     chrome.storage.sync.set({cookieBlacklist: {}}, function() {
//       sendResponse({message: 'All cookies from the blacklist have been removed'});
//     });
//   });
// }

// function logBlacklist() {
//   chrome.storage.sync.get('cookieBlacklist', function(data) {
//     console.log('Current blacklist:', data.cookieBlacklist);
//   });
// }
