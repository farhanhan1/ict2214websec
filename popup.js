function categorizeCookies(cookies) {
  let categories = {
    "Essential": [],
    "Performance": [],
    "Analytics": [],
    "Advertising": [],
    "SocialNetworking": [],
    "Unclassified": []
  };

  cookies.forEach(cookie => {
    // Add your categorization logic here
    // For example:
    if (cookie.name.includes('sess')) {
      categories.Essential.push(cookie);
    } else {
      categories.Unclassified.push(cookie);
    }
  });

  return categories;
}

function displayCookies(categories) {
  const container = document.getElementById('cookieList');
  Object.keys(categories).forEach(category => {
    let section = document.createElement('div');
    section.innerHTML = `<h2>${category}</h2><ul>${categories[category].map(cookie => `<li>${cookie.name}</li>`).join('')}</ul>`;
    container.appendChild(section);
  });
}

// On popup load
document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({active: true, currentWindow: true}, tabs => {
    chrome.runtime.sendMessage({action: "getCookies", url: tabs[0].url}, response => {
      let categorizedCookies = categorizeCookies(response.data);
      displayCookies(categorizedCookies);
    });
  });
});
