(function () {
  const cfg = window.APP_CONFIG || {};
  const DEBUG = !!cfg.DEBUG;
  const API_URL = cfg.API_URL || null;
  const REQUEST_TIMEOUT_MS = cfg.REQUEST_TIMEOUT_MS || 30000;

  // Primary transport: either google.script.run (Apps Script) or fetch to API_URL (doPost)
  function _gasCall(fnName, ...args) {
    // If running inside an Apps Script web app (server-side html sandbox)
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      return new Promise((resolve, reject) => {
        try {
          google.script.run
            .withSuccessHandler(resolve)
            .withFailureHandler(function(err) {
              // Google Apps Script failure handler may receive an object or string
              if (err && err.message) reject(new Error(err.message));
              else reject(new Error(String(err)));
            })[fnName](...args);
        } catch (err) {
          reject(new Error('Apps Script Error: ' + (err && err.message ? err.message : String(err))));
        }
      });
    }

    // Fallback: call the deployed Apps Script webapp via POST /exec (doPost handler)
    if (API_URL) {
      return new Promise((resolve, reject) => {
        const controller = (typeof AbortController !== 'undefined') ? new AbortController() : null;
        const signal = controller ? controller.signal : undefined;
        const timeout = REQUEST_TIMEOUT_MS;

        if (controller) {
          setTimeout(() => controller.abort(), timeout);
        }

        fetch(API_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fn: fnName, args: args }),
          signal
        })
        .then(response => {
          if (!response.ok) throw new Error('Network response was not ok: ' + response.status);
          return response.json();
        })
        .then(json => {
          // server uses { ok: true, data: ... } or { ok: false, error: '...' }
          if (json && json.ok) resolve(json.data);
          else {
            const msg = (json && json.error) ? json.error : 'Unknown server error';
            reject(new Error(msg));
          }
        })
        .catch(err => {
          if (err && err.name === 'AbortError') reject(new Error('Request timed out'));
          else reject(err);
        });
      });
    }

    // No transport available
    return Promise.reject(new Error('No transport available: google.script.run not present and API_URL not configured.'));
  }

  function _call(fnName, ...args) {
    if (DEBUG) console.log(`[api] Calling ${fnName}`, args);
    return _gasCall(fnName, ...args);
  }

  // Public API — functions used by the app
  window.api = {
    // Loans
    getLoanData: () => _call("getLoanData"),
    getPARValue: () => _call("getPARValue"),

    // Call Reports
    saveCallReport: (data) => _call("saveCallReport", data),
    getCallReportData: () => _call("getCallReportData"),

    // Users
    saveUser: (data) => _call("saveUser", data),
    getUserList: () => _call("getUserList"),
    loginUser: (creds) => _call("loginUser", creds),

    // Excel Import
    importExcelToSheet: (b64, name) => _call("importExcelToSheet", b64, name),
    getLastUploadDate: () => _call("getLastUploadDate"),

    // Sales Activities
    saveSalesActivityToSheet: (data) => _call("saveSalesActivityToSheet", data),
    getAllSalesActivities: () => _call("getAllSalesActivities")
  };
})();
