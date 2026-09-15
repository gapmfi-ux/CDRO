/**
 * api.js
 * ------------------------------------------------------------
 * Wraps every google.script.run call into a Promise-based API.
 * For local dev on GitHub Pages, replace this file with a
 * fetch()-based mock — nothing else in the app needs to change.
 * ------------------------------------------------------------
 */

function _call(fnName, ...args) {
  return new Promise((resolve, reject) => {
    google.script.run
      .withSuccessHandler(resolve)
      .withFailureHandler(reject)
      [fnName](...args);
  });
}

const api = {
  // ---- Loans ----
  getLoanData: ()                    => _call('getLoanData'),
  getPARValue: ()                    => _call('getPARValue'),

  // ---- Call Reports ----
  saveCallReport: (data)             => _call('saveCallReport', data),
  getCallReportData: ()              => _call('getCallReportData'),

  // ---- Users ----
  saveUser: (data)                   => _call('saveUser', data),
  getUserList: ()                    => _call('getUserList'),
  loginUser: (creds)                 => _call('loginUser', creds),

  // ---- Excel Import ----
  importExcelToSheet: (b64, name)    => _call('importExcelToSheet', b64, name),
  getLastUploadDate: ()              => _call('getLastUploadDate'),

  // ---- Sales Activities ----
  saveSalesActivityToSheet: (data)   => _call('saveSalesActivityToSheet', data),
  getAllSalesActivities: ()          => _call('getAllSalesActivities')
};
