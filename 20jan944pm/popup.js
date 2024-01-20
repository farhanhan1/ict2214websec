// Categorizes cookies into predefined categories based on their name or domain attributes.
function categorizeCookies(cookies) {
  let categories = {
    "Essential": [],
    "Performance": [],
    "Analytics": [],
    "Advertising": [],
    "SocialNetworking": [],
    "Unclassified": []
  };

  // Iterate over each cookie and categorize them according to specific keywords in their names or domains.
  cookies.forEach(cookie => {
    if (cookie.name.includes('sess') || cookie.name.includes('Sess') || cookie.name.includes('csrf')
      || cookie.name.includes('login')) {
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

// Function to display cookies in the UI
function displayCookies(categories) {
  const container = document.getElementById('cookieList');
  container.innerHTML = '';

  // Iterate over each category to create and display them in the UI
  Object.keys(categories).forEach(category => {
    let section = document.createElement('div');
    section.classList.add('cookie-category');

    let title = document.createElement('h2');
    title.innerText = `${category} (${categories[category].length})`;
    title.classList.add('category-title');

    // Set up the event listener for the category title to toggle display of its cookies
    title.addEventListener('click', () => {
      list.classList.toggle('collapsed');
    });

    let list = document.createElement('ul');
    list.classList.add('cookie-list', 'collapsed');

    // Create and append list items (cookies) for each category
    categories[category].forEach(cookie => {
      let listItem = document.createElement('li');
      listItem.classList.add('cookie-item');

      let cookieName = document.createElement('div');
      cookieName.innerText = cookie.name;
      cookieName.classList.add('cookie-name');
      listItem.appendChild(cookieName);

      // Arrow icon setup for toggling cookie details
      let arrowIcon = document.createElement('img');
      arrowIcon.src = 'down_arrow_logo.png'; // Placeholder image path
      arrowIcon.classList.add('arrow-icon');
      arrowIcon.addEventListener('click', (event) => {
        event.stopPropagation();
        const isCollapsed = cookieDetails.classList.contains('collapsed');
        cookieDetails.classList.toggle('collapsed', !isCollapsed);
        arrowIcon.src = isCollapsed ? 'up_arrow_logo.png' : 'down_arrow_logo.png';
      });
      listItem.appendChild(arrowIcon);

      // Create and initially hide the detailed view of cookies
      let cookieDetails = document.createElement('div');
      cookieDetails.classList.add('cookie-details', 'collapsed');
      listItem.appendChild(cookieDetails);
      list.appendChild(listItem);

      // Populate the detailed view with cookie information and action buttons.
      let cookieExpires = cookie.expirationDate ? new Date(cookie.expirationDate * 1000).toLocaleString() : 'Session';
      cookieDetails.innerHTML = `
        <strong>Value:</strong> <span class="cookie-value">${cookie.value}</span><br>
        <strong>Expires:</strong> ${cookieExpires}<br>
        <button class="edit-button">Edit</button>
        <button class="delete-button">Delete</button>
      `;
      listItem.appendChild(cookieDetails);

      // Event listeners for edit and delete actions.
      let editButton = cookieDetails.querySelector('.edit-button');
      editButton.addEventListener('click', () => {
        transformToEditable(cookieDetails, cookie);
      });

      let deleteButton = cookieDetails.querySelector('.delete-button');
      deleteButton.addEventListener('click', () => {
        confirmDeletion(cookie, () => {
          // This callback is empty, as the actual delete operation is handled in confirmDeletion
        });
      });

      list.appendChild(listItem);
    });

    section.appendChild(title);
    section.appendChild(list);
    container.appendChild(section);
  });
}

// Creates an editable text area for cookie values or expiration dates.
function createEditableField(text, className) {
  const input = document.createElement('textarea');
  input.classList.add(className);
  input.value = text;
  return input;
}

// Transforms a cookie's details view into an editable form to allow users to change the cookie's value or expiration date.
function transformToEditable(cookieDetails, cookie) {
  // Store the original non-editable view of the cookie details.
  const originalDetailsContent = cookieDetails.innerHTML;

  // Create labels and editable fields for the 'Value' and 'Expires' attributes.
  const valueLabel = document.createElement('label');
  valueLabel.innerText = 'Value:';
  valueLabel.classList.add('editable-label');

  const valueField = createEditableField(cookie.value, 'editable-value');
  valueField.addEventListener('click', (event) => event.stopPropagation());

  const expiresLabel = document.createElement('label');
  expiresLabel.innerText = 'Expires:';
  expiresLabel.classList.add('editable-label');

  const expiresField = createEditableField(new Date(cookie.expirationDate * 1000).toLocaleString(), 'editable-expires');
  expiresField.addEventListener('click', (event) => event.stopPropagation());

  // Create 'Save Changes' and 'Cancel' buttons, attaching event listeners for their functionality.
  const saveButton = document.createElement('button');
  saveButton.innerText = 'Save Changes';
  saveButton.classList.add('save-button');
  saveButton.addEventListener('click', () => {
    saveCookieChanges(cookie.name, valueField.value, new Date(expiresField.value));
  });

  const cancelButton = document.createElement('button');
  cancelButton.innerText = 'Cancel';
  cancelButton.classList.add('cancel-button');
  cancelButton.addEventListener('click', () => {
    // Revert the cookie details view back to the original non-editable state.
    cookieDetails.innerHTML = originalDetailsContent;

    // Reattach event listeners to the newly added 'Edit' and 'Delete' buttons.
    const newEditButton = cookieDetails.querySelector('.edit-button');
    newEditButton.addEventListener('click', () => transformToEditable(cookieDetails, cookie));

    const newDeleteButton = cookieDetails.querySelector('.delete-button');
    newDeleteButton.addEventListener('click', () => {
      confirmDeletion(cookie, () => {
        // Delete logic here
      });
    });

    // Reset the arrow icon to indicate the details are now collapsed.
    const arrowIcon = listItem.querySelector('.arrow-icon');
    arrowIcon.src = 'down_arrow_logo.png'; // Placeholder image path
  });

  // Clear the current details view and add the new editable fields and buttons.
  cookieDetails.innerHTML = '';
  cookieDetails.appendChild(valueLabel);
  cookieDetails.appendChild(valueField);
  cookieDetails.appendChild(expiresLabel);
  cookieDetails.appendChild(expiresField);
  cookieDetails.appendChild(saveButton);
  cookieDetails.appendChild(cancelButton);
}

// Updates a cookie's value or expiration date using the Chrome cookies API.
function saveCookieChanges(cookieName, value, expires) {
  // Convert the expiration date to a Unix timestamp.
  let expirationTimestamp = new Date(expires).getTime() / 1000;

  // Validate the expiration date.
  if (isNaN(expirationTimestamp)) {
    alert("Invalid expiration date. Please enter a valid date.");
    return;
  }

  // Set the cookie with the updated values.
  chrome.cookies.set({
    url: 'http://' + cookie.domain + cookie.path,
    name: cookieName,
    value: value,
    domain: cookie.domain,
    path: cookie.path,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    expirationDate: expirationTimestamp,
    sameSite: cookie.sameSite
  }, (newCookie) => {
    // Check for errors and log the outcome.
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
    } else {
      console.log('Cookie updated:', newCookie);
    }
  });
}

// Displays a confirmation dialog before deleting a cookie.
function confirmDeletion(cookie, deleteCallback) {
  // Create and display the confirmation dialog.
  const confirmationDialog = document.createElement('div');
  confirmationDialog.innerHTML = `
    <p>Are you sure you want to delete '${cookie.name}'?</p>
    <button id="confirm-delete">Yes</button>
    <button id="cancel-delete">No</button>
  `;
  confirmationDialog.classList.add('confirmation-dialog');

  // Append the dialog to the body and set up button event listeners.
  document.body.appendChild(confirmationDialog);

  document.getElementById('confirm-delete').addEventListener('click', () => {
    // Remove the cookie and execute the callback function.
    chrome.cookies.remove({ url: 'http://' + cookie.domain + cookie.path, name: cookie.name }, () => {
      // Log any errors or confirm the deletion.
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
      } else {
        console.log('Cookie deleted:', cookie.name);
      }
    });
    deleteCallback();
    confirmationDialog.remove();
  });

  document.getElementById('cancel-delete').addEventListener('click', () => {
    // Close the confirmation dialog without performing any action.
    confirmationDialog.remove();
  });
}

// Initialization on document load to set up the cookie list display.
document.addEventListener('DOMContentLoaded', () => {
  // Query the active tab and request the cookies from it.
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.runtime.sendMessage({ action: "getCookies", url: tabs[0].url }, response => {
      // Categorize and display the cookies if the data is retrieved successfully.
      if (response && response.data) {
        let categorizedCookies = categorizeCookies(response.data);
        displayCookies(categorizedCookies);
      } else {
        // Log any errors or indicate issues in retrieving cookie data.
        console.error('No response or response data', chrome.runtime.lastError);
      }
    });
  });
});
