// Function to fetch cookie category from Flask app for a batch of cookie names
async function fetchCookieCategories(cookieNames) {
  // Display loading indicator
  document.getElementById('loadingIndicator').style.display = 'block';

  try {
    const response = await fetch('http://52.147.200.156:5000/predict_batch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cookie_names: cookieNames })
    });

    const data = await response.json();

    // Hide loading indicator
    document.getElementById('loadingIndicator').style.display = 'none';

    return data.categories; // Assuming the Flask app returns an object with cookie names as keys and categories as values
  } catch (error) {
    console.error('Error fetching data:', error);

    // Hide loading indicator on error
    document.getElementById('loadingIndicator').style.display = 'none';
  }
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

    let title = document.createElement('h2');
    title.innerText = `${category} (${categories[category].length})`;
    title.classList.add('category-title');
    // Variable to keep track of the current style state
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
      cookieDetails.classList.add('cookie-details');
      // Below is to start with expanded cookie instead
      // // cookieDetails.classList.add('cookie-details', 'collapsed');
      appendCookieDetails(cookieDetails, cookie);
      listItem.appendChild(cookieDetails);

      let editButton = cookieDetails.querySelector('.edit-button');
      // editButton.classList.add('blue-thin-button');
      editButton.addEventListener('click', () => {
        transformToEditable(cookieDetails, cookie, listItem, category);
      });

      let blacklistButton = cookieDetails.querySelector('.blacklist-button');

      // Set data attributes for the category and other details
      blacklistButton.setAttribute('data-cookie-name', cookie.name);
      blacklistButton.setAttribute('data-cookie-domain', cookie.domain);
      blacklistButton.setAttribute('data-cookie-path', cookie.path);
      blacklistButton.setAttribute('data-cookie-category', category);

      blacklistButton.addEventListener('click', () => {
        confirmBlacklist(cookie, category, () => { });
      });

      list.appendChild(listItem);
    });


    section.appendChild(title);
    if (categories[category].length === 0) {
      // Display a message if no cookies are in the category
      let noCookiesMessage = document.createElement('p');
      noCookiesMessage.textContent = 'No cookies in this category.';
      noCookiesMessage.classList.add('no-cookies-message');
      noCookiesMessage.style.fontStyle = 'italic';
      noCookiesMessage.style.color = '#ccc';
      section.appendChild(noCookiesMessage);
    } else {
      // Create and append the delete all button
      let blacklistAllButton = document.createElement('button');
      blacklistAllButton.innerText = 'Blacklist Category';
      blacklistAllButton.classList.add('blacklist-category-button');
      blacklistAllButton.style.float = 'right';
      blacklistAllButton.style.marginTop = '-26px'; // Adjust the amount to move it higher


      blacklistAllButton.addEventListener('click', () => {
        blacklistAllCookiesInCategory(category, categories[category]);
      });
      section.appendChild(blacklistAllButton);
    }

    section.appendChild(list);
    container.appendChild(section);
  });
}

// Appends cookie details to the details element
function appendCookieDetails(cookieDetails, cookie) {
  let cookieExpires = cookie.expirationDate ? new Date(cookie.expirationDate * 1000).toLocaleString() : 'Session';
  cookieDetails.innerHTML = `
    <strong style="color: #E5E1DA; padding-right: 21px;">Value:</strong> <span class="cookie-value">${cookie.value}</span><br>
    <strong style="color: #E5E1DA; padding-right: 10px;">Expires:</strong> <span class="cookie-expires">${cookieExpires}</span><br>
    <strong style="color: #E5E1DA; padding-right: 9px;">Domain:</strong> <span class="cookie-domain">${cookie.domain}</span><br>
    <strong style="color: #E5E1DA; padding-right: 25px;">Path:</strong> <span class="cookie-path">${cookie.path}</span><br>
    <strong style="color: #E5E1DA; padding-right: 14px; margin-left:-1px;">Secure:</strong> <span class="cookie-secure">${cookie.secure}</span><br>
    <strong style="color: #E5E1DA; padding-right: 3px;">HttpOnly:</strong> <span class="cookie-httpOnly">${cookie.httpOnly}</span><br>
    <strong style="color: #E5E1DA; padding-right: 1px; margin-left: -1px;">SameSite:</strong> <span class="cookie-sameSite">${cookie.sameSite}</span><br>
    <strong style="color: #E5E1DA; padding-right: 12px; margin-left:-1px;">StoreId:</strong> <span class="cookie-storeId">${cookie.storeId || 'N/A'}</span><br>
    <button style="margin-top: 10px;" class="edit-button">Edit</button>
    <button class="blacklist-button">Blacklist</button>
  `;
  // Add a new delete button "delete2"
  let delete2Button = document.createElement('button');
  delete2Button.innerText = 'Delete';
  delete2Button.classList.add('delete-thin-button');
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
  arrowIcon.src = isCollapsed ? 'down_arrow_logo.png' : 'up_arrow_logo.png';
}

// Transforms cookie details view into an editable form
function transformToEditable(cookieDetails, cookie, listItem, category) {
  const originalDetailsContent = cookieDetails.innerHTML;

  // Create editable fields for each attribute
  const fields = createEditableFields(cookie);

  // Create the container for the buttons
  const buttonContainer = document.createElement('div');
  buttonContainer.classList.add('button-container');

  // Create save button
  const saveButton = createButton('Save Changes', 'save-button', () => {
    saveCookieChanges(cookie, fields, listItem, cookieDetails, category);
  });

  // Create cancel button
  const cancelButton = createButton('Cancel', 'cancel-button', () => {
    cookieDetails.innerHTML = originalDetailsContent;
    reattachEventListeners(cookieDetails, cookie, listItem, category);
    const delete2Button = cookieDetails.querySelector('.delete-thin-button');
    delete2Button.addEventListener('click', () => {
      confirmActualDeletion(cookie);
    });
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

function saveCookieChanges(originalCookie, fields, listItem, cookieDetails, category) {
  let expirationTimestamp = fields.expiresField.value ? new Date(fields.expiresField.value).getTime() / 1000 : originalCookie.expirationDate;
  if (isNaN(expirationTimestamp)) {
    expirationTimestamp = originalCookie.expirationDate;
  }

  const protocol = fields.secureField.value === 'true' ? "https://" : "http://";
  const domainForCookieSet = originalCookie.domain.startsWith('.') ? originalCookie.domain.substring(1) : originalCookie.domain;
  const isSubdomainCookie = originalCookie.domain.startsWith('.');

  const updatedCookie = {
    url: protocol + domainForCookieSet + originalCookie.path,
    name: originalCookie.name,
    value: fields.valueField.value,
    path: fields.pathField.value,
    secure: fields.secureField.value === 'true',
    httpOnly: fields.httpOnlyField.value === 'true',
    sameSite: fields.sameSiteField.value,
    storeId: fields.storeIdField.value,
    expirationDate: expirationTimestamp
  };

  // Decide whether to include the domain property based on whether it's a subdomain cookie
  if (isSubdomainCookie) {
    updatedCookie.domain = domainForCookieSet;
  }

  console.log('Updating cookie with details:', updatedCookie);

  chrome.cookies.set(updatedCookie, (newCookie) => {
    if (chrome.runtime.lastError) {
      console.error('Error updating cookie:', chrome.runtime.lastError.message);
      // Additional logging for debugging
      console.log('Failed cookie details:', updatedCookie);
      console.log(chrome.runtime.lastError);
    } else {
      console.log('Cookie successfully updated:', newCookie);
      appendCookieDetails(cookieDetails, newCookie || originalCookie);
      if (listItem) listItem.classList.remove('editing');
      reattachEventListeners(cookieDetails, newCookie, listItem, category);
    }
  });
}

// Function to display blacklisted cookies
function displayBlacklistedCookies() {
  chrome.storage.sync.get(['blacklistedCookies'], function (result) {
    const blacklistedCookies = result.blacklistedCookies || [];

    // Log the retrieved blacklisted cookies to inspect their categories
    console.log('Retrieved blacklisted cookies:', blacklistedCookies);

    // New grouping by category with console log to check if categories are correct
    const cookiesByCategory = blacklistedCookies.reduce((acc, cookie) => {
      // Using the category from the cookie or defaulting to 'Others'
      const category = cookie.category || 'Others';
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(cookie);
      return acc;
    }, {});

    // Log the grouped cookies by category
    console.log('Grouped cookies by category:', cookiesByCategory);

    updateBlacklistUI(cookiesByCategory);
    refreshCookieList();
  });
}

// Called from displayBlacklistedCookies to update the UI
function updateBlacklistUI(cookiesByCategory) {
  console.log('Updating Blacklist UI with categories:', Object.keys(cookiesByCategory)); // Check the categories about to be displayed

  const listContainer = document.getElementById('blacklistCookiesList');
  listContainer.innerHTML = '<h2>Cookie Blacklist</h2>'; // Reset the container

    // Check if the blacklist is empty
  if (Object.keys(cookiesByCategory).length === 0) {
    listContainer.innerHTML += '<p style="font-style: italic; color: #ccc;">No cookies/categories currently blacklisted.</p>';
  } else {
    Object.entries(cookiesByCategory).forEach(([category, cookies]) => {
      console.log(`Displaying category: ${category} with ${cookies.length} cookies`); // Check each category being displayed
      const categoryElement = createCategoryElement(category, cookies);
      listContainer.appendChild(categoryElement);
    });
  }
}

// Called from updateBlacklistUI to create a section for each category
function createCategoryElement(category, cookies) {
  const categorySection = document.createElement('section');
  const categoryTitle = document.createElement('h3');
  categoryTitle.style.color = "white";
  categoryTitle.textContent = `${category} (${cookies.length})`;
  categorySection.appendChild(categoryTitle);

  const unmarkAllButton = document.createElement('button');
  unmarkAllButton.textContent = 'Unmark All';
  unmarkAllButton.style.float = 'right';
  unmarkAllButton.classList.add('unmark-all-button');
  unmarkAllButton.classList.add('blacklist-category-button');
  // Adjust the top margin to move the button higher
  unmarkAllButton.style.marginTop = '-35px'; // Adjust the amount to move it higher
  unmarkAllButton.style.marginRight = '10px';
  unmarkAllButton.addEventListener('click', function () {
    // Implement unmark all logic here
    unmarkAllCookiesInCategory(category);
  });

  const cookieList = document.createElement('ul');
  cookieList.style.paddingLeft = '0'; // Remove indentation by setting padding-left to 0
  cookieList.style.marginLeft = '20px'; // Remove indentation by setting padding-left to 0

  categorySection.appendChild(unmarkAllButton); // Append the button before the cookie list
  categorySection.appendChild(cookieList); // Append the cookie list

  cookies.forEach((cookie) => {
    const cookieItem = document.createElement('li');
    cookieItem.innerHTML = `<b>${cookie.name}</b><br><i>(Domain: ${cookie.domain})</i> `;
    cookieItem.style.color = "white";

    const unmarkButton = document.createElement('button');
    unmarkButton.textContent = 'Unmark';
    unmarkButton.style.float = 'right'; // Float the button to the right
    unmarkButton.style.marginRight = '10px'; // Adjust the amount it's flushed
    unmarkButton.classList.add('gray-thin-button');

    // Adjust the top margin to move the button higher
    unmarkButton.style.marginTop = '-15px'; // Adjust the amount to move it higher

    unmarkButton.addEventListener('click', function () {
      // Implement unmark logic here
      unmarkCookieForBlacklist(cookie.identifier);
    });

    cookieItem.appendChild(unmarkButton);
    cookieList.appendChild(cookieItem);
  });

  return categorySection;
}


// Function to unmark a cookie from the blacklist
function unmarkCookieForBlacklist(cookieIdentifier) {
  chrome.storage.sync.get(['blacklistedCookies'], function (result) {
    let blacklistedCookies = result.blacklistedCookies || [];
    // Find the index of the cookie to unmark
    const indexToUnmark = blacklistedCookies.findIndex(cookie => cookie.identifier === cookieIdentifier);
    if (indexToUnmark !== -1) {
      blacklistedCookies.splice(indexToUnmark, 1); // Remove the cookie
    }

    // Save the updated array
    chrome.storage.sync.set({ blacklistedCookies: blacklistedCookies }, function () {
      if (chrome.runtime.lastError) {
        console.error('Error unmarking cookie:', chrome.runtime.lastError);
      } else {
        console.log('Cookie unmarked:', cookieIdentifier);
        displayBlacklistedCookies(); // Refresh the list
        refreshCookieList(); // Refresh the cookie list
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

// Function to unmark all cookies in a category from the blacklist
function unmarkAllCookiesInCategory(category) {
  chrome.storage.sync.get(['blacklistedCookies'], function (result) {
    let blacklistedCookies = result.blacklistedCookies || [];
    // Filter out the cookies that are not in the specified category
    const cookiesToRemain = blacklistedCookies.filter(cookie => cookie.category !== category);
    const cookiesToUnmark = blacklistedCookies.filter(cookie => cookie.category === category);

    // Set the updated blacklisted cookies list
    chrome.storage.sync.set({ blacklistedCookies: cookiesToRemain }, function () {
      if (chrome.runtime.lastError) {
        console.error('Error updating blacklist while unmarking:', chrome.runtime.lastError);
      } else {
        console.log(`Unmarked all cookies in category: ${category}`);

        // Add the unmarked cookies back to the main list by re-categorizing them
        recategorizeAndDisplayUnmarkedCookies(cookiesToUnmark);

        // Refresh the list and blacklist display
        displayBlacklistedCookies();
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

// Called from unmarkAllCookiesInCategory to recategorize and display unmarked cookies
function recategorizeAndDisplayUnmarkedCookies(cookies) {
  // Simulate fetching of cookies again, and then display them
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    const currentTab = tabs[0];
    if (currentTab) {
      chrome.cookies.getAll({ url: currentTab.url }, async foundCookies => {
        if (foundCookies) {
          // Combine the found cookies with the unmarked cookies
          const combinedCookies = foundCookies.concat(cookies);
          const categorizedCookies = await categorizeCookies(combinedCookies);
          displayCookies(categorizedCookies);
          displayBlacklistedCookies(); // Also refresh the blacklist display
        } else {
          console.error('No cookies found after unmarking:', chrome.runtime.lastError);
        }
      });
    }
  });
}

// Save the cookie to a "blacklisted cookies" list in storage
function saveUserPreference(cookie, category, callback) {
  chrome.storage.sync.get(['blacklistedCookies'], function (result) {
    let blacklistedCookies = result.blacklistedCookies || [];

    // Construct cookie identifier
    let cookieIdentifier = `${cookie.name}@${cookie.domain}`;
    let existingCookie = blacklistedCookies.find(c => c.identifier === cookieIdentifier);
    if (!existingCookie) {
      blacklistedCookies.push({
        identifier: cookieIdentifier, // Unique identifier
        name: cookie.name,
        domain: cookie.domain,
        path: cookie.path,
        category: category // Category of the cookie
      });

      // Save the updated list back to storage
      chrome.storage.sync.set({ blacklistedCookies }, function () {
        if (chrome.runtime.lastError) {
          console.error('Error saving user preference:', chrome.runtime.lastError);
        } else {
          console.log('User preference saved:', blacklistedCookies);
          if (callback) {
            callback();
          }
        }
      });
    } else {
      console.log('Cookie already exists in the blacklist.');
    }
  });
}

function reattachEventListeners(cookieDetails, cookie, listItem, category) {
  // Find the edit and delete buttons within the cookieDetails
  const editButton = cookieDetails.querySelector('.edit-button');
  const blacklistButton = cookieDetails.querySelector('.blacklist-button');

  // Check if editButton and blacklistButton elements exist before adding event listeners
  if (editButton) {
    editButton.addEventListener('click', () => transformToEditable(cookieDetails, cookie, listItem));
  } else {
    console.error('Edit button not found.');
  }

  if (blacklistButton) {
    blacklistButton.addEventListener('click', () => {
      confirmBlacklist(cookie, category);
    });
  } else {
    console.error('Blacklist button not found.');
  }
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

// Another dialog container overlay to prompt confirmation
function confirmBlacklist(cookie, category) {
  return new Promise((resolve, reject) => {
    const dialogContainer = document.getElementById('dialog-container'); // Get the dialog container
    const confirmationDialog = document.createElement('div');
    confirmationDialog.innerHTML = `
      <p>Are you sure you want to blacklist '${cookie.name}'?</p>
      <button class="red-thin-button" id="confirm-blacklist">Yes</button>
      <button class="blue-thin-button" id="cancel-blacklist">No</button>
    `;
    confirmationDialog.classList.add('confirmation-dialog');
    cookie.category = category; // Set the category of the cookie
    // Set data attributes on the confirmation dialog
    confirmationDialog.setAttribute('data-cookie-name', cookie.name);
    confirmationDialog.setAttribute('data-cookie-domain', cookie.domain);
    confirmationDialog.setAttribute('data-cookie-path', cookie.path);
    confirmationDialog.setAttribute('data-cookie-category', cookie.category);

    // Append the confirmation dialog to the dialog container instead of the body
    dialogContainer.appendChild(confirmationDialog);
    dialogContainer.style.display = 'flex'; // Make the container visible

    // If confirm button is clicked, send a message to background.js for aggressive removal
    confirmationDialog.querySelector('#confirm-blacklist').addEventListener('click', () => {
      chrome.cookies.remove({ url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`, name: cookie.name }, function (removed) {
        if (chrome.runtime.lastError) {
          console.error('Error blacklisting cookie:', chrome.runtime.lastError);
          reject(chrome.runtime.lastError);
        } else {
          console.log('Cookie blacklisted:', cookie.name, cookie.category);
          // Then, update the UI
          addCookieToBlacklistUI([cookie]);
          resolve();

        }

        // Optionally reload the current tab if necessary
        chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
          const currentTab = tabs[0];
          if (currentTab) {
            chrome.tabs.reload(currentTab.id);
          }
        });
      });
      dialogContainer.removeChild(confirmationDialog); // Remove the confirmation dialog
      dialogContainer.style.display = 'none'; // Hide the container
    });

    // If cancel button is clicked, remove the confirmation dialog and hide the container
    confirmationDialog.querySelector('#cancel-blacklist').addEventListener('click', () => {
      dialogContainer.removeChild(confirmationDialog); // Remove the confirmation dialog
      dialogContainer.style.display = 'none'; // Hide the container
    });
  });
  refreshCookieList();
}

// Called from confirmBlacklist to add the cookie to the blacklist
function addCookieToBlacklistUI(cookies) {
  if (!Array.isArray(cookies)) {
    cookies = [cookies]; // Ensure it's always an array
  }
  chrome.storage.sync.get(['blacklistedCookies'], function (result) {
    let blacklistedCookies = result.blacklistedCookies || [];

    cookies.forEach(cookie => {
      let cookieIdentifier = `${cookie.name}@${cookie.domain}`;

      if (!blacklistedCookies.some(existingCookie => existingCookie.identifier === cookieIdentifier)) {
        blacklistedCookies.push({
          identifier: cookieIdentifier,
          name: cookie.name,
          domain: cookie.domain,
          path: cookie.path,
          category: cookie.category // Category of the cookie
        });
      }
    });

    chrome.storage.sync.set({ blacklistedCookies }, function () {
      if (chrome.runtime.lastError) {
        console.error('Error updating blacklist:', chrome.runtime.lastError);
      } else {
        console.log('Blacklist updated:', blacklistedCookies);
        displayBlacklistedCookies(); // Refresh the blacklist display
      }
    });
  });
}

// Creates an editable text field
function createEditableField(text, className) {
  const input = document.createElement('textarea');
  input.classList.add(className);
  input.value = text;
  return input;
}

// Function to show the form for creating a new cookie
function showCreateCookieForm() {
  // Get the current tab's URL
  chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
    const currentTabUrl = tabs[0].url;
    const currentDomain = new URL(currentTabUrl).hostname;

    // Pre-fill cookieDomainInput with the current domain
    const cookieDomainInput = document.getElementById('cookieDomainInput');
    cookieDomainInput.value = currentDomain;
  });
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
  // Trim leading dot if present in the domain input value
  const trimmedDomain = domain.startsWith('.') ? domain.substring(1) : domain;
  const path = document.getElementById('cookiePathInput').value;
  // Get the value from the datetime-local input and convert it to a valid date
  const expiration = document.getElementById('cookieExpirationInput').value;
  const expirationDate = expiration ? new Date(expiration).getTime() / 1000 : undefined;
  const secure = document.getElementById('cookieSecureInput').checked;
  const httpOnly = document.getElementById('cookieHttpOnlyInput').checked;
  // const sameSiteRestriction = document.getElementById('cookieSameSiteSelect').value;

  const newCookie = {
    url: `http${secure ? 's' : ''}://${trimmedDomain}${path}`,
    name,
    value,
    // domain,
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

function wipeAllCookiesForDomain() {
  if (confirm("Are you sure you want to delete ALL cookies for this domain?")) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      const url = new URL(tabs[0].url);
      const domain = url.hostname;

      // Getting all cookies for the domain
      chrome.cookies.getAll({ domain }, (cookies) => {
        cookies.forEach((cookie) => {
          // Constructing a URL to pass to chrome.cookies.remove
          let cookieUrl = (cookie.secure ? "https://" : "http://") + cookie.domain + cookie.path;

          chrome.cookies.remove({ url: cookieUrl, name: cookie.name }, (details) => {
            console.log(`Deleted cookie ${cookie.name}`);
          });
        });
        refreshCookieList();
      });
    });
  } else {
    // User did not confirm, do nothing.
    console.log("User canceled the cookie deletion.");
  }
}

// function from blacklistAllButton event listener
async function blacklistAllCookiesInCategory(category, cookies) {
  const dialogContainer = document.getElementById('dialog-container'); // Get the dialog container
  const confirmationDialog = document.createElement('div');
  confirmationDialog.innerHTML = `
    <p>Are you sure you want to blacklist all cookies in the '${category}' category?</p>
    <button class="red-thin-button" id="confirm-blacklistAll">Yes</button>
    <button class="blue-thin-button" id="cancel-blacklistAll">No</button>
  `;
  confirmationDialog.classList.add('confirmation-dialog');

  // Set data attributes on the confirmation dialog
  confirmationDialog.setAttribute('data-cookie-category', category);

  // Append the confirmation dialog to the dialog container instead of the body
  dialogContainer.appendChild(confirmationDialog);
  dialogContainer.style.display = 'flex'; // Make the container visible

  // If confirm button is clicked, send a message to background.js for aggressive removal
  confirmationDialog.querySelector('#confirm-blacklistAll').addEventListener('click', () => {
    const cookiesToRemove = [];
    cookies.forEach(cookie => {
      // Remove each cookie using the chrome.cookies.remove API
      // Set the cookie's category before blacklisting
      cookie.category = category; // This ensures the cookie retains its category when added to the blacklist
      cookiesToRemove.push(cookie);
      chrome.cookies.remove({
        url: `http${cookie.secure ? 's' : ''}://${cookie.domain}${cookie.path}`,
        name: cookie.name
      });

      // Add each cookie to the blacklist UI
      addCookieToBlacklistUI(cookiesToRemove);
      console.log('Cookie blacklisted:', cookie.name, cookie.domain, cookie.path, cookie.category);
    });

    // Close the confirmation dialog and hide the container
    dialogContainer.removeChild(confirmationDialog); // Remove the confirmation dialog
    dialogContainer.style.display = 'none'; // Hide the container
  });

  // If cancel button is clicked, remove the confirmation dialog and hide the container
  confirmationDialog.querySelector('#cancel-blacklistAll').addEventListener('click', () => {
    dialogContainer.removeChild(confirmationDialog); // Remove the confirmation dialog
    dialogContainer.style.display = 'none'; // Hide the container
  });

  refreshCookieList();
}

// Combine DOMContentLoaded event listeners
document.addEventListener('DOMContentLoaded', function () {
  const wipeAllButton = document.getElementById('wipeAllCookiesButton');
  wipeAllButton.addEventListener('click', wipeAllCookiesForDomain);

  document.getElementById('dialog-container').addEventListener('click', function (event) {
    // Check if the clicked element is a blacklist button
    if (event.target && event.target.id === 'confirm-blacklist') {
      // Retrieve the cookie information somehow. This might be stored on the dialog
      const dialog = event.target.closest('.confirmation-dialog');
      const cookieName = dialog.getAttribute('data-cookie-name');
      const cookieDomain = dialog.getAttribute('data-cookie-domain');
      const cookiePath = dialog.getAttribute('data-cookie-path');
      const cookieCategory = dialog.getAttribute('data-cookie-category');

      const cookie = {
        name: cookieName,
        domain: cookieDomain,
        path: cookiePath,
        category: cookieCategory
      };
      saveUserPreference(cookie, cookieCategory)
    }
  });

  (async function () {
    // Show blacklisted cookies as soon DOM is loaded
    displayBlacklistedCookies();

    // Handle cookie change GUI setup
    setupCookieChangesGUI();

    // Query the current tab
    const tabs = await getCurrentTab();
    const currentTab = tabs[0];

    // Handle getting cookies and setting up UI
    if (currentTab) {
      // Handles fetching and categorisation of cookies
      await setupCookiesUI(currentTab);

      // Set up the create cookie form
      setupCreateCookieForm(currentTab);
    }
  })();
});

// DOMContLoaded 1. Setup separate GUI for cookie changes
function setupCookieChangesGUI() {
  const viewChangesButton = document.getElementById('viewCookieChanges');
  if (viewChangesButton) {
    viewChangesButton.addEventListener('click', () => {
      window.location.href = chrome.runtime.getURL('cookieChanges.html');
    });
  } else {
    console.error('Button not found');
  }
}

// DOMContLoaded 2. Cookie categories via Flask Pt1: query current tab
async function getCurrentTab() {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError));
      } else {
        resolve(tabs);
      }
    });
  });
}

// DOMContLoaded 3. Cookie categories via Flask Pt2: get stored categories + cookies
async function setupCookiesUI(currentTab) {
  // Code from your second and third DOMContentLoaded listener
  const result = await getStoredCategories(currentTab.id.toString());
  const cookies = await getCookies(currentTab.url);
  const categorizedCookies = await categorizeCookies(cookies);
  displayCookies(categorizedCookies);
}

// Called by setupCookiesUI to get stored categories
async function getStoredCategories(tabId) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get([tabId], (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError));
      } else {
        resolve(result[tabId] || {});
      }
    });
  });
}

// Called by setupCookiesUI to get cookies
async function getCookies(url) {
  return new Promise((resolve, reject) => {
    chrome.cookies.getAll({ url: url }, (cookies) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError));
      } else {
        resolve(cookies);
      }
    });
  });
}

// DOMContLoaded 4. Setup of create cookie form
function setupCreateCookieForm(tabs) {
  // Code from your fourth DOMContentLoaded listener
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
}