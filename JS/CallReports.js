// =====================================================
//  Call Reports logic
// =====================================================

var allCallReportRows = [];

// ---------- Follow-Up Modal ----------
function openFollowUpModal(row) {
  if (!row) return;
  document.getElementById('modal-loan-number').textContent      = row[0];
  document.getElementById('modal-borrower-name').textContent    = row[1];
  document.getElementById('modal-principal-arrears').textContent = row[6];
  document.getElementById('modal-interest-arrears').textContent  = row[7];
  document.getElementById('modal-penalty').textContent           = row[8];
  document.getElementById('modal-credit-officer').textContent    = row[10];
  document.getElementById('modal-feedback').value = '';
  document.getElementById('modal-action').value   = '';
  document.getElementById('followup-modal').style.display = 'block';
}
function closeFollowUpModal() {
  document.getElementById('followup-modal').style.display = 'none';
}

function saveFollowUpComment() {
  var data = {
    loanNumber:       document.getElementById('modal-loan-number').textContent,
    borrowerName:     document.getElementById('modal-borrower-name').textContent,
    principalArrears: document.getElementById('modal-principal-arrears').textContent,
    interestArrears:  document.getElementById('modal-interest-arrears').textContent,
    penalty:          document.getElementById('modal-penalty').textContent,
    creditOfficer:    document.getElementById('modal-credit-officer').textContent,
    customerFeedback: document.getElementById('modal-feedback').value,
    actionTaken:      document.getElementById('modal-action').value
  };

  var saveBtn = document.querySelector('#followup-modal .modal-save-btn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="material-icons">hourglass_empty</i> Saving...';

  Api.saveCallReport(data)
    .then(function (msg) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="material-icons">save</i> Save';
      alert(msg);
      closeFollowUpModal();
      loadLoanData();
    })
    .catch(function (err) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="material-icons">save</i> Save';
      alert('Error: ' + err.message);
    });
}

// ---------- Call Report Modal (single loan) ----------
function openCallReportModal(loanNum) {
  document.getElementById('callReportModal').style.display = 'block';
  var tbody = document.getElementById('callReportTableBody');
  tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Loading...</td></tr>';

  Api.getCallReportData().then(function (rows) {
    tbody.innerHTML = '';
    var filtered = (rows || []).filter(function (r) {
      return String(r[0]) === String(loanNum);
    });

    if (filtered.length === 0) {
      tbody.innerHTML =
        '<tr><td colspan="9" style="text-align:center; padding:20px; color:#666;">' +
        'No reports found for this loan number.</td></tr>';
      return;
    }

    filtered.forEach(function (row) {
      var tr = document.createElement('tr');
      var cols = [0, 1, 2, 3, 4, 5, 6, 7];
      cols.forEach(function (i) {
        var td = document.createElement('td');
        if ([2, 3, 4].indexOf(i) !== -1) td.className = 'red';
        td.textContent = row[i] || '-';
        tr.appendChild(td);
      });
      var viewTd = document.createElement('td');
      viewTd.innerHTML =
        '<button class="view-report-btn" onclick="viewReportDetails(' +
        JSON.stringify(row).replace(/"/g, '&quot;') + ')">' +
        '<i class="material-icons">visibility</i></button>';
      tr.appendChild(viewTd);
      tbody.appendChild(tr);
    });
  });
}

function closeCallReportModal() {
  document.getElementById('callReportModal').style.display = 'none';
}

function viewReportDetails(row) {
  alert(
    'Loan: ' + row[0] + '\n' +
    'Borrower: ' + row[1] + '\n' +
    'Date: ' + row[5] + '\n\n' +
    'Feedback:\n' + (row[6] || '-') + '\n\n' +
    'Action:\n' + (row[7] || '-')
  );
}

// ---------- All Call Reports page ----------
function showAllCallReports() {
  document.querySelectorAll('.main-content .content').forEach(function (el) {
    el.style.display = 'none';
  });

  var container = document.getElementById('allCallReportsContainer');
  container.style.display = 'block';

  // Move the inner block into the container on first view
  if (!container.dataset.populated) {
    var inner = document.getElementById('allCallReportsInner');
    if (inner) {
      inner.style.display = 'block';
      while (inner.firstChild) container.appendChild(inner.firstChild);
      container.dataset.populated = '1';
    }
  }

  Api.getCallReportData().then(function (rows) {
    allCallReportRows = rows || [];
    populateOfficerDropdown(allCallReportRows, 'callReportOfficerFilter', 8, 'All Officers');
    renderAllCallReportsTable(allCallReportRows);
  });
}

function renderAllCallReportsTable(rows) {
  var tbody = document.getElementById('allCallReportsTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!rows || rows.length === 0) {
    showNoDataMessage(tbody, 9, 'No call reports found.');
    return;
  }

  rows.forEach(function (row) {
    var tr = document.createElement('tr');
    [0,1,2,3,4,5,6,7,8].forEach(function (i) {
      var td = document.createElement('td');
      if ([2,3,4].indexOf(i) !== -1) {
        td.className = 'red';
        td.textContent = formatNumber(row[i]);
      } else if (i === 5) {
        td.textContent = formatDisplayDate(row[i]);
      } else {
        td.textContent = row[i] || '-';
      }
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

function filterAllCallReports() {
  var startDate = document.getElementById('callReportStartDate').value;
  var endDate   = document.getElementById('callReportEndDate').value;
  var officer   = document.getElementById('callReportOfficerFilter').value;

  var filtered = allCallReportRows.slice();
  if (startDate) {
    var s = new Date(startDate + 'T00:00:00');
    filtered = filtered.filter(function (r) { return new Date(r[5]) >= s; });
  }
  if (endDate) {
    var e = new Date(endDate + 'T23:59:59');
    filtered = filtered.filter(function (r) { return new Date(r[5]) <= e; });
  }
  if (officer) {
    filtered = filtered.filter(function (r) {
      return r[8] && r[8].trim() === officer;
    });
  }
  renderAllCallReportsTable(filtered);
}

function resetCallReportFilters() {
  document.getElementById('callReportStartDate').value = '';
  document.getElementById('callReportEndDate').value = '';
  document.getElementById('callReportOfficerFilter').value = '';
  renderAllCallReportsTable(allCallReportRows);
}

// ---------- User Management (still under CallReports namespace in original) ----------
function openAddUserModal()  { document.getElementById('addUserModal').style.display  = 'block'; }
function closeAddUserModal() { document.getElementById('addUserModal').style.display  = 'none';  }
function openUserListModal() {
  document.getElementById('userListModal').style.display = 'block';
  loadUserList();
}
function closeUserListModal() { document.getElementById('userListModal').style.display = 'none'; }

document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('addUserForm');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var data = {
        creditOfficerName: form.creditOfficerName.value,
        username:          form.username.value,
        defaultPassword:   form.defaultPassword.value,
        userRole:          form.userRole.value
      };
      Api.saveUser(data)
        .then(function (msg) { alert(msg); closeAddUserModal(); })
        .catch(function (err) { alert('Error: ' + err.message); });
    });
  }
});

function loadUserList() {
  Api.getUserList().then(function (users) {
    var tbody = document.getElementById('userListTableBody');
    tbody.innerHTML = '';

    if (!users || users.length === 0) {
      showNoDataMessage(tbody, 6, 'No users found.');
      return;
    }

    users.forEach(function (u) {
      var initials = (u.creditOfficer || '').split(' ').map(function (w) {
        return w[0];
      }).join('').toUpperCase();

      var tr = document.createElement('tr');
      tr.innerHTML =
        '<td>' + u.number + '</td>' +
        '<td><div class="officer-info">' +
          '<span class="officer-initials">' + initials + '</span>' +
          '<span class="officer-name">' + escapeHtml(u.creditOfficer) + '</span>' +
        '</div></td>' +
        '<td><span class="user-username">' + escapeHtml(u.username) + '</span></td>' +
        '<td class="password-column">********</td>' +
        '<td><span class="role-badge role-' + (u.role || '').toLowerCase() + '">' +
          escapeHtml(u.role) + '</span></td>' +
        '<td style="text-align:center;">' +
          '<button class="reset-btn" onclick="resetPassword(\'' + u.username + '\')">' +
            '<span class="material-icons">refresh</span> Reset</button>' +
          '<button class="remove-btn" onclick="removeUser(\'' + u.username + '\')">' +
            '<span class="material-icons">delete</span> Remove</button>' +
        '</td>';
      tbody.appendChild(tr);
    });
  });
}

function resetPassword(u) { alert('Reset password for ' + u + ' (not implemented in backend).'); }
function removeUser(u)    { alert('Remove user ' + u + ' (not implemented in backend).'); }
