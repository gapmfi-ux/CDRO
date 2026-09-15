

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
  const url = API_URL;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);

  if (DEBUG) console.log(`[api] POST ${url} fn=${fnName}`, args);

  return fetch(url, {
    method: "POST",
    // text/plain keeps this a "simple request" — no CORS preflight,
    // which Apps Script /exec endpoints don't answer.
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ fn: fnName, args: args }),
    signal: controller.signal,
    redirect: "follow"
  })
    .then(res => {
      if (!res.ok) throw new Error(`HTTP ${res.status} on ${fnName}`);
      return res.json();
    })
    .then(json => {
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
