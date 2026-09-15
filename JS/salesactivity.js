/* ============================================================
   SALES ACTIVITY MODULE
   ============================================================ */

// ============================================================
// SALES ACTIVITY MODAL
// ============================================================
function openSalesActivityModal() {
  const today = new Date().toISOString().split('T')[0];
  document.getElementById('activity-date').value = today;
  document.getElementById('sales-activity-modal').style.display = 'block';
}

function closeSalesActivityModal() {
  document.getElementById('sales-activity-modal').style.display = 'none';
  document.getElementById('sales-activity-form').reset();
}

let isSavingActivity = false;

function saveSalesActivity() {
  if (isSavingActivity) return;
  isSavingActivity = true;

  const saveBtn = document.querySelector('#sales-activity-modal .modal-save-btn');
  if (saveBtn) {
    saveBtn.disabled = true;
    saveBtn.innerHTML = '<i class="material-icons">hourglass_empty</i> Saving...';
  }

  try {
    const formData = {
      activityDate: document.getElementById('activity-date').value,
      destination: document.getElementById('destination').value,
      salesActivity: document.getElementById('sales-activity').value,
      clientsVisited: document.getElementById('clients-visited').value,
      transportMode: document.getElementById('transport-mode').value,
      remarks: document.getElementById('remarks').value,
      creditOfficer: window.currentCreditOfficer
    };

    const errors = [];
    if (!formData.activityDate) errors.push('Date is required');
    if (!formData.destination) errors.push('Destination is required');
    if (!formData.salesActivity) errors.push('Sales activity description is required');
    if (!formData.transportMode) errors.push('Transport mode is required');

    if (errors.length > 0) throw new Error(errors.join('\n'));

    api.saveSalesActivityToSheet(formData)
      .then(msg => {
        isSavingActivity = false;
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="material-icons">save</i> Save Activity';
        }
        alert(msg);
        closeSalesActivityModal();
      })
      .catch(err => {
        isSavingActivity = false;
        if (saveBtn) {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="material-icons">save</i> Save Activity';
        }
        alert('Error saving activity:\n' + (err && err.message ? err.message : err));
      });

  } catch (error) {
    isSavingActivity = false;
    if (saveBtn) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="material-icons">save</i> Save Activity';
    }
    alert('Validation Error:\n' + error.message);
  }
}

// ============================================================
// SALES REPORTS VIEW
// ============================================================
function showAllSalesReports() {
  document.getElementById('mainLoanView').style.display = 'none';
  document.getElementById('allCallReportsContainer').style.display = 'none';
  document.getElementById('allSalesActivitiesContainer').style.display = 'block';
  loadAllSalesActivities();
}

function showMySalesReports() {
  document.getElementById('mainLoanView').style.display = 'none';
  document.getElementById('allCallReportsContainer').style.display = 'none';
  document.getElementById('allSalesActivitiesContainer').style.display = 'block';
  loadMySalesActivities();
}

function loadAllSalesActivities() {
  showLoadingModal('Loading sales reports...');
  api.getAllSalesActivities().then(data => {
    const tbody = document.getElementById('allSalesActivitiesTableBody');
    tbody.innerHTML = '';
    if (!data || data.length === 0) {
      showNoDataMessage(tbody);
      hideLoadingModal();
      return;
    }
    window.allSalesReports = data;
    const officerFilter = document.getElementById('salesActivityOfficerFilter');
    if (officerFilter && !officerFilter.disabled) {
      populateOfficerDropdown(data, 'salesActivityOfficerFilter', 2, 'All Officers');
      officerFilter.value = "";
    }
    renderFilteredSalesActivities(data);
    hideLoadingModal();
  }).catch(err => {
    hideLoadingModal();
    console.error('loadAllSalesActivities failed:', err);
  });
}

function loadMySalesActivities() {
  showLoadingModal('Loading your sales reports...');
  api.getAllSalesActivities().then(data => {
    const tbody = document.getElementById('allSalesActivitiesTableBody');
    tbody.innerHTML = '';
    if (!data || data.length === 0) {
      showNoDataMessage(tbody);
      hideLoadingModal();
      return;
    }
    const currentUser = window.currentCreditOfficer;
    const myData = data.filter(activity => activity[2] && activity[2].trim() === currentUser);
    window.allSalesReports = myData;
    const officerFilter = document.getElementById('salesActivityOfficerFilter');
    if (officerFilter) {
      officerFilter.innerHTML = `<option value="">${currentUser}</option>`;
      officerFilter.disabled = true;
    }
    document.getElementById('salesActivityStartDate').value = '';
    document.getElementById('salesActivityEndDate').value = '';
    renderFilteredSalesActivities(myData);
    hideLoadingModal();
  }).catch(err => {
    hideLoadingModal();
    console.error('loadMySalesActivities failed:', err);
  });
}

function renderFilteredSalesActivities(data) {
  const tbody = document.getElementById('allSalesActivitiesTableBody');
  tbody.innerHTML = '';
  if (!data || data.length === 0) {
    showNoDataMessage(tbody);
    return;
  }
  data.forEach(activity => {
    try {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td>${formatDisplayDate(activity[1])}</td>
        <td>${escapeHtml(activity[2] || '')}</td>
        <td>${escapeHtml(activity[3] || '')}</td>
        <td>${formatNumber(activity[5])}</td>
        <td>${escapeHtml(activity[6] || '')}</td>
        <td style="white-space: pre-wrap;">${escapeHtml(activity[4] || '')}</td>
        <td>${escapeHtml(activity[7] || '')}</td>
      `;
      tbody.appendChild(row);
    } catch (error) {
      console.error('Error rendering activity row:', activity, error);
      const errorRow = document.createElement('tr');
      errorRow.innerHTML = `<td colspan="7" style="color:red;">Error displaying record (${activity[0] || 'unknown'})</td>`;
      tbody.appendChild(errorRow);
    }
  });
}

function filterSalesActivities() {
  const startDate = document.getElementById('salesActivityStartDate').value;
  const endDate = document.getElementById('salesActivityEndDate').value;
  const officerFilter = document.getElementById('salesActivityOfficerFilter');
  let filtered = window.allSalesReports || [];

  if (startDate) {
    const start = new Date(startDate + "T00:00:00");
    filtered = filtered.filter(row => new Date(row[1]) >= start);
  }
  if (endDate) {
    const end = new Date(endDate + "T23:59:59");
    filtered = filtered.filter(row => new Date(row[1]) <= end);
  }
  if (officerFilter && !officerFilter.disabled && officerFilter.value) {
    filtered = filtered.filter(row => row[2] && row[2].trim() === officerFilter.value);
  }
  renderFilteredSalesActivities(filtered);
}

function resetSalesActivityFilters() {
  document.getElementById('salesActivityStartDate').value = '';
  document.getElementById('salesActivityEndDate').value = '';
  const officerFilter = document.getElementById('salesActivityOfficerFilter');
  if (officerFilter && !officerFilter.disabled) officerFilter.value = '';
  renderFilteredSalesActivities(window.allSalesReports || []);
}