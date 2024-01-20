chrome.runtime.onInstalled.addListener(() => {
  console.log('Cookie Categorizer installed.');
});

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "getCookies") {
    chrome.cookies.getAll({url: request.url}, (cookies) => {
      sendResponse({data: cookies});
    });
    return true; // Keep the message channel open for async response
  }
});
