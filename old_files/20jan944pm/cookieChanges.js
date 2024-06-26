document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const url = new URL(tabs[0].url).toString(); // Convert URL to string for consistency
  
      chrome.storage.local.get([url], (result) => {
        const data = result[url];
  
        if (data && data.visits > 1) { // Check if the data exists and visits count is more than 1
          console.log('Data for url:', url);
          // Accessing cookies information
          console.log('Added Cookies:', data.addedCookies);
          console.log('Removed Cookies:', data.removedCookies);
  
          // Update UI only if this is at least the second visit onwards
          const addedCookies = data.addedCookies || [];
          const removedCookies = data.removedCookies || [];
          
          if (document.getElementById('addedCookies')) {
            document.getElementById('addedCookies').innerHTML = `<h2>Added Cookies</h2><ul>${addedCookies.map(cookie => `<li>${cookie}</li>`).join('')}</ul>`;
          }
  
          if (document.getElementById('removedCookies')) {
            document.getElementById('removedCookies').innerHTML = `<h2>Removed Cookies</h2><ul>${removedCookies.map(cookie => `<li>${cookie}</li>`).join('')}</ul>`;
          }
        } else {
          // If it's the first visit or no data is available, you might want to clear or set default values for these UI elements
          if (document.getElementById('addedCookies')) {
            document.getElementById('addedCookies').innerHTML = `<h2>Added Cookies</h2><p>No cookies added during this session.</p>`;
          }
  
          if (document.getElementById('removedCookies')) {
            document.getElementById('removedCookies').innerHTML = `<h2>Removed Cookies</h2><p>No cookies removed during this session.</p>`;
          }
        }
      });
    });
  });
  