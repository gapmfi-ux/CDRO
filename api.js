/**
 * ============================================================
 * UNIFIED API LAYER
 * ============================================================
 * Provides a consistent interface for client-server communication
 * Uses Google Apps Script native methods (deployed web app)
 * Avoids CORS issues by using google.script.run
 */

(function () {
  const cfg = window.APP_CONFIG || {};
  const DEBUG = !!cfg.DEBUG;

  // ---------- Transport: Apps Script Native ----------
  // This is the primary & only method when deployed as Apps Script
  // google.script.run is available within Google Apps Script web apps
  function _gasCall(fnName, ...args) {
    return new Promise((resolve, reject) => {
      try {
        google.script.run
          .withSuccessHandler(resolve)\n          .withFailureHandler(reject)\n          [fnName](...args);\n      } catch (err) {\n        reject(new Error('Apps Script Error: ' + err.message));\n      }\n    });\n  }\n\n  // ---------- Unified dispatcher ----------\n  function _call(fnName, ...args) {\n    if (DEBUG) console.log(`[api] Calling ${fnName}`, args);\n    return _gasCall(fnName, ...args);\n  }\n\n  // ---------- Public API ----------\n  window.api = {\n    // Loans\n    getLoanData: () => _call(\"getLoanData\"),\n    getPARValue: () => _call(\"getPARValue\"),\n\n    // Call Reports\n    saveCallReport: (data) => _call(\"saveCallReport\", data),\n    getCallReportData: () => _call(\"getCallReportData\"),\n\n    // Users\n    saveUser: (data) => _call(\"saveUser\", data),\n    getUserList: () => _call(\"getUserList\"),\n    loginUser: (creds) => _call(\"loginUser\", creds),\n\n    // Excel Import\n    importExcelToSheet: (b64, name) => _call(\"importExcelToSheet\", b64, name),\n    getLastUploadDate: () => _call(\"getLastUploadDate\"),\n\n    // Sales Activities\n    saveSalesActivityToSheet: (data) => _call(\"saveSalesActivityToSheet\", data),\n    getAllSalesActivities: () => _call(\"getAllSalesActivities\")\n  };\n})();