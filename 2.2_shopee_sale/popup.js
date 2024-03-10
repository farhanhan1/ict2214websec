// Function to fetch cookie category from Flask app for a batch of cookie names
async function fetchCookieCategories(cookieNames) {
  const response = await fetch('http://52.147.200.156:5000/predict_batch', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cookie_names: cookieNames })
  });
  const data = await response.json();
  return data.categories; // Assuming the Flask app returns an object with cookie names as keys and categories as values
}

// Asynchronously categorizes cookies into predefined categories based on their names using batch processing
async function categorizeCookies(cookies) {
  let categories = {
    "Necessary": [],
    "Functional": [],
    "Analytics": [],
    "Advertisement": [],
    "Performance": [],
    "Others": []
  };

  const cookieNames = cookies.map(cookie => cookie.name);
  const batchCategories = await fetchCookieCategories(cookieNames);

  cookies.forEach(cookie => {
    const category = batchCategories[cookie.name] ? capitalizeFirstLetter(batchCategories[cookie.name]) : 'Others';
    categories[category].push(cookie);
  });

  return categories;
}

// Helper function to capitalize the first letter of a string for category matching
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1).toLowerCase();
}

// Displays cookies in the UI
function displayCookies(categories) {
  const container = document.getElementById('cookieList');
  container.innerHTML = '';

  // Loop through each category to display them
  Object.keys(categories).forEach(category => {
    let section = document.createElement('div');
    section.classList.add('cookie-category');

    // Create and append the delete all button (Leaving it here but havent implement functionality yet)
    let deleteAllButton = document.createElement('button');
    deleteAllButton.innerText = 'Delete All';
    deleteAllButton.classList.add('delete-all-button');
    deleteAllButton.addEventListener('click', () => deleteAllCookiesInCategory(category));
    section.appendChild(deleteAllButton);

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
      editButton.classList.add('blue-thin-button');
      editButton.addEventListener('click', () => {
        transformToEditable(cookieDetails, cookie, listItem);
      });

      let deleteButton = cookieDetails.querySelector('.delete-button');
      deleteButton.classList.add('red-thin-button');
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
  // Add a new delete button "delete2"
  let delete2Button = document.createElement('button');
  delete2Button.innerText = 'Delete2';
  delete2Button.addEventListener('click', () => {
    // Call a new function to confirm deletion without blocking
    confirmActualDeletion(cookie);
  });
  cookieDetails.appendChild(delete2Button);
}

// Function to confirm actual deletion without blocking
function confirmActualDeletion(cookie) {
  if (confirm(`Are you sure you want to delete '${cookie.name}'?`)) {
    chrome.cookies.remove({ url: 'http://' + cookie.domain + cookie.path, name: cookie.name }, function (removed) {
      if (chrome.runtime.lastError) {
        console.error('Error deleting cookie:', chrome.runtime.lastError);
      } else {
        console.log('Cookie deleted:', cookie.name);
        refreshCookieList();
      }
    });
  }
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

  // Create the container for the buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('button-container');

  // Create save button
  const saveButton = createButton('Save Changes', 'save-button', () => {
    saveCookieChanges(cookie, fields, listItem, cookieDetails);
  });

  // Create cancel button
  const cancelButton = createButton('Cancel', 'cancel-button', () => {
    cookieDetails.innerHTML = originalDetailsContent;
    reattachEventListeners(cookieDetails, cookie, listItem);
  });

  // Append buttons to the container
  buttonContainer.appendChild(saveButton);
  buttonContainer.appendChild(cancelButton);

  // Clear the current cookie details and append new fields and the button container
  cookieDetails.innerHTML = '';
  Object.values(fields).forEach(field => cookieDetails.appendChild(field));
  cookieDetails.appendChild(buttonContainer); // Append the button container instead of individual buttons
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

// Call this function to display the deleted cookies list
function displayDeletedCookies() {
  chrome.storage.sync.get(['deletedCookies'], function (result) {
    var deletedCookies = result.deletedCookies || [];
    var listContainer = document.getElementById('deletedCookiesList');
    listContainer.innerHTML = '<h2>Chosen Cookies for Deletion</h2>';

    deletedCookies.forEach(function (cookie, index) {
      var listItem = document.createElement('div');
      listItem.textContent = `${cookie.name} (Domain: ${cookie.domain}) `;
      var unmarkButton = document.createElement('button');
      unmarkButton.textContent = 'Unmark';
      unmarkButton.onclick = function () {
        // Remove cookie from deletedCookies array and update storage
        unmarkCookieForDeletion(index);
      };
      listItem.appendChild(unmarkButton);
      listContainer.appendChild(listItem);
    });
  });
}

// Function to handle unmarking the cookie and reloading the tab
function unmarkCookieForDeletion(index) {
  chrome.storage.sync.get(['deletedCookies'], function (result) {
    var deletedCookies = result.deletedCookies || [];
    deletedCookies.splice(index, 1); // Remove the cookie at the specified index
    chrome.storage.sync.set({ deletedCookies: deletedCookies }, function () {
      if (chrome.runtime.lastError) {
        console.error('Error unmarking cookie for deletion:', chrome.runtime.lastError);
      } else {
        console.log('Cookie unmarked for deletion:', deletedCookies);
        displayDeletedCookies(); // Refresh the list
        refreshCookieList();
        // Now reload the current tab
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          const currentTab = tabs[0];
          if (currentTab) {
            chrome.tabs.reload(currentTab.id);
          }
        });
      }
    });
  });
}

// Call `displayDeletedCookies` in the DOMContentLoaded event listener
document.addEventListener('DOMContentLoaded', function () {
  displayDeletedCookies();
});

// Save the cookie to a "deleted cookies" list in storage
function saveUserPreference(cookie, callback) {
  chrome.storage.sync.get(['deletedCookies'], function (result) {
    const deletedCookies = result.deletedCookies || [];
    // Check if the cookie already exists in the array
    if (!deletedCookies.some(deletedCookie =>
      deletedCookie.name === cookie.name && deletedCookie.domain === cookie.domain)) {
      deletedCookies.push({ name: cookie.name, domain: cookie.domain, path: cookie.path });
      chrome.storage.sync.set({ deletedCookies: deletedCookies }, function () {
        if (chrome.runtime.lastError) {
          console.error('Error saving user preference:', chrome.runtime.lastError);
        } else {
          console.log('User preference saved:', deletedCookies);
        }
        callback();
      });
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

function refreshCookieList() {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const currentTab = tabs[0];
    if (currentTab) {
      chrome.cookies.getAll({ url: currentTab.url }, cookies => {
        if (cookies) {
          categorizeCookies(cookies).then(displayCookies);
        } else {
          console.error('No cookies found', chrome.runtime.lastError);
        }
      });
    }
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

  // Adding this function to have a separate gui for cookie changes
  const viewChangesButton = document.getElementById('viewCookieChanges');
  if (viewChangesButton) {
    viewChangesButton.addEventListener('click', () => {
      window.location.href = chrome.runtime.getURL('cookieChanges.html');
    });
  } else {
    console.error('Button not found');
  }
});


function confirmDeletion(cookie, deleteCallback) {
  const dialogContainer = document.getElementById('dialog-container'); // Get the dialog container
  const confirmationDialog = document.createElement('div');
  confirmationDialog.innerHTML = `
    <p>Are you sure you want to delete '${cookie.name}'?</p>
    <button id="confirm-delete">Yes</button>
    <button id="cancel-delete">No</button>
  `;
  confirmationDialog.classList.add('confirmation-dialog');

  // Append the confirmation dialog to the dialog container instead of the body
  dialogContainer.appendChild(confirmationDialog);
  dialogContainer.style.display = 'flex'; // Make the container visible

  // Now the elements are in the DOM, you can query them within the container
  confirmationDialog.querySelector('#confirm-delete').addEventListener('click', () => {
    chrome.cookies.remove({ url: 'http://' + cookie.domain + cookie.path, name: cookie.name }, function (removed) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else {
        console.log('Cookie deleted:', cookie.name);
        saveUserPreference(cookie, function () {
          displayDeletedCookies();
          refreshCookieList();
          // Reload the current tab
          chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
            const currentTab = tabs[0];
            if (currentTab) {
              chrome.tabs.reload(currentTab.id);
            }
          });
        });
      }
      dialogContainer.removeChild(confirmationDialog); // Remove the confirmation dialog
      dialogContainer.style.display = 'none'; // Hide the container
    });
  });

  confirmationDialog.querySelector('#cancel-delete').addEventListener('click', () => {
    dialogContainer.removeChild(confirmationDialog); // Remove the confirmation dialog
    dialogContainer.style.display = 'none'; // Hide the container
  });
}

// Creates an editable text field
function createEditableField(text, className) {
  const input = document.createElement('textarea');
  input.classList.add(className);
  input.value = text;
  return input;
}

// For categorization of cookies via Flask
// Fetching and displaying categorized cookies when the popup is opened
document.addEventListener('DOMContentLoaded', async () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0];
    if (currentTab) {
      // Attempt to retrieve cached categories
      chrome.storage.local.get([currentTab.id.toString()], (result) => {
        // Fallback to Fetch and categorize cookies
        chrome.cookies.getAll({ url: currentTab.url }, async (cookies) => {
          const categorizedCookies = await categorizeCookies(cookies);
          displayCookies(categorizedCookies);
        });
      });
    }
  });
});



// Function to show the form for creating a new cookie
function showCreateCookieForm() {
  const formContainer = document.getElementById('createCookieForm');
  if (formContainer) {
    formContainer.style.display = 'block';
  }
}

// Function to hide the form for creating a new cookie
function hideCreateCookieForm() {
  const formContainer = document.getElementById('createCookieForm');
  if (formContainer) {
    formContainer.style.display = 'none';
  }
}

// Function to create a new cookie based on form data
function createNewCookie() {
  const name = document.getElementById('cookieNameInput').value;
  const value = document.getElementById('cookieValueInput').value;
  const domain = document.getElementById('cookieDomainInput').value;
  const path = document.getElementById('cookiePathInput').value;
  // Get the value from the datetime-local input and convert it to a valid date
  const expiration = document.getElementById('cookieExpirationInput').value;
  const expirationDate = expiration ? new Date(expiration).getTime() / 1000 : undefined;
  const secure = document.getElementById('cookieSecureInput').checked;
  const httpOnly = document.getElementById('cookieHttpOnlyInput').checked;
  // const sameSiteRestriction = document.getElementById('cookieSameSiteSelect').value;

  const newCookie = {
    url: `http${secure ? 's' : ''}://${domain}${path}`,
    name,
    value,
    domain,
    path,
    secure,
    httpOnly,
    // sameSite: sameSiteRestriction,
    expirationDate
  };

  chrome.cookies.set(newCookie, () => {
    if (chrome.runtime.lastError) {
      console.error('Error setting cookie:', chrome.runtime.lastError);
    } else {
      console.log('Cookie set successfully:', newCookie);
      hideCreateCookieForm();

      // Refresh the cookie list to include the new cookie
      refreshCookieList(); // Call this function to update the UI
    }
  });
}

// Add the event listeners for the Create Cookie button and form
document.addEventListener('DOMContentLoaded', function () {
  // Add event listeners here
  const createCookieButton = document.getElementById('createCookieButton');
  const saveCookieButton = document.getElementById('saveCookieButton');
  const cancelCreateButton = document.getElementById('cancelCreateCookie');

  if (createCookieButton && saveCookieButton && cancelCreateButton) {
    createCookieButton.addEventListener('click', showCreateCookieForm);
    saveCookieButton.addEventListener('click', createNewCookie);
    cancelCreateButton.addEventListener('click', hideCreateCookieForm);
  } else {
    console.error('One or more elements do not exist in the DOM.');
  }

  // Set the current domain in the form
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentDomain = new URL(tabs[0].url).hostname;
    const domainInput = document.getElementById('cookieDomainInput');
    if (domainInput) {
      domainInput.value = currentDomain;
    }
  });
});