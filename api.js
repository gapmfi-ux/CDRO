/**
 * api.js
 * ------------------------------------------------------------
 * API layer. Chooses transport based on window.APP_CONFIG.API_URL:
 *
 *   API_URL === "" → google.script.run (Apps Script runtime)
 *   API_URL !== "" → fetch() to REST endpoints (dev/mock/remote)
 *
 * Every method returns a Promise either way.
 * ------------------------------------------------------------
 */

(function () {
  const cfg = window.APP_CONFIG || {};
  const API_URL = (cfg.API_URL || "").replace(/\/+$/, ""); // strip trailing slash
  const TIMEOUT = cfg.REQUEST_TIMEOUT_MS || 30000;
  const DEBUG   = !!cfg.DEBUG;

  // ---------- Transport: Apps Script ----------
  function _gasCall(fnName, ...args) {
    return new Promise((resolve, reject) => {
      google.script.run
        .withSuccessHandler(resolve)
        .withFailureHandler(reject)
        [fnName](...args);
    });
  }

  // ---------- Transport: REST / fetch ----------
  function _fetchCall(fnName, ...args) {
    const url = `${API_URL}/${fnName}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);

    if (DEBUG) console.log(`[api] POST ${url}`, args);

    return fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ args }),
      signal: controller.signal
    })
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status} on ${fnName}`);
        return res.json();
      })
      .then(json => {
        // Expected shape: { ok: true, data: ... } or { ok: false, error: "..." }
        if (json && json.ok === false) throw new Error(json.error || "API error");
        return json && "data" in json ? json.data : json;
      })
      .finally(() => clearTimeout(timer));
  }

  // ---------- Unified dispatcher ----------
  function _call(fnName, ...args) {
    return API_URL ? _fetchCall(fnName, ...args) : _gasCall(fnName, ...args);
  }

  // ---------- Public API ----------
  window.api = {
    // Loans
    getLoanData:      ()              => _call("getLoanData"),
    getPARValue:      ()              => _call("getPARValue"),

    // Call Reports
    saveCallReport:   (data)          => _call("saveCallReport", data),
    getCallReportData:()              => _call("getCallReportData"),

    // Users
    saveUser:         (data)          => _call("saveUser", data),
    getUserList:      ()              => _call("getUserList"),
    loginUser:        (creds)         => _call("loginUser", creds),

    // Excel Import
    importExcelToSheet:(b64, name)    => _call("importExcelToSheet", b64, name),
    getLastUploadDate:()              => _call("getLastUploadDate"),

    // Sales Activities
    saveSalesActivityToSheet:(data)   => _call("saveSalesActivityToSheet", data),
    getAllSalesActivities:()          => _call("getAllSalesActivities")
  };
})();
