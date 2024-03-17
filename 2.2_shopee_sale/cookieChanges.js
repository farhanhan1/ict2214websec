document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const url = new URL(tabs[0].url).toString();

    chrome.storage.local.get([url], (result) => {
      const data = result[url];

      if (data) {
        console.log('Data for url:', url);
        console.log('Added Cookies:', data.addedCookies);
        console.log('Removed Cookies:', data.removedCookies);

        const addedCookies = data.addedCookies || [];
        const removedCookies = data.removedCookies || [];

        if (document.getElementById('addedCookies')) {
          const addedContent = addedCookies.length > 0
            ? `<h2>Added Cookies</h2><ul>${addedCookies.map(cookie => `<li>${cookie}</li>`).join('')}</ul>`
            : `<h2>Added Cookies</h2><p>No cookies added during this session.</p>`;
          document.getElementById('addedCookies').innerHTML = addedContent;
        }

        if (document.getElementById('removedCookies')) {
          const removedContent = removedCookies.length > 0
            ? `<h2>Removed Cookies</h2><ul>${removedCookies.map(cookie => `<li>${cookie}</li>`).join('')}</ul>`
            : `<h2>Removed Cookies</h2><p>No cookies removed during this session.</p>`;
          document.getElementById('removedCookies').innerHTML = removedContent;
        }
      } else {
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


