// =====================================================
//  Repayment logic
// =====================================================

var allRepaymentRows = [];

function showRepayment() {
  document.querySelectorAll('.main-content .content').forEach(function (el) {
    el.style.display = 'none';
  });

  var container = document.getElementById('repaymentContainer');
  container.style.display = 'block';

  if (!container.dataset.populated) {
    var inner = document.getElementById('repaymentInner');
    if (inner) {
      inner.style.display = 'block';
      while (inner.firstChild) container.appendChild(inner.firstChild);
      container.dataset.populated = '1';
    }
  }

  showLoadingModal('Loading repayments...');
  Api.getExpectedRepaymentData()
    .then(function (rows) {
      hideLoadingModal();
      allRepaymentRows = rows || [];
      populateOfficerDropdown(allRepaymentRows, 'repaymentOfficerFilter', 8, 'All Officers');
      renderRepaymentTable(allRepaymentRows);
    })
    .catch(function (err) {
      hideLoadingModal();
      alert('Failed to load repayments: ' + err.message);
    });
}

function renderRepaymentTable(rows) {
  var tbody = document.getElementById('repaymentTableBody');
  if (!tbody) return;
  tbody.innerHTML = '';

  if (!rows || rows.length === 0) {
    showNoDataMessage(tbody, 7, 'No repayments found for the selected range.');
    return;
  }

  rows.forEach(function (r) {
    var tr = document.createElement('tr');
    tr.innerHTML =
      '<td>' + escapeHtml(r[1] || '-') + '</td>' +
      '<td>' + escapeHtml(r[0] || '-') + '</td>' +
      '<td>' + escapeHtml(r[2] || '-') + '</td>' +
      '<td>' + (r[10] ? formatDisplayDate(r[10]) : '-') + '</td>' +
      '<td style="text-align:right;">' + formatNumber(r[11]) + '</td>' +
      '<td style="text-align:right;">' + formatNumber(r[12]) + '</td>' +
      '<td style="text-align:right;"><strong>' + formatNumber(r[13]) + '</strong></td>';
    tbody.appendChild(tr);
  });
}

function filterRepayments() {
  var startDate = document.getElementById('repaymentStartDate').value;
  var endDate   = document.getElementById('repaymentEndDate').value;
  var officer   = document.getElementById('repaymentOfficerFilter').value;

  var filtered = allRepaymentRows.slice();
  if (startDate) {
    var s = new Date(startDate + 'T00:00:00');
    filtered = filtered.filter(function (r) {
      return r[10] && new Date(r[10]) >= s;
    });
  }
  if (endDate) {
    var e = new Date(endDate + 'T23:59:59');
    filtered = filtered.filter(function (r) {
      return r[10] && new Date(r[10]) <= e;
    });
  }
  if (officer) {
    filtered = filtered.filter(function (r) {
      return r[8] && r[8].trim() === officer;
    });
  }
  renderRepaymentTable(filtered);
}

function resetRepaymentFilters() {
  document.getElementById('repaymentStartDate').value = '';
  document.getElementById('repaymentEndDate').value   = '';
  document.getElementById('repaymentOfficerFilter').value = '';
  renderRepaymentTable(allRepaymentRows);
}
