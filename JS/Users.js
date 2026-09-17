// ============================================================
//  User Management Logic
// ============================================================
// Depends on: JS/Api.js (Api.saveUser, Api.getUserList,
//             Api.updatePassword, Api.deleteUser)
// Depends on: JS/Index.js (currentUser, escapeHtml, showNoDataMessage,
//             showLoadingModal, hideLoadingModal)
// ============================================================

var allUsersCache = [];       // full list from server
var pendingDeleteUser = null; // { username, creditOfficer }
var pendingResetUser  = null;

// ------------------------------------------------------------
//  Add User Modal
// ------------------------------------------------------------
function openAddUserModal() {
  var form = document.getElementById('addUserForm');
  if (form) form.reset();
  document.getElementById('addUserModal').style.display = 'block';
}

function closeAddUserModal() {
  document.getElementById('addUserModal').style.display = 'none';
}

function submitAddUserForm(e) {
  if (e && e.preventDefault) e.preventDefault();
  var form = document.getElementById('addUserForm');
  if (!form) return;

  var data = {
    creditOfficerName: form.creditOfficerName.value.trim(),
    username:          form.username.value.trim(),
    defaultPassword:   form.defaultPassword.value,
    email:             form.email.value.trim(),
    userRole:          form.userRole.value
  };

  if (!data.creditOfficerName || !data.username || !data.defaultPassword || !data.userRole) {
    alert('All fields except email are required.');
    return;
  }
  if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    alert('Please enter a valid email address.');
    return;
  }

  var saveBtn = document.getElementById('addUserSaveBtn');
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="material-icons">hourglass_empty</i> Saving...';

  Api.saveUser(data)
    .then(function (msg) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="material-icons">save</i> Save';
      alert(msg || 'User saved successfully!');
      closeAddUserModal();
      // If user list is open, refresh it
      if (document.getElementById('userListModal').style.display === 'block') {
        loadUserList();
      }
    })
    .catch(function (err) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="material-icons">save</i> Save';
      alert('Error: ' + (err && err.message ? err.message : err));
    });
}

// Wire up form submit once DOM is ready
document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('addUserForm');
  if (form) form.addEventListener('submit', submitAddUserForm);
});

// ------------------------------------------------------------
//  User List Modal
// ------------------------------------------------------------
function openUserListModal() {
  document.getElementById('userListModal').style.display = 'block';
  loadUserList();
}

function closeUserListModal() {
  document.getElementById('userListModal').style.display = 'none';
  var search = document.getElementById('userSearchInput');
  if (search) search.value = '';
}

function loadUserList() {
  var tbody = document.getElementById('userListTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:20px;">Loading users...</td></tr>';

  Api.getUserList()
    .then(function (users) {
      allUsersCache = users || [];
      renderUserList(allUsersCache);
    })
    .catch(function (err) {
      tbody.innerHTML =
        '<tr><td colspan="7" style="text-align:center; padding:20px; color:#c62828;">' +
        'Failed to load users: ' + escapeHtml(err.message || 'unknown') + '</td></tr>';
    });
}

function renderUserList(users) {
  var tbody = document.getElementById('userListTableBody');
  var countEl = document.getElementById('userListCount');
  if (!tbody) return;

  tbody.innerHTML = '';

  if (!users || users.length === 0) {
    showNoDataMessage(tbody, 7, 'No users found.');
    if (countEl) countEl.textContent = '0 users';
    return;
  }

  users.forEach(function (u) {
    var initials = (u.creditOfficer || '')
      .split(/\s+/)
      .filter(Boolean)
      .map(function (w) { return w[0]; })
      .join('')
      .toUpperCase()
      .slice(0, 3);

    var roleClass = (u.role || '').toLowerCase();
    var emailHtml = u.email
      ? escapeHtml(u.email)
      : '<span class="empty">—</span>';

    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + (u.number || '') + '</td>' +
      '<td>' +
        '<div class="officer-info">' +
          '<span class="officer-initials">' + escapeHtml(initials) + '</span>' +
          '<span class="officer-name">' + escapeHtml(u.creditOfficer || '') + '</span>' +
        '</div>' +
      '</td>' +
      '<td><span class="user-username">' + escapeHtml(u.username || '') + '</span></td>' +
      '<td class="password-column">********</td>' +
      '<td class="user-email' + (u.email ? '' : ' empty') + '">' + emailHtml + '</td>' +
      '<td><span class="role-badge role-' + escapeHtml(roleClass) + '">' +
        escapeHtml(u.role || '') + '</span></td>' +
      '<td>' +
        '<button class="reset-btn" title="Reset Password" ' +
          'onclick="openResetPasswordModal(\'' + escapeJs(u.username) + '\')">' +
          '<span class="material-icons">refresh</span> Reset' +
        '</button>' +
        '<button class="remove-btn" title="Remove User" ' +
          'onclick="openConfirmDeleteModal(\'' + escapeJs(u.username) + '\', \'' +
          escapeJs(u.creditOfficer || '') + '\')">' +
          '<span class="material-icons">delete</span> Remove' +
        '</button>' +
      '</td>';

    tbody.appendChild(tr);
  });

  if (countEl) {
    countEl.textContent = users.length + (users.length === 1 ? ' user' : ' users');
  }
}

function filterUserList() {
  var q = (document.getElementById('userSearchInput').value || '')
    .trim()
    .toLowerCase();

  if (!q) { renderUserList(allUsersCache); return; }

  var filtered = allUsersCache.filter(function (u) {
    return (
      (u.creditOfficer || '').toLowerCase().indexOf(q) !== -1 ||
      (u.username      || '').toLowerCase().indexOf(q) !== -1 ||
      (u.role          || '').toLowerCase().indexOf(q) !== -1 ||
      (u.email         || '').toLowerCase().indexOf(q) !== -1
    );
  });

  renderUserList(filtered);
}

// ------------------------------------------------------------
//  Reset Password Modal
// ------------------------------------------------------------
function openResetPasswordModal(username) {
  pendingResetUser = username;
  document.getElementById('resetTargetUser').textContent = username;
  document.getElementById('newPasswordInput').value = '';
  document.getElementById('confirmPasswordInput').value = '';
  document.getElementById('resetPasswordError').textContent = '';
  document.getElementById('resetPasswordModal').style.display = 'block';
}

function closeResetPasswordModal() {
  pendingResetUser = null;
  document.getElementById('resetPasswordModal').style.display = 'none';
}

function submitResetPassword() {
  var newPwd = document.getElementById('newPasswordInput').value;
  var confirm = document.getElementById('confirmPasswordInput').value;
  var errEl = document.getElementById('resetPasswordError');

  errEl.textContent = '';

  if (!newPwd || newPwd.length < 4) {
    errEl.textContent = 'Password must be at least 4 characters.';
    return;
  }
  if (newPwd !== confirm) {
    errEl.textContent = 'Passwords do not match.';
    return;
  }
  if (!pendingResetUser) {
    errEl.textContent = 'No user selected.';
    return;
  }

  showLoadingModal('Resetting password...');
  Api.updatePassword({ username: pendingResetUser, newPassword: newPwd })
    .then(function (msg) {
      hideLoadingModal();
      alert(msg || 'Password reset successfully!');
      closeResetPasswordModal();
    })
    .catch(function (err) {
      hideLoadingModal();
      errEl.textContent = err.message || 'Failed to reset password.';
    });
}

// ------------------------------------------------------------
//  Confirm Delete Modal
// ------------------------------------------------------------
function openConfirmDeleteModal(username, creditOfficer) {
  pendingDeleteUser = { username: username, creditOfficer: creditOfficer };
  document.getElementById('confirmDeleteUsername').textContent =
    creditOfficer || username;
  document.getElementById('confirmDeleteModal').style.display = 'block';
}

function closeConfirmDeleteModal() {
  pendingDeleteUser = null;
  document.getElementById('confirmDeleteModal').style.display = 'none';
}

function confirmRemoveUser() {
  if (!pendingDeleteUser) return;

  showLoadingModal('Removing user...');
  Api.deleteUser({ username: pendingDeleteUser.username })
    .then(function (msg) {
      hideLoadingModal();
      alert(msg || 'User removed successfully!');
      closeConfirmDeleteModal();
      loadUserList();
    })
    .catch(function (err) {
      hideLoadingModal();
      alert('Error: ' + (err.message || 'Failed to remove user.'));
    });
}

// ------------------------------------------------------------
//  Utility: escape single quotes for inline JS strings
// ------------------------------------------------------------
function escapeJs(str) {
  return String(str || '')
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'");
}

// ------------------------------------------------------------
//  Close modals when clicking outside
// ------------------------------------------------------------
document.addEventListener('click', function (e) {
  ['addUserModal', 'userListModal', 'resetPasswordModal', 'confirmDeleteModal']
    .forEach(function (id) {
      var el = document.getElementById(id);
      if (el && e.target === el) {
        if (id === 'addUserModal')          closeAddUserModal();
        if (id === 'userListModal')         closeUserListModal();
        if (id === 'resetPasswordModal')    closeResetPasswordModal();
        if (id === 'confirmDeleteModal')    closeConfirmDeleteModal();
      }
    });
});
