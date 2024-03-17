// Categorizes cookies into predefined categories based on their name or domain
function categorizeCookies(cookies) {
  // Define categories
  let categories = {
    "Essential": [],
    "Performance": [],
    "Analytics": [],
    "Advertising": [],
    "SocialNetworking": [],
    "Unclassified": []
  };

  // Iterate over each cookie and categorize it
  cookies.forEach(cookie => {
    if (cookie.name.includes('sess') || cookie.name.includes('csrf') || cookie.name.includes('login')) {
      categories.Essential.push(cookie);
    } else if (cookie.domain.includes('google-analytics') || cookie.name.includes('performance')) {
      categories.Performance.push(cookie);
    } else if (cookie.name.includes('prefs') || cookie.name.includes('ui')) {
      categories.Analytics.push(cookie);
    } else if (cookie.name.includes('ad') || cookie.name.includes('track')) {
      categories.Advertising.push(cookie);
    } else if (cookie.domain.includes('facebook.com') || cookie.name.includes('share')) {
      categories.SocialNetworking.push(cookie);
    } else {
      categories.Unclassified.push(cookie);
    }
  });

  return categories;
}

// Displays cookies in the UI
function displayCookies(categories) {
  const container = document.getElementById('cookieList');
  container.innerHTML = '';

  // Loop through each category to display them
  Object.keys(categories).forEach(category => {
    let section = document.createElement('div');
    section.classList.add('cookie-category');

    let title = document.createElement('h2');
    title.innerText = `${category} (${categories[category].length})`;
    title.classList.add('category-title');
    title.addEventListener('click', () => {
      list.classList.toggle('collapsed');
    });

    let list = document.createElement('ul');
    list.classList.add('cookie-list', 'collapsed');

    // Loop through each cookie in the category
    categories[category].forEach(cookie => {
      let listItem = document.createElement('li');
      listItem.classList.add('cookie-item');

      let cookieName = document.createElement('div');
      cookieName.innerText = cookie.name;
      cookieName.classList.add('cookie-name');
      listItem.appendChild(cookieName);

      let arrowIcon = document.createElement('img');
      arrowIcon.src = 'down_arrow_logo.png';
      arrowIcon.classList.add('arrow-icon');
      arrowIcon.addEventListener('click', (event) => {
        event.stopPropagation();
        toggleCookieDetails(cookieDetails, arrowIcon);
      });
      listItem.appendChild(arrowIcon);

      let cookieDetails = document.createElement('div');
      cookieDetails.classList.add('cookie-details', 'collapsed');
      appendCookieDetails(cookieDetails, cookie);
      listItem.appendChild(cookieDetails);

      let editButton = cookieDetails.querySelector('.edit-button');
      editButton.addEventListener('click', () => {
        transformToEditable(cookieDetails, cookie, listItem);
      });

      let deleteButton = cookieDetails.querySelector('.delete-button');
      deleteButton.addEventListener('click', () => {
        confirmDeletion(cookie, () => { });
      });

      list.appendChild(listItem);
    });

    section.appendChild(title);
    section.appendChild(list);
    container.appendChild(section);
  });
}

// Appends cookie details to the details element
function appendCookieDetails(cookieDetails, cookie) {
  let cookieExpires = cookie.expirationDate ? new Date(cookie.expirationDate * 1000).toLocaleString() : 'Session';
  cookieDetails.innerHTML = `
    <strong>Value:</strong> <span class="cookie-value">${cookie.value}</span><br>
    <strong>Expires:</strong> <span class="cookie-expires">${cookieExpires}</span><br>
    <strong>Domain:</strong> <span class="cookie-domain">${cookie.domain}</span><br>
    <strong>Path:</strong> <span class="cookie-path">${cookie.path}</span><br>
    <strong>Secure:</strong> <span class="cookie-secure">${cookie.secure}</span><br>
    <strong>HttpOnly:</strong> <span class="cookie-httpOnly">${cookie.httpOnly}</span><br>
    <strong>SameSite:</strong> <span class="cookie-sameSite">${cookie.sameSite}</span><br>
    <strong>StoreId:</strong> <span class="cookie-storeId">${cookie.storeId || 'N/A'}</span><br>
    <button class="edit-button">Edit</button>
    <button class="delete-button">Delete</button>
  `;
}

// Toggles the display of cookie details
function toggleCookieDetails(cookieDetails, arrowIcon) {
  const isCollapsed = cookieDetails.classList.contains('collapsed');
  cookieDetails.classList.toggle('collapsed', !isCollapsed);
  arrowIcon.src = isCollapsed ? 'up_arrow_logo.png' : 'down_arrow_logo.png';
}

// Transforms cookie details view into an editable form
function transformToEditable(cookieDetails, cookie, listItem) {
  const originalDetailsContent = cookieDetails.innerHTML;

  // Create editable fields for each attribute
  const fields = createEditableFields(cookie);
  const saveButton = createButton('Save Changes', 'save-button', () => {
    saveCookieChanges(cookie, fields, listItem, cookieDetails);
  });

  const cancelButton = createButton('Cancel', 'cancel-button', () => {
    cookieDetails.innerHTML = originalDetailsContent;
    reattachEventListeners(cookieDetails, cookie, listItem);
  });

  cookieDetails.innerHTML = '';
  Object.values(fields).forEach(field => cookieDetails.appendChild(field));
  cookieDetails.appendChild(saveButton);
  cookieDetails.appendChild(cancelButton);
}

// Creates editable fields for cookie attributes
function createEditableFields(cookie) {
  const domainField = createEditableField(cookie.domain, 'editable-domain');
  domainField.disabled = true; // Disable the domain field
  domainField.style.backgroundColor = "#e9ecef"; // Gray out the field

  return {
    valueLabel: createLabel('Value:', 'editable-label'),
    valueField: createEditableField(cookie.value, 'editable-value'),
    expiresLabel: createLabel('Expires:', 'editable-label'),
    expiresField: createEditableField(new Date(cookie.expirationDate * 1000).toLocaleString(), 'editable-expires'),
    domainLabel: createLabel('Domain:', 'editable-label'),
    domainField: domainField,
    pathLabel: createLabel('Path:', 'editable-label'),
    pathField: createEditableField(cookie.path, 'editable-value'),
    secureLabel: createLabel('Secure:', 'editable-label'),
    secureField: createEditableField(cookie.secure.toString(), 'editable-value'),
    httpOnlyLabel: createLabel('HttpOnly:', 'editable-label'),
    httpOnlyField: createEditableField(cookie.httpOnly.toString(), 'editable-value'),
    sameSiteLabel: createLabel('SameSite:', 'editable-label'),
    sameSiteField: createEditableField(cookie.sameSite, 'editable-value'),
    storeIdLabel: createLabel('StoreId:', 'editable-label'),
    storeIdField: createEditableField(cookie.storeId || 'N/A', 'editable-value'),
  };
}

function createLabel(text, className) {
  const label = document.createElement('label');
  label.innerText = text;
  label.classList.add(className);
  return label;
}

function createButton(text, className, onClick) {
  const button = document.createElement('button');
  button.innerText = text;
  button.classList.add(className);
  button.addEventListener('click', onClick);
  return button;
}

function saveCookieChanges(originalCookie, fields, listItem, cookieDetails) {
  let expirationTimestamp = fields.expiresField.value ? new Date(fields.expiresField.value).getTime() / 1000 : originalCookie.expirationDate;
  if (isNaN(expirationTimestamp)) {
    expirationTimestamp = originalCookie.expirationDate;
  }

  const updatedCookie = {
    url: 'http://' + originalCookie.domain + originalCookie.path,
    name: originalCookie.name,
    value: fields.valueField.value,
    //domain: originalCookie.domain,
    path: fields.pathField.value,
    secure: fields.secureField.value === 'true',
    httpOnly: fields.httpOnlyField.value === 'true',
    sameSite: fields.sameSiteField.value,
    storeId: fields.storeIdField.value,
    expirationDate: expirationTimestamp
  };

  chrome.cookies.set(updatedCookie, (newCookie) => {
    if (chrome.runtime.lastError) {
      console.error('Error updating cookie:', chrome.runtime.lastError);
    } else {
      console.log('Cookie updated:', newCookie);
      appendCookieDetails(cookieDetails, newCookie || originalCookie);
      if (listItem) listItem.classList.remove('editing');
    }
  });
}

function reattachEventListeners(cookieDetails, cookie, listItem) {
  const editButton = cookieDetails.querySelector('.edit-button');
  editButton.addEventListener('click', () => transformToEditable(cookieDetails, cookie, listItem));

  const deleteButton = cookieDetails.querySelector('.delete-button');
  deleteButton.addEventListener('click', () => {
    confirmDeletion(cookie, () => { });
  });
}

function confirmDeletion(cookie, deleteCallback) {
  const confirmationDialog = document.createElement('div');
  confirmationDialog.innerHTML = `
    <p>Are you sure you want to delete '${cookie.name}'?</p>
    <button id="confirm-delete">Yes</button>
    <button id="cancel-delete">No</button>
  `;
  confirmationDialog.classList.add('confirmation-dialog');

  document.body.appendChild(confirmationDialog);

  document.getElementById('confirm-delete').addEventListener('click', () => {
    chrome.cookies.remove({ url: 'http://' + cookie.domain + cookie.path, name: cookie.name }, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else {
        console.log('Cookie deleted:', cookie.name);
      }
    });
    deleteCallback
      ();
    confirmationDialog.remove();
  });

  document.getElementById('cancel-delete').addEventListener('click', () => {
    confirmationDialog.remove();
  });
}

// Initialize display of cookies on document load
document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.runtime.sendMessage({ action: "getCookies", url: tabs[0].url }, response => {
      if (response && response.data) {
        let categorizedCookies = categorizeCookies(response.data);
        displayCookies(categorizedCookies);
      } else {
        console.error('No response or response data', chrome.runtime.lastError);
      }
    });
  });
  
  // Ensure the button exists in the DOM before adding an event listener
  const viewChangesButton = document.getElementById('viewCookieChanges');
  if (viewChangesButton) {
    viewChangesButton.addEventListener('click', () => {
      window.location.href = chrome.runtime.getURL('cookieChanges.html');
    });
  } else {
    console.error('Button not found');
  }
});


// Creates an editable text field
function createEditableField(text, className) {
  const input = document.createElement('textarea');
  input.classList.add(className);
  input.value = text;
  return input;
}
