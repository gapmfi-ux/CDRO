// Google Apps Script Web App URL — REPLACE with your deployment
const GAS_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';

/**
 * Call a Google Apps Script function via JSONP.
 * The GAS doGet(e) handler must return: callbackName(JSON.stringify(result));
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
const Api = {
  loginUser:               function (c) { return callGAS('loginUser', c); },
  getLoanData:             function ()  { return callGAS('getLoanData'); },
  getPARValue:             function ()  { return callGAS('getPARValue'); },
  saveCallReport:          function (d) { return callGAS('saveCallReport', d); },
  getCallReportData:       function ()  { return callGAS('getCallReportData'); },
  saveSalesActivity:       function (d) { return callGAS('saveSalesActivityToSheet', d); },
  getAllSalesActivities:   function ()  { return callGAS('getAllSalesActivities'); },
  getExpectedRepaymentData:function ()  { return callGAS('getExpectedRepaymentData'); },
  saveUser:                function (d) { return callGAS('saveUser', d); },
  getUserList:             function ()  { return callGAS('getUserList'); },
  importExcel:             function (b, f) { return callGAS('importExcelToSheet', { base64: b, filename: f }); },
  getLastUploadDate:       function ()  { return callGAS('getLastUploadDate'); }
};
