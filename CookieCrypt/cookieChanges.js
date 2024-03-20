// Global variable to track if update is in progress
let isUpdateInProgress = false;

function updateGUI() {
  // Only show the loading gif if update isn't already in progress
  if (!isUpdateInProgress) {
    document.getElementById('loadingIndicator').style.display = 'block';
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
        addedCookiesContent += `<ul style="color: #E5E1DA;margin-left:-20px">` + changesForDomain.added.map(cookie => `<li>${cookie.name}</li>`).join('') + `</ul>`;
      } else {
        addedCookiesContent += `<p style="color:#ccc;font-style:italic;">No cookies added during this session.</p>`;
      }

      let removedCookiesContent = `<h2>Removed Cookies for ${domain}</h2>`;
      if (changesForDomain.removed.length > 0) {
        removedCookiesContent += `<ul style="color: #E5E1DA">` + changesForDomain.removed.map(cookie => `<li>${cookie.name}</li>`).join('') + `</ul>`;
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
document.querySelector('.blue-thin-button').addEventListener('click', function () 
{
  // This will take the user back to the previous page in their history
  window.history.back(); 
});