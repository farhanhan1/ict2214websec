function updateGUI() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) 
  {
    // If no active tab found, exit
    if (tabs.length === 0) return; 

    const url = new URL(tabs[0].url);

    // Extract domain from the tab's URL
    const domain = url.hostname; 

    // Now fetch and display cookie changes specifically for this domain
    chrome.storage.session.get(['cookieChanges'], function(result) {
      const allChanges = result.cookieChanges || {};
      const changesForDomain = allChanges[domain] || {added: [], removed: []};

      // Dynamically build the display content based on the fetched changes
      let addedCookiesContent = `<h2>Added Cookies for ${domain}</h2>`;
      if (changesForDomain.added.length > 0) {
        addedCookiesContent += `<ul>` + changesForDomain.added.map(cookie => `<li>${cookie.name}@${cookie.domain}</li>`).join('') + `</ul>`;
      } else {
        addedCookiesContent += `<p>No cookies added during this session.</p>`;
      }

      let removedCookiesContent = `<h2>Removed Cookies for ${domain}</h2>`;
      if (changesForDomain.removed.length > 0) {
        removedCookiesContent += `<ul>` + changesForDomain.removed.map(cookie => `<li>${cookie.name}@${cookie.domain}</li>`).join('') + `</ul>`;
      } else {
        removedCookiesContent += `<p>No cookies removed during this session.</p>`;
      }

      // Update the GUI elements with the new content
      document.getElementById('addedCookies').innerHTML = addedCookiesContent;
      document.getElementById('removedCookies').innerHTML = removedCookiesContent;
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