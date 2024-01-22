// Function to display cookies in the UI
function displayCookies(cookies) {
  const list = document.getElementById('cookieList');
  list.innerHTML = '';

  cookies.forEach(cookie => {
    const listItem = document.createElement('div');
    listItem.innerHTML = `
      <span>${cookie.name}</span>
      <button onclick="setCookieAction('${cookie.name}', 'allow')">Allow</button>
      <button onclick="setCookieAction('${cookie.name}', 'block')">Block</button>
      <button onclick="setCookieAction('${cookie.name}', 'delete')">Delete after session</button>
    `;
    list.appendChild(listItem);
  });
}

// Fetch cookies when the popup is loaded
document.addEventListener('DOMContentLoaded', function() {
  chrome.cookies.getAll({}, function(cookies) {
    displayCookies(cookies);
  });
});

// Function to handle button clicks
function setCookieAction(cookieName, action) {
  chrome.runtime.sendMessage({cookieName, action});
}

document.getElementById('allowBtn').addEventListener('click', function() {
  chrome.runtime.sendMessage({action: 'allow'}, function(response) {
    document.getElementById('status').textContent = response.message;
  });
});

document.getElementById('blockBtn').addEventListener('click', function() {
  chrome.runtime.sendMessage({action: 'block'}).then(response => {
    document.getElementById('status').textContent = response.message;
  }).catch(error => {
    console.error("Error:", error);
    document.getElementById('status').textContent = "Error occurred";
  });
});

document.getElementById('removeBtn').addEventListener('click', function() {
  chrome.runtime.sendMessage({action: 'remove'}, function(response) {
    document.getElementById('status').textContent = response.message;
  });
});

document.getElementById('checkBlacklistBtn').addEventListener('click', function() {
  chrome.runtime.sendMessage({action: 'checkBlacklist'}, function(response) {
    document.getElementById('status').textContent = "Blacklist: " + JSON.stringify(response.blacklist);
  });
});

