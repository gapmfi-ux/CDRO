// =====================================================
//  Main app logic (login, sidebar, loan table, upload)
// =====================================================

var currentUser = null;         // { creditOfficer, username, role, email }
var loanRows    = [];           // all loan rows loaded

// ---------- Utilities ----------
function escapeHtml(s) {
  if (!s) return '';
  return s.toString()
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}
function formatNumber(v) {
  if (v === null || v === undefined || v === '') return '';
  return isNaN(v) ? v : Number(v).toLocaleString();
}
function formatDisplayDate(s) {
  if (!s) return '';
  try {
    var d = new Date(s);
    return isNaN(d.getTime()) ? s : d.toLocaleDateString('en-GB');
  } catch (e) { return s; }
}
function showNoDataMessage(tbody, colSpan, msg) {
  colSpan = colSpan || 7;
  msg = msg || 'No data found';
  tbody.innerHTML =
    '<tr><td colspan="' + colSpan +
    '" style="text-align:center; padding:20px; color:#666;">' + msg + '</td></tr>';
}

// ---------- Loading Modal ----------
function showLoadingModal(msg) {
  document.getElementById('loadingText').innerText = msg || 'Loading...';
  document.getElementById('loadingModal').style.display = 'block';
}
function hideLoadingModal() {
  document.getElementById('loadingModal').style.display = 'none';
}

// ---------- Login ----------
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('loginBtn').addEventListener('click', login);
  document.getElementById('password').addEventListener('keypress', function (e) {
    if (e.key === 'Enter') login();
  });

  // Restore session
  var stored = sessionStorage.getItem('creditOpsUser');
  if (stored) {
    try {
      currentUser = JSON.parse(stored);
      enterApp();
    } catch (e) { sessionStorage.removeItem('creditOpsUser'); }
  }
});

function login() {
  var username = document.getElementById('userName').value.trim();
  var password = document.getElementById('password').value;
  var output   = document.getElementById('loginOutput');
  output.style.display = 'none';

  if (!username || !password) {
    output.textContent = 'Username and password required.';
    output.style.display = 'block';
    return;
  }

  showLoadingModal('Authenticating...');
  Api.loginUser({ username: username, password: password })
    .then(function (result) {
      hideLoadingModal();
      if (result && result.status === 'success') {
        currentUser = result.user;
        sessionStorage.setItem('creditOpsUser', JSON.stringify(currentUser));
        enterApp();
      } else {
        output.textContent = (result && result.message) || 'Invalid username or password.';
        output.style.display = 'block';
      }
    })
    .catch(function (err) {
      hideLoadingModal();
      output.textContent = 'Login failed: ' + err.message;
      output.style.display = 'block';
    });
}

function enterApp() {
  document.getElementById('loginContainer').style.display = 'none';
  document.getElementById('mainLayout').style.display = 'flex';

  // Show admin-only sidebar
  var isAdmin = currentUser && currentUser.role &&
                currentUser.role.toLowerCase() === 'admin';
  document.getElementById('manageUsersSidebar').style.display = isAdmin ? '' : 'none';

  fetchLastUploadDate();
  loadLoanDataWithAccess();
  loadPARValue();
}

function logout() {
  sessionStorage.removeItem('creditOpsUser');
  currentUser = null;
  location.reload();
}

// ---------- Sidebar dropdowns ----------
document.addEventListener('click', function (e) {
  var btn = e.target.closest('.sidebar-btn');
  if (btn && btn.dataset.dropdown !== undefined) {
    var idx = btn.dataset.dropdown;
    var target = document.getElementById('sidebar-dropdown-' + idx);
    document.querySelectorAll('.sidebar-dropdown-content').forEach(function (el) {
      if (el !== target) el.classList.remove('show');
    });
    target.classList.toggle('show');
    return;
  }
  // Close dropdowns when clicking outside
  if (!e.target.closest('.sidebar-dropdown')) {
    document.querySelectorAll('.sidebar-dropdown-content').forEach(function (el) {
      el.classList.remove('show');
    });
  }
  // Close action dropdowns too
  if (!e.target.closest('.action-dropdown')) {
    document.querySelectorAll('.action-dropdown').forEach(function (el) {
      el.classList.remove('show');
    });
  }
});

// ---------- Loan Data ----------
function loadLoanData() {
  Api.getLoanData().then(function (rows) {
    loanRows = rows || [];
    renderTable(loanRows);
    populateOfficerDropdown(loanRows, 'creditOfficerFilter', 11, 'All Credit Officers');
  }).catch(console.error);
}

function loadLoanDataWithAccess() {
  Api.getLoanData().then(function (rows) {
    loanRows = rows || [];
    populateOfficerDropdown(loanRows, 'creditOfficerFilter', 11, 'All Credit Officers');

    var isAdmin = currentUser && currentUser.role &&
                  currentUser.role.toLowerCase() === 'admin';
    if (isAdmin) {
      renderTable(loanRows);
      document.getElementById('creditOfficerFilter').value = '';
    } else {
      var mine = loanRows.filter(function (r) {
        return r[11] && r[11].trim() === currentUser.creditOfficer;
      });
      renderTable(mine);
      document.getElementById('creditOfficerFilter').value = currentUser.creditOfficer || '';
    }
  }).catch(console.error);
}

function populateOfficerDropdown(rows, filterId, officerColIdx, allLabel) {
  var filter = document.getElementById(filterId);
  if (!filter) return;
  var set = {};
  rows.forEach(function (r) {
    if (r[officerColIdx]) set[r[officerColIdx].trim()] = true;
  });
  var officers = Object.keys(set).sort();
  filter.innerHTML = '<option value="">' + allLabel + '</option>';
  officers.forEach(function (o) {
    filter.innerHTML += '<option value="' + escapeHtml(o) + '">' + escapeHtml(o) + '</option>';
  });
}

function renderTable(rows) {
  var tbody = document.getElementById('loan-table-body');
  tbody.innerHTML = '';

  if (!rows || rows.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="12" style="text-align:center;">No data available</td></tr>';
    return;
  }

  rows.forEach(function (row, idx) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + escapeHtml(row[0]) + '</td>' +
      '<td>' + escapeHtml(row[1]) + '</td>' +
      '<td>' + escapeHtml(row[2]) + '</td>' +
      '<td>' + escapeHtml(row[3]) + '</td>' +
      '<td>' + escapeHtml(row[4]) + '</td>' +
      '<td>' + escapeHtml(row[5]) + '</td>' +
      '<td class="red">' + escapeHtml(row[6]) + '</td>' +
      '<td class="red">' + escapeHtml(row[7]) + '</td>' +
      '<td class="red">' + escapeHtml(row[8]) + '</td>' +
      '<td>' + escapeHtml(row[9]) + '</td>' +
      '<td>' + escapeHtml(row[10]) + '</td>' +
      '<td>' +
        '<div class="action-dropdown" id="action-dropdown-' + idx + '">' +
          '<button class="dropdown-btn" onclick="toggleActionDropdown(event, ' + idx + ')">Actions ▼</button>' +
          '<div class="dropdown-content">' +
            '<a onclick="handleDropdownAction(\'followup\', \'' + row[0] + '\')">Add Call Comment</a>' +
            '<a onclick="handleDropdownAction(\'callreport\', \'' + row[0] + '\')">View Call Report</a>' +
          '</div>' +
        '</div>' +
      '</td>';
    tbody.appendChild(tr);
  });
}

function toggleActionDropdown(e, idx) {
  e.stopPropagation();
  var el = document.getElementById('action-dropdown-' + idx);
  document.querySelectorAll('.action-dropdown').forEach(function (o) {
    if (o !== el) o.classList.remove('show');
  });
  el.classList.toggle('show');
}

function handleDropdownAction(action, loanNum) {
  var row = loanRows.find(function (r) { return String(r[0]) === String(loanNum); });
  if (action === 'followup')      openFollowUpModal(row);
  else if (action === 'callreport') openCallReportModal(loanNum);
  document.querySelectorAll('.action-dropdown').forEach(function (el) {
    el.classList.remove('show');
  });
}

function filterLoanTableByOfficer() {
  var selected = document.getElementById('creditOfficerFilter').value;
  renderTable(!selected ? loanRows : loanRows.filter(function (r) {
    return r[11] && r[11].trim() === selected;
  }));
}

// ---------- Navigation ----------
function showAllReports() {
  document.querySelectorAll('.main-content .content').forEach(function (el) {
    el.style.display = 'none';
  });
  document.getElementById('loanView').style.display = '';
  renderTable(loanRows);
  document.getElementById('creditOfficerFilter').value = '';
}

function showMyReports() {
  var officer = currentUser ? currentUser.creditOfficer : '';
  if (!officer) { alert('No credit officer found.'); return; }
  document.querySelectorAll('.main-content .content').forEach(function (el) {
    el.style.display = 'none';
  });
  document.getElementById('loanView').style.display = '';
  document.getElementById('creditOfficerFilter').value = officer;
  filterLoanTableByOfficer();
}

// ---------- PAR value ----------
function loadPARValue() {
  Api.getPARValue().then(function (v) {
    document.getElementById('par-value').textContent = v || '--';
  }).catch(console.error);
}

// ---------- Excel Upload ----------
function handleExcelUpload(event) {
  var file = event.target.files[0];
  if (!file) return;

  var reader = new FileReader();
  reader.onload = function (ev) {
    showLoadingModal('Uploading, please wait...');
    var base64 = ev.target.result.split(',')[1];
    Api.importExcel(base64, file.name)
      .then(function (msg) {
        hideLoadingModal();
        alert(msg);
        fetchLastUploadDate();
        loadLoanData();
      })
      .catch(function (err) {
        hideLoadingModal();
        alert('Upload failed: ' + err.message);
      });
  };
  reader.readAsDataURL(file);
}

function fetchLastUploadDate() {
  Api.getLastUploadDate().then(function (d) {
    document.getElementById('lastUploadDate').innerText = 'Last Upload: ' + (d || '--');
  }).catch(console.error);
}
