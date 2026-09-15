/* ============================================================
   FOLLOW UP MODAL
   ============================================================ */
function openFollowUpModal(row) {
  if (!row) return;
  document.getElementById('modal-loan-number').textContent = row[0];
  document.getElementById('modal-borrower-name').textContent = row[1];
  document.getElementById('modal-principal-arrears').textContent = row[6];
  document.getElementById('modal-interest-arrears').textContent = row[7];
  document.getElementById('modal-penalty').textContent = row[8];
  document.getElementById('modal-credit-officer').textContent = row[11];
  document.getElementById('modal-feedback').value = '';
  document.getElementById('modal-action').value = '';
  document.getElementById('followup-modal').style.display = 'block';
}

function closeFollowUpModal() {
  document.getElementById('followup-modal').style.display = 'none';
}

let isSaving = false;

function saveFollowUpComment() {
  if (isSaving) return;
  isSaving = true;

  const data = {
    loanNumber:      document.getElementById('modal-loan-number').textContent,
    borrowerName:    document.getElementById('modal-borrower-name').textContent,
    principalArrears: document.getElementById('modal-principal-arrears').textContent,
    interestArrears: document.getElementById('modal-interest-arrears').textContent,
    penalty:         document.getElementById('modal-penalty').textContent,
    creditOfficer:   document.getElementById('modal-credit-officer').textContent,
    customerFeedback: document.getElementById('modal-feedback').value,
    actionTaken:     document.getElementById('modal-action').value
  };

  const saveBtn = document.querySelector('#followup-modal .modal-save-btn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="material-icons">hourglass_empty</i> Saving...';
  }

  api.saveCallReport(data)
    .then(msg => {
      isSaving = false;
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="material-icons">save</i> Save';
      }
      alert(msg);
      closeFollowUpModal();
      loadLoanData();
    })
    .catch(err => {
      isSaving = false;
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="material-icons">save</i> Save';
      }
      alert('Error: ' + err.message);
    });
}

/* ============================================================
   CALL REPORT MODAL (per loan)
   ============================================================ */
function openCallReportModal(loanNum) {
  document.getElementById('callReportModal').style.display = 'block';
  const tbody = document.getElementById('callReportTableBody');
  tbody.innerHTML = "";

  api.getCallReportData().then(rows => {
    const filteredRows = rows.filter(row => String(row[0]) === String(loanNum));
    if (filteredRows.length === 0) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 9;
      td.textContent = "No reports found for this loan number.";
      td.style.textAlign = "center";
      td.style.padding = "20px";
      td.style.color = "#666";
      tr.appendChild(td);
      tbody.appendChild(tr);
    } else {
      filteredRows.forEach(function(row, index) {
        const tr = document.createElement('tr');
        tr.className = "report-row";
        const columnsToShow = [0, 1, 2, 3, 4, 5, 6, 7];
        columnsToShow.forEach(colIndex => {
          const td = document.createElement('td');
          if ([2, 3, 4].includes(colIndex)) {
            td.className = "numeric-cell";
            td.innerHTML = `<span class="${row[colIndex] > 0 ? 'red' : ''}">${formatCurrency(row[colIndex])}</span>`;
          } else if (colIndex === 5) {
            td.className = "date-cell";
            td.textContent = formatDate(row[colIndex]);
          } else {
            td.textContent = row[colIndex] || '-';
          }
          tr.appendChild(td);
        });
        const actionTd = document.createElement('td');
        actionTd.className = "action-cell";
        actionTd.innerHTML = `
          <button class="view-report-btn" onclick="viewReportDetails(${index})">
            <i class="material-icons">visibility</i>
          </button>`;
        tr.appendChild(actionTd);
        tr.dataset.reportData = JSON.stringify(row);
        tbody.appendChild(tr);
      });
    }
  }).catch(err => console.error('openCallReportModal failed:', err));
}

function closeCallReportModal() {
  document.getElementById('callReportModal').style.display = 'none';
}

function formatCurrency(value) {
  if (isNaN(value)) return value;
  return new Intl.NumberFormat('en-US', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(value);
}

function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/* ============================================================
   REPORT DETAILS MODAL
   ============================================================ */
function viewReportDetails(index) {
  const row = document.querySelectorAll('#callReportTableBody tr')[index];
  const reportData = JSON.parse(row.dataset.reportData);
  document.getElementById('report-details-loan-number').textContent = reportData[0];
  document.getElementById('report-details-borrower').textContent = reportData[1];
  document.getElementById('report-details-date').textContent = reportData[5];
  document.getElementById('report-details-principal').textContent = reportData[2];
  document.getElementById('report-details-interest').textContent = reportData[3];
  document.getElementById('report-details-penalty').textContent = reportData[4];
  document.getElementById('report-details-feedback').textContent = reportData[6];
  document.getElementById('report-details-action').textContent = reportData[7];
  document.getElementById('report-details-credit-officer').textContent = reportData[8];
  document.getElementById('reportDetailsModal').style.display = 'block';
}

function closeReportDetailsModal() {
  document.getElementById('reportDetailsModal').style.display = 'none';
}

/* ============================================================
   PRINT
   ============================================================ */
function printReportDetails() { window.print(); }

function printCallReportModal() {
  var printContents = document.querySelector('#callReportModal .modal-table-wrapper').innerHTML;
  var header = '<h2 style="text-align:center;margin-bottom:15px;">CALL REPORTS</h2>';
  var style = `
    <style>
      body { font-family: Arial, sans-serif; color: #333; }
      table { width: 100%; border-collapse: collapse; font-size:12px; }
      th, td { border: 1px solid #888; padding: 4px 8px; text-align:left; }
      th { background: #e3f2fd; }
      .red { color: #c62828; font-weight: bold; }
      .numeric-cell { text-align:right; }
      .date-cell { white-space:nowrap; }
    </style>`;
  var win = window.open('', '', 'height=700,width=1100');
  win.document.write('<html><head><title>Print Call Reports</title>' + style + '</head><body>');
  win.document.write(header);
  win.document.write(printContents);
  win.document.write('</body></html>');
  win.document.close();
  win.focus();
  win.print();
  setTimeout(() => win.close(), 500);
}

/* ============================================================
   ALL CALL REPORTS VIEW
   ============================================================ */
function showAllCallReports() {
  document.getElementById('mainLoanView').style.display = 'none';
  document.getElementById('allSalesActivitiesContainer').style.display = 'none';
  document.getElementById('allCallReportsContainer').style.display = '';

  api.getCallReportData().then(rows => {
    window.allCallReports = rows;
    populateOfficerDropdown(rows, 'callReportOfficerFilter', 8, 'All Officers');
    renderAllCallReportsTable(rows);
  }).catch(err => console.error('showAllCallReports failed:', err));
}

function renderAllCallReportsTable(rows) {
  const tbody = document.getElementById('allCallReportsTableBody');
  tbody.innerHTML = "";
  if (!Array.isArray(rows) || rows.length === 0) {
    showNoDataMessage(tbody, 9, "No call reports found.");
    return;
  }
  rows.forEach((row) => {
    const tr = document.createElement('tr');
    tr.className = "report-row";
    [0, 1, 2, 3, 4, 5, 6, 7, 8].forEach(colIndex => {
      const td = document.createElement('td');
      if ([2, 3, 4].includes(colIndex)) {
        td.className = "numeric-cell";
        td.innerHTML = `<span class="${row[colIndex] > 0 ? 'red' : ''}">${formatNumber(row[colIndex])}</span>`;
      } else if (colIndex === 5) {
        td.className = "date-cell";
        td.textContent = formatDisplayDate(row[colIndex]);
      } else {
        td.textContent = row[colIndex] || '-';
      }
      tr.appendChild(td);
    });
    tr.dataset.reportData = JSON.stringify(row);
    tbody.appendChild(tr);
  });
}

function filterAllCallReports() {
  const startDate = document.getElementById('callReportStartDate').value;
  const endDate = document.getElementById('callReportEndDate').value;
  const officer = document.getElementById('callReportOfficerFilter').value;
  let filtered = window.allCallReports || [];

  if (startDate) {
    const start = new Date(startDate + "T00:00:00");
    filtered = filtered.filter(row => new Date(row[5]) >= start);
  }
  if (endDate) {
    const end = new Date(endDate + "T23:59:59");
    filtered = filtered.filter(row => new Date(row[5]) <= end);
  }
  if (officer) {
    filtered = filtered.filter(row => row[8] && row[8].trim() === officer);
  }
  renderAllCallReportsTable(filtered);
}

function resetCallReportFilters() {
  document.getElementById('callReportStartDate').value = "";
  document.getElementById('callReportEndDate').value = "";
  document.getElementById('callReportOfficerFilter').value = "";
  renderAllCallReportsTable(window.allCallReports || []);
}
