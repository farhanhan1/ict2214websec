// document.addEventListener('DOMContentLoaded', () => {
//   chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
//     const url = new URL(tabs[0].url).toString(); // Convert URL to string for consistency

//     chrome.storage.local.get([url], (result) => {
//       const data = result[url];

//       if (data && data.visits > 1) { // Check if the data exists and visits count is more than 1
//         console.log('Data for url:', url);
//         // Accessing cookies information
//         console.log('Added Cookies:', data.addedCookies);
//         console.log('Removed Cookies:', data.removedCookies);

//         // Update UI only if this is at least the second visit onwards
//         const addedCookies = data.addedCookies || [];
//         const removedCookies = data.removedCookies || [];

//         if (document.getElementById('addedCookies')) {
//           document.getElementById('addedCookies').innerHTML = addedCookies.length > 0 ?
//             `<h2>Added Cookies</h2><ul style="color: white;">${addedCookies.map(cookie => `<li>${cookie}</li>`).join('')}</ul>` :
//             `<h2>Added Cookies</h2><p style="color: #ccc;font-style: italic;">No cookies added during this session.</p>`;
//         }

//         if (document.getElementById('removedCookies')) {
//           document.getElementById('removedCookies').innerHTML = removedCookies.length > 0 ?
//             `<h2>Removed Cookies</h2><ul style="color: white;">${removedCookies.map(cookie => `<li>${cookie}</li>`).join('')}</ul>` :
//             `<h2>Removed Cookies</h2><p style="color: #ccc;font-style: italic;">No cookies removed during this session.</p>`;
//         }
//       } else {
//         // If it's the first visit or no data is available, set default values for these UI elements
//         if (document.getElementById('addedCookies')) {
//           document.getElementById('addedCookies').innerHTML = `<h2>Added Cookies</h2><p style="color: #ccc;font-style: italic;">No cookies added during this session.</p>`;
//         }

//         if (document.getElementById('removedCookies')) {
//           document.getElementById('removedCookies').innerHTML = `<h2>Removed Cookies</h2><p style="color: #ccc;font-style: italic;">No cookies removed during this session.</p>`;
//         }
//       }
//     });
//   });
// });


// function updateGUI() {
//   chrome.storage.session.get(['addedCookies', 'removedCookies'], function (result) {
//     const { addedCookies, removedCookies } = result;

//     // Update the GUI for added cookies
//     const addedCookiesContent = addedCookies && addedCookies.length > 0 ?
//       `<h2>Added Cookies</h2><ul>${addedCookies.map(cookie => `<li>${cookie.name}@${cookie.domain}</li>`).join('')}</ul>` :
//       `<h2>Added Cookies</h2><p>No cookies added during this session.</p>`;

//     // Update the GUI for removed cookies
//     const removedCookiesContent = removedCookies && removedCookies.length > 0 ?
//       `<h2>Removed Cookies</h2><ul>${removedCookies.map(cookie => `<li>${cookie.name}@${cookie.domain}</li>`).join('')}</ul>` :
//       `<h2>Removed Cookies</h2><p>No cookies removed during this session.</p>`;

//     if (document.getElementById('addedCookies')) {
//       document.getElementById('addedCookies').innerHTML = addedCookiesContent;
//     }

//     if (document.getElementById('removedCookies')) {
//       document.getElementById('removedCookies').innerHTML = removedCookiesContent;
//     }
//   });
// }

function updateGUI() {
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (tabs.length === 0) return; // No active tab found, so exit

    const url = new URL(tabs[0].url);
    const domain = url.hostname; // Extract domain from the tab's URL

    // Now fetch and display cookie changes specifically for this domain
    chrome.storage.session.get(['cookieChanges'], function(result) {
      const allChanges = result.cookieChanges || {};
      const changesForDomain = allChanges[domain] || {added: [], removed: []};

      // Dynamically build the display content based on the fetched changes
      // Note: You might want to handle duplicated cookie names if necessary
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
document.querySelector('.blue-thin-button').addEventListener('click', function () {
  window.history.back(); // This will take the user back to the previous page in their history
});