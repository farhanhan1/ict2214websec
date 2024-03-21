// Global variable to track if update is in progress
let isUpdateInProgress = false;
document.getElementById('loadingIndicator').style.display = 'block';

function updateGUI() {
  // Only show the loading gif if update isn't already in progress
  if (isUpdateInProgress) {
    document.getElementById('loadingIndicator').style.display = 'none';
    return;
  } else {
    isUpdateInProgress = true;
  }

  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs.length === 0) {
      document.getElementById('loadingIndicator').style.display = 'none';
      isUpdateInProgress = false;
      return;
    }

    const url = new URL(tabs[0].url);
    const domain = url.hostname;

    chrome.storage.session.get(['cookieChanges'], function(result) {
      const allChanges = result.cookieChanges || {};
      const changesForDomain = allChanges[domain] || { added: [], removed: [] };

      // Dynamically build the display content based on the fetched changes
      let addedCookiesContent = `<h2>Added Cookies for ${domain}</h2>`;
      if (changesForDomain.added.length > 0) {
        addedCookiesContent += `<ul style="color: #E5E1DA; margin-left:-20px">` + changesForDomain.added.map(cookie => `<li>${cookie.name}</li>`).join('') + `</ul>`;
      } else {
        addedCookiesContent += `<p style="color:#ccc;font-style:italic;">No cookies added during this session.</p>`;
      }

      let removedCookiesContent = `<h2>Removed Cookies for ${domain}</h2>`;
      if (changesForDomain.removed.length > 0) {
        removedCookiesContent += `<ul style="color: #E5E1DA; margin-left:-20px">` + changesForDomain.removed.map(cookie => `<li>${cookie.name}</li>`).join('') + `</ul>`;
      } else {
        removedCookiesContent += `<p style="color:#ccc;font-style:italic;">No cookies removed during this session.</p>`;
      }

      // Update the GUI elements with the new content
      document.getElementById('addedCookies').innerHTML = addedCookiesContent;
      document.getElementById('removedCookies').innerHTML = removedCookiesContent;

      // Once the data has been fetched and processed, hide the loading gif
      // and indicate that the update process is complete
      document.getElementById('loadingIndicator').style.display = 'none';
      isUpdateInProgress = false;

      document.getElementById('addedCookies').classList.add('slide-in-anim');
      document.getElementById('removedCookies').classList.add('slide-in-anim');
    });
  });
}


// Continuously check for changes in session storage
setInterval(updateGUI, 1000); 

// For the back button
document.querySelector('.gray-thin-button').addEventListener('click', function () 
{
  // This will take the user back to the previous page in their history
  window.history.back(); 
});

document.addEventListener('DOMContentLoaded', function() {
  updateGlobalNotifButtonLabelBasedOnStatus();
  updateSiteSpecificNotifButtonLabelBasedOnStatus();
});

// Handler for global notifications toggle
document.getElementById('toggleNotifButtonForAllSites').addEventListener('click', function() {
  let key = 'disableNotificationsforAll';
  chrome.storage.local.get([key], function(result) {
      if (result[key]) {
          chrome.storage.local.remove(key, function() {
              alert('Notifications globally enabled.');
              updateGlobalNotifButtonLabel('Disable Notifications Globally');
          });
      } else {
          chrome.storage.local.set({[key]: true}, function() {
              alert('Notifications globally disabled.');
              updateGlobalNotifButtonLabel('Enable Notifications Globally');
          });
      }
  });
});

// Handler for site-specific notifications toggle
document.getElementById('toggleNotifButtonForCurrentSite').addEventListener('click', function() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length === 0) return;
      const url = new URL(tabs[0].url);
      const domain = url.hostname;
      let key = `disableNotificationsFor${domain}`;
      chrome.storage.local.get([key], function(result) {
          if (result[key]) {
              chrome.storage.local.remove(key, function() {
                  alert(`Notifications enabled for ${domain}.`);
                  updateSiteSpecificNotifButtonLabel('Disable Notifications on Current Site');
              });
          } else {
              chrome.storage.local.set({[key]: true}, function() {
                  alert(`Notifications disabled for ${domain}.`);
                  updateSiteSpecificNotifButtonLabel('Enable Notifications on Current Site');
              });
          }
      });
  });
});

function updateGlobalNotifButtonLabelBasedOnStatus() {
  let key = 'disableNotificationsforAll';
  chrome.storage.local.get([key], function(result) {
      if (result[key]) {
          updateGlobalNotifButtonLabel('Enable Notifications Globally');
      } else {
          updateGlobalNotifButtonLabel('Disable Notifications Globally');
      }
  });
}

function updateSiteSpecificNotifButtonLabelBasedOnStatus() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      if (tabs.length === 0) return;
      const url = new URL(tabs[0].url);
      const domain = url.hostname;
      let key = `disableNotificationsFor${domain}`;
      chrome.storage.local.get([key], function(result) {
          if (result[key]) {
              updateSiteSpecificNotifButtonLabel('Enable Notifications on Current Site');
          } else {
              updateSiteSpecificNotifButtonLabel('Disable Notifications on Current Site');
          }
      });
  });
}

function updateGlobalNotifButtonLabel(newLabel) {
  const button = document.getElementById('toggleNotifButtonForAllSites');
  if (button) {
      button.textContent = newLabel;
  }
}

function updateSiteSpecificNotifButtonLabel(newLabel) {
  const button = document.getElementById('toggleNotifButtonForCurrentSite');
  if (button) {
      button.textContent = newLabel;
  }
}


