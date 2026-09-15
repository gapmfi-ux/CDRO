/**
 * ============================================================
 * MAIN APPLICATION LOGIC
 * ============================================================
 * Handles UI rendering, interactions, and state management
 */

// ============================================================
// STATE MANAGEMENT
// ============================================================
let loanRows = [];
let currentUser = null;

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function escapeHtml(unsafe) {
  if (!unsafe) return '';
  return unsafe.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatNumber(value) {
  if (value === null || value === undefined) return '';
  return isNaN(value) ? value : Number(value).toLocaleString();
}

function formatDisplayDate(dateString) {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    return isNaN(date.getTime()) ? dateString : date.toLocaleDateString('en-GB');
  } catch (e) {
    console.warn('Date formatting error for:', dateString, e);
    return dateString;
  }
}

function showNoDataMessage(tbody, colSpan = 7, msg = "No data found") {
  tbody.innerHTML = `
    <tr>
      <td colspan="${colSpan}" style="text-align:center; padding:20px; color:#666;">
        ${msg}
      </td>
    </tr>
  `;
}

// ============================================================
// LOAN DATA & TABLE RENDERING
// ============================================================
function loadLoanData() {
  api.getLoanData()
    .then(rows => {
      loanRows = rows;
      renderLoanTable(loanRows);
      populateOfficerDropdown();
    })
    .catch(err => console.error('loadLoanData failed:', err));
}

function populateOfficerDropdown() {
  const filter = document.getElementById('creditOfficerFilter');
  if (!filter) return;
  
  const officerSet = new Set();
  loanRows.forEach(row => {
    if (row[11]) officerSet.add(row[11].trim());
  });
  
  filter.innerHTML = '<option value="">All Credit Officers</option>';
  Array.from(officerSet)
    .sort()
    .forEach(officer => {
      filter.innerHTML += `<option value="${officer}">${officer}</option>`;
    });
}

function renderLoanTable(rows) {
  const table = document.getElementById('loan-table-body');
  table.innerHTML = '';
  
  if (!Array.isArray(rows) || rows.length === 0) {
    showNoDataMessage(table, 13, "No loans with arrears found");
    return;
  }
  
  rows.forEach((row, idx) => {
    table.innerHTML += `
      <tr>
        <td>${row[0]}</td>
        <td>${row[1]}</td>
        <td>${row[2]}</td>
        <td>${row[3]}</td>
        <td>${row[4]}</td>
        <td>${row[5]}</td>
        <td class="red">${row[6]}</td>
        <td class="red">${row[7]}</td>
        <td class="red">${row[8]}</td>
        <td>${row[9]}</td>
        <td>${row[11]}</td>
        <td>
          <div class="action-dropdown" id="action-dropdown-${idx}">
            <button class="dropdown-btn" onclick="handleDropdown(event, ${idx})">Actions ▼</button>
            <div class="dropdown-content">
              <a onclick="handleDropdownAction('followup', '${row[0]}')">Add Call Comment</a>
              <a onclick="handleDropdownAction('callreport', '${row[0]}')">View Call Report</a>
            </div>
          </div>
        </td>
      </tr>
    `;
  });
}

function filterLoanTableByOfficer() {
  const selected = document.getElementById('creditOfficerFilter').value;
  const filtered = !selected 
    ? loanRows 
    : loanRows.filter(row => row[11] && row[11].trim() === selected);
  renderLoanTable(filtered);
}

// ============================================================
// DROPDOWN INTERACTIONS
// ============================================================
function handleDropdown(event, index, dropdownClass = 'action-dropdown', idPrefix = 'action-dropdown-') {
  event.stopPropagation();
  document.querySelectorAll('.' + dropdownClass).forEach(el => el.classList.remove('show'));
  document.getElementById(idPrefix + index).classList.toggle('show');
}

function handleDropdownAction(action, loanNum) {
  const row = loanRows.find(r => String(r[0]) === String(loanNum));
  if (action === 'followup') openFollowUpModal(row);
  else if (action === 'callreport') openCallReportModal(loanNum);
  document.querySelectorAll('.action-dropdown').forEach(el => el.classList.remove('show'));
}

function toggleSidebarDropdown(event, idx) {
  handleDropdown(event, idx, 'sidebar-dropdown-content', 'sidebar-dropdown-content-');
}

document.addEventListener('click', function() {
  document.querySelectorAll('.action-dropdown').forEach(el => el.classList.remove('show'));
  document.querySelectorAll('.sidebar-dropdown-content').forEach(el => el.classList.remove('show'));
});

// ============================================================
// MODAL HELPERS
// ============================================================
function openModal(id) {
  document.getElementById(id).style.display = "flex";
}

function closeModal(id) {
  document.getElementById(id).style.display = "none";
}

function openAddUserModal() { openModal('addUserModal'); }
function closeAddUserModal() { closeModal('addUserModal'); }
function openUserListModal() {
  openModal('userListModal');
  loadUserList();
}
function closeUserListModal() { closeModal('userListModal'); }

window.addEventListener('click', function(event) {
  ['addUserModal', 'userListModal'].forEach(id => {
    const el = document.getElementById(id);
    if (event.target === el) closeModal(id);
  });
});

// ============================================================
// USER MANAGEMENT
// ============================================================
window.addEventListener('DOMContentLoaded', function() {
  const form = document.getElementById('addUserForm');
  if (form) form.addEventListener('submit', submitAddUserForm);
});

function submitAddUserForm(e) {
  e.preventDefault();
  const form = document.getElementById('addUserForm');
  const data = {
    creditOfficerName: form.creditOfficerName.value,
    username: form.username.value,
    defaultPassword: form.defaultPassword.value,
    userRole: form.userRole.value
  };
  
  api.saveUser(data)
    .then(msg => {
      alert(msg);
      closeAddUserModal();
      form.reset();
    })
    .catch(err => alert("Error: " + err.message));
}

function loadUserList() {
  api.getUserList()
    .then(users => {
      const tbody = document.getElementById('userListTableBody');
      tbody.innerHTML = '';
      
      if (!users.length) {
        showNoDataMessage(tbody, 6, "No users found.");
        return;
      }
      
      users.forEach(user => {
        const initials = user.creditOfficer.split(' ').map(w => w[0]).join('').toUpperCase();
        tbody.innerHTML += `
          <tr>
            <td>${user.number}</td>
            <td>
              <div class="officer-info">
                <span class="officer-initials">${initials}</span>
                <span class="officer-name">${user.creditOfficer}</span>
              </div>
            </td>
            <td><span class="user-username">${user.username}</span></td>
            <td class="password-column">••••••••</td>
            <td><span class="role-badge role-${user.role.toLowerCase()}">${user.role}</span></td>
            <td style="text-align:center;">
              <button class="reset-btn" title="Reset Password">Reset</button>
              <button class="remove-btn" title="Remove User">Remove</button>
            </td>
          </tr>
        `;
      });
    })
    .catch(err => console.error('loadUserList failed:', err));
}

// ============================================================
// FILE UPLOAD
// ============================================================
function handleExcelUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    showLoadingModal('Uploading, please wait...');
    const base64 = e.target.result.split(',')[1];
    
    api.importExcelToSheet(base64, file.name)
      .then(msg => {
        hideLoadingModal();
        alert(msg);
        fetchLastUploadDate();
        loadLoanData();
      })
      .catch(err => {
        hideLoadingModal();
        alert('Upload failed: ' + err.message);
      });
  };
  reader.readAsDataURL(file);
}

function fetchLastUploadDate() {
  api.getLastUploadDate()
    .then(dateString => {
      const lastUploadDate = dateString || '--';
      const el = document.getElementById('lastUploadDate');
      if (el) el.innerText = 'Last Upload: ' + lastUploadDate;
    })
    .catch(err => console.error('fetchLastUploadDate failed:', err));
}

function showLoadingModal(message) {
  document.getElementById('loadingText').innerText = message || "Uploading, please wait...";
  document.getElementById('loadingModal').style.display = 'block';
}

function hideLoadingModal() {
  document.getElementById('loadingModal').style.display = 'none';
}

// ============================================================
// AUTHENTICATION & LOGIN
// ============================================================
window.addEventListener('DOMContentLoaded', function() {
  document.querySelector('.main-layout').style.display = "none";
  document.getElementById('loginContainer').style.display = "flex";
});

function login() {
  const username = document.getElementById('userName').value.trim();
  const password = document.getElementById('password').value;
  const output = document.getElementById('loginOutput');
  output.style.display = "none";

  if (!username || !password) {
    output.textContent = "Username and password required.";
    output.style.display = "block";
    return;
  }

  showLoadingModal('Authenticating...');
  api.loginUser({ username, password })
    .then(result => {
      hideLoadingModal();
      if (result.status === "success") {
        currentUser = result.user;
        initializeAppAfterLogin(result.user);
      } else {
        output.textContent = result.message;
        output.style.display = "block";
      }
    })
    .catch(err => {
      hideLoadingModal();
      output.textContent = 'Login failed: ' + err.message;
      output.style.display = "block";
    });
}

function initializeAppAfterLogin(user) {
  document.getElementById('loginContainer').style.display = "none";
  document.querySelector('.main-layout').style.display = "flex";
  
  window.loggedInUser = user;
  window.currentCreditOfficer = user.creditOfficer;
  window.loggedInUserRole = user.role;

  const manageUsersSidebar = document.getElementById('manageUsersSidebar');
  manageUsersSidebar.style.display = 
    (window.loggedInUserRole && window.loggedInUserRole.toLowerCase() === "admin") ? "" : "none";

  fetchLastUploadDate();
  loadLoanDataWithAccess();
}

function loadLoanDataWithAccess() {
  api.getLoanData()
    .then(rows => {
      loanRows = rows;
      populateOfficerDropdown();
      
      if (window.loggedInUserRole && window.loggedInUserRole.toLowerCase() === "admin") {
        renderLoanTable(loanRows);
        document.getElementById('creditOfficerFilter').value = "";
      } else {
        const filtered = loanRows.filter(row => row[11] && row[11].trim() === window.currentCreditOfficer);
        renderLoanTable(filtered);
        document.getElementById('creditOfficerFilter').value = window.currentCreditOfficer || "";
      }
    })
    .catch(err => console.error('loadLoanDataWithAccess failed:', err));
}

// ============================================================
// NAVIGATION
// ============================================================
function showAllReports() {
  document.getElementById('allCallReportsContainer').style.display = "none";
  document.getElementById('allSalesActivitiesContainer').style.display = "none";
  document.getElementById('mainLoanView').style.display = "";
  renderLoanTable(loanRows);
  document.getElementById('creditOfficerFilter').value = "";
}

function showMyReports() {
  const officer = window.currentCreditOfficer || '';
  if (!officer) {
    alert(window.APP_CONFIG.MESSAGES.ERROR_NO_LOGIN);
    return;
  }
  document.getElementById('allCallReportsContainer').style.display = "none";
  document.getElementById('allSalesActivitiesContainer').style.display = "none";
  document.getElementById('mainLoanView').style.display = "";
  document.getElementById('creditOfficerFilter').value = officer;
  filterLoanTableByOfficer();
}

function updatePARLabel() {
  api.getPARValue()
    .then(parValue => {
      document.getElementById('par-value').textContent = parValue !== null ? parValue : "--";
    })
    .catch(err => console.error('updatePARLabel failed:', err));
}

window.addEventListener('DOMContentLoaded', function() {
  updatePARLabel();
  setInterval(updatePARLabel, window.APP_CONFIG.PAR_REFRESH_INTERVAL_MS);
});