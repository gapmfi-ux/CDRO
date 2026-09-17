// Google Apps Script Web App URL from Config.js
var GAS_URL = (window.APP_CONFIG && window.APP_CONFIG.GAS_URL) || '';

/**
 * Call a Google Apps Script function via JSONP.
 * GAS doGet(e) must return: callbackName(JSON.stringify(result));
 */
function callGAS(functionName, params) {
  params = params || {};
  return new Promise(function (resolve, reject) {
    var callbackName = 'gasCallback_' + Date.now() + '_' + Math.random().toString(36).slice(2);
    var script;

    window[callbackName] = function (data) {
      delete window[callbackName];
      if (script && script.parentNode) script.parentNode.removeChild(script);
      resolve(data);
    };

    var url = GAS_URL +
      '?function=' + encodeURIComponent(functionName) +
      '&callback=' + encodeURIComponent(callbackName) +
      '&params=' + encodeURIComponent(JSON.stringify(params));

    script = document.createElement('script');
    script.src = url;
    script.onerror = function () {
      delete window[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
      reject(new Error('Failed to call ' + functionName));
    };
    document.body.appendChild(script);
  });
}

// ---- API Methods (mirror your Apps Script functions) ----
var Api = {
  // Auth
  loginUser:                function (c) { return callGAS('loginUser', c); },

  // Loans
  getLoanData:              function ()  { return callGAS('getLoanData'); },
  getPARValue:              function ()  { return callGAS('getPARValue'); },

  // Call Reports
  saveCallReport:           function (d) { return callGAS('saveCallReport', d); },
  getCallReportData:        function ()  { return callGAS('getCallReportData'); },

  // Sales Activities
  saveSalesActivity:        function (d) { return callGAS('saveSalesActivityToSheet', d); },
  getAllSalesActivities:    function ()  { return callGAS('getAllSalesActivities'); },

  // Repayment
  getExpectedRepaymentData: function ()  { return callGAS('getExpectedRepaymentData'); },

  // Users
  saveUser:                 function (d) { return callGAS('saveUser', d); },
  getUserList:              function ()  { return callGAS('getUserList'); },
  updatePassword:           function (d) { return callGAS('updatePassword', d); },
  deleteUser:               function (d) { return callGAS('deleteUser', d); },

  // Upload
  importExcel:              function (b, f) { return callGAS('importExcelToSheet', { base64: b, filename: f }); },
  getLastUploadDate:        function ()  { return callGAS('getLastUploadDate'); }
};
