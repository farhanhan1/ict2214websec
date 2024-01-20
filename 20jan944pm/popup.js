function categorizeCookies(cookies) {
  let categories = {
    "Essential": [],
    "Performance": [],
    "Analytics": [],
    "Advertising": [],
    "SocialNetworking": [],
    "Unclassified": []
  };

  // Cookie categorization algo
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

  Object.keys(categories).forEach(category => {
    let section = document.createElement('div');
    section.classList.add('cookie-category');

    let title = document.createElement('h2');
    title.innerText = `${category} (${categories[category].length})`;
    title.classList.add('category-title');

    let list = document.createElement('ul');
    list.classList.add('cookie-list', 'collapsed');

    categories[category].forEach(cookie => {
      let listItem = document.createElement('li');
      listItem.classList.add('cookie-item');

      let cookieName = document.createElement('div');
      cookieName.innerText = cookie.name;
      cookieName.classList.add('cookie-name');
      listItem.appendChild(cookieName);

      // Arrow icon setup
      let arrowIcon = document.createElement('img');
      arrowIcon.src = 'down_arrow_logo.png'; // Path to your down arrow icon
      arrowIcon.classList.add('arrow-icon');
      arrowIcon.addEventListener('click', (event) => {
        event.stopPropagation();
        const isCollapsed = cookieDetails.classList.contains('collapsed');
        cookieDetails.classList.toggle('collapsed', !isCollapsed);
        arrowIcon.src = isCollapsed ? 'up_arrow_logo.png' : 'down_arrow_logo.png';
      });
      listItem.appendChild(arrowIcon);

      // Hide cookie details by default
      let cookieDetails = document.createElement('div');
      cookieDetails.classList.add('cookie-details', 'collapsed');
      listItem.appendChild(cookieDetails);
      list.appendChild(listItem);

      // Toggle cookie details on arrow icon click
      arrowIcon.addEventListener('click', () => {
        let isCollapsed = cookieDetails.style.display === 'none';
        cookieDetails.style.display = isCollapsed ? 'block' : 'none';
        arrowIcon.src = isCollapsed ? 'up_arrow_logo.png' : 'down_arrow_logo.png';  // Paths to your arrow icons
      });


      let cookieExpires = cookie.expirationDate ? new Date(cookie.expirationDate * 1000).toLocaleString() : 'Session';
      cookieDetails.innerHTML = `
      <strong>Value:</strong> <span class="cookie-value">${cookie.value}</span><br>
      <strong>Expires:</strong> ${cookieExpires}<br>
      <button class="edit-button">Edit</button>
      <button class="delete-button">Delete</button>
    `;
      cookieDetails.classList.add('cookie-details', 'collapsed');
      listItem.appendChild(cookieDetails);

      listItem.addEventListener('click', event => {
        if (!event.target.classList.contains('edit-button') && !event.target.classList.contains('delete-button')) {
          cookieDetails.classList.toggle('collapsed');
        }
      });

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

    title.addEventListener('click', () => {
      list.classList.toggle('collapsed');
    });

    section.appendChild(title);
    section.appendChild(list);
    container.appendChild(section);
  });
}

// For edit function
function createEditableField(text, className) {
  const input = document.createElement('textarea');
  input.classList.add(className);
  input.value = text;
  return input;
}


// Function to transform cookie details into editable fields
function transformToEditable(cookieDetails, cookie) {
  const originalDetailsContent = cookieDetails.innerHTML;

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

  const saveButton = document.createElement('button');
  saveButton.innerText = 'Save Changes';
  saveButton.classList.add('save-button');
  saveButton.addEventListener('click', () => {
    saveCookieChanges(cookie.name, valueField.value, new Date(expiresField.value));
  });

  cookieDetails.appendChild(saveButton);

    // Add Cancel button
    const cancelButton = document.createElement('button');
    cancelButton.innerText = 'Cancel';
    cancelButton.classList.add('cancel-button');
    cancelButton.addEventListener('click', () => {
        // Revert to the original details view
        cookieDetails.innerHTML = originalDetailsContent;

        // Reattach event listeners for Edit and Delete buttons since the innerHTML was reset
        const editButton = cookieDetails.querySelector('.edit-button');
        editButton.addEventListener('click', () => transformToEditable(cookieDetails, cookie));

        const deleteButton = cookieDetails.querySelector('.delete-button');
        deleteButton.addEventListener('click', () => {
            confirmDeletion(cookie, () => {
                // Delete logic here
            });
        });

        // Update the arrow icon and collapse the details
        const arrowIcon = cookieDetails.previousSibling;  // Assuming arrowIcon is added just before cookieDetails
        arrowIcon.src = 'down_arrow_logo.png';  // Change to down arrow
    });

    // Clear the current details and add the new editable fields and buttons
    cookieDetails.innerHTML = '';
    cookieDetails.appendChild(valueLabel);
    cookieDetails.appendChild(valueField);
    cookieDetails.appendChild(expiresLabel);
    cookieDetails.appendChild(expiresField);
    cookieDetails.appendChild(saveButton);
    cookieDetails.appendChild(cancelButton);
}



// For save function
function saveCookieChanges(cookie, value, expires) {
  let expirationTimestamp = new Date(expires).getTime() / 1000;

  // Check if the expiration date is valid
  if (isNaN(expirationTimestamp)) {
    alert("Invalid expiration date. Please enter a valid date.");
    return;
  }

  chrome.cookies.set({
    url: 'http://' + cookie.domain + cookie.path,
    name: cookie.name,
    value: value,
    domain: cookie.domain,
    path: cookie.path,
    secure: cookie.secure,
    httpOnly: cookie.httpOnly,
    expirationDate: expirationTimestamp,
    sameSite: cookie.sameSite
  }, (newCookie) => {
    if (chrome.runtime.lastError) {
      console.error(chrome.runtime.lastError);
    } else {
      console.log('Cookie updated:', newCookie);
    }
  });
}


// For delete function
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
    deleteCallback();
    confirmationDialog.remove();
  });

  document.getElementById('cancel-delete').addEventListener('click', () => {
    confirmationDialog.remove();
  });
}

document.addEventListener('DOMContentLoaded', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
    chrome.runtime.sendMessage({ action: "getCookies", url: tabs[0].url }, response => {
      if (response && response.data) {
        let categorizedCookies = categorizeCookies(response.data);
        displayCookies(categorizedCookies);
      } else {
        console.error('No response or response data', chrome.runtime.lastError);
        // Handle the error or display a message to the user
      }
    });
  });
});