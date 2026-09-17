// =====================================================
//  Sales Activity logic
// =====================================================

var allSalesRows = [];
var salesFilterMine = false;

function openSalesActivityModal() {
  document.getElementById('activity-date').value =
    new Date().toISOString().split('T')[0];
  document.getElementById('sales-activity-modal').style.display = 'block';
}

function closeSalesActivityModal() {
  document.getElementById('sales-activity-modal').style.display = 'none';
  document.getElementById('sales-activity-form').reset();
}

function saveSalesActivity() {
  var saveBtn = document.querySelector('#sales-activity-modal .modal-save-btn');
  var formData = {
    activityDate:    document.getElementById('activity-date').value,
    destination:     document.getElementById('destination').value,
    clientsVisited:  document.getElementById('clients-visited').value,
    transportMode:   document.getElementById('transport-mode').value,
    salesActivity:   document.getElementById('sales-activity').value,
    remarks:         document.getElementById('remarks').value,
    creditOfficer:   currentUser ? currentUser.creditOfficer : ''
  };

  var errors = [];
  if (!formData.activityDate)   errors.push('Date is required');
  if (!formData.destination)    errors.push('Destination is required');
  if (!formData.salesActivity)  errors.push('Sales activity is required');
  if (!formData.transportMode)  errors.push('Transport mode is required');
  if (errors.length) { alert(errors.join('\n')); return; }

  saveBtn.disabled = true;
  saveBtn.innerHTML = '<i class="material-icons">hourglass_empty</i> Saving...';

  Api.saveSalesActivity(formData)
    .then(function (msg) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="material-icons">save</i> Save Activity';
      alert(msg);
      closeSalesActivityModal();
    })
    .catch(function (err) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="material-icons">save</i> Save Activity';
      alert('Error: ' + err.message);
    });
}

// ---------- List views ----------
function showAllSalesReports() {
  salesFilterMine = false;
  document.querySelectorAll('.main-content .content').forEach(function (el) {
    el.style.display = 'none';
  });
  document.getElementById('allSalesActivitiesContainer').style.display = 'block';
  ensureSalesInnerMounted();
  document.getElementById('salesListTitle').textContent = 'Sales Activities';

  Api.getAllSalesActivities().then(function (rows) {
    allSalesRows = rows || [];
    populateOfficerDropdown(allSalesRows, 'salesActivityOfficerFilter', 2, 'All Officers');
    document.getElementById('salesActivityOfficerFilter').disabled = false;
    renderSalesTable(allSalesRows);
  });
}

function showMySalesReports() {
  salesFilterMine = true;
  document.querySelectorAll('.main-content .content').forEach(function (el) {
    el.style.display = 'none';
  });
  document.getElementById('allSalesActivitiesContainer').style.display = 'block';
  ensureSalesInnerMounted();
  document.getElementById('salesListTitle').textContent = 'My Sales Reports';

  Api.getAllSalesActivities().then(function (rows) {
    var officer = currentUser ? currentUser.creditOfficer : '';
    allSalesRows = (rows || []).filter(function (r) {
      return r[2] && r[2].trim() === officer;
    });
    var filter = document.getElementById('salesActivityOfficerFilter');
    filter.innerHTML = '<option>' + escapeHtml(officer) + '</option>';
    filter.disabled = true;
    renderSalesTable(allSalesRows);
  });
}

function ensureSalesInnerMounted() {
  var container = document.getElementById('allSalesActivitiesContainer');
  if (!container.dataset.populated) {
    var inner = document.getElementById('allSalesInner');
    if (inner) {
      inner.style.display = 'block';
      while (inner.firstChild) container.appendChild(inner.firstChild);
      container.dataset.populated = '1';
    }
  }
}

function renderSalesTable(rows) {
  var tbody = document.getElementById('allSalesActivitiesTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!rows || rows.length === 0) {
    showNoDataMessage(tbody, 7, 'No data found');
    return;
  }

  rows.forEach(function (r) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + formatDisplayDate(r[1]) + '</td>' +
      '<td>' + escapeHtml(r[2] || '') + '</td>' +
      '<td>' + escapeHtml(r[3] || '') + '</td>' +
      '<td>' + formatNumber(r[5]) + '</td>' +
      '<td>' + escapeHtml(r[6] || '') + '</td>' +
      '<td style="white-space:pre-wrap;">' + escapeHtml(r[4] || '') + '</td>' +
      '<td>' + escapeHtml(r[7] || '') + '</td>';
    tbody.appendChild(tr);
  });
}

function filterSalesActivities() {
  var startDate = document.getElementById('salesActivityStartDate').value;
  var endDate   = document.getElementById('salesActivityEndDate').value;
  var officer   = document.getElementById('salesActivityOfficerFilter');

  var filtered = allSalesRows.slice();
  if (startDate) {
    var s = new Date(startDate + 'T00:00:00');
    filtered = filtered.filter(function (r) { return new Date(r[1]) >= s; });
  }
  if (endDate) {
    var e = new Date(endDate + 'T23:59:59');
    filtered = filtered.filter(function (r) { return new Date(r[1]) <= e; });
  }
  if (!salesFilterMine && officer && !officer.disabled && officer.value) {
    filtered = filtered.filter(function (r) {
      return r[2] && r[2].trim() === officer.value;
    });
  }
  renderSalesTable(filtered);
}

function resetSalesActivityFilters() {
  document.getElementById('salesActivityStartDate').value = '';
  document.getElementById('salesActivityEndDate').value   = '';
  var officer = document.getElementById('salesActivityOfficerFilter');
  if (officer && !officer.disabled) officer.value = '';
  renderSalesTable(allSalesRows);
}
