(function () {
  const cfg = window.APP_CONFIG || {};
  const DEBUG = !!cfg.DEBUG;
  const API_URL = cfg.API_URL || null;
  const REQUEST_TIMEOUT_MS = cfg.REQUEST_TIMEOUT_MS || 30000;

  // Try google.script.run first (when hosted inside Apps Script HtmlService)
  function _gasCall(fnName, ...args) {
    if (typeof google !== 'undefined' && google.script && google.script.run) {
      return new Promise((resolve, reject) => {
        try {
          google.script.run
            .withSuccessHandler(resolve)
            .withFailureHandler(function(err) {
              if (err && err.message) reject(new Error(err.message));
              else reject(new Error(String(err)));
            })[fnName](...args);
        } catch (err) {
          reject(new Error('Apps Script Error: ' + (err && err.message ? err.message : String(err))));
        }
      });
    }

    // Fallback: JSONP to the deployed webapp (avoid CORS)
    if (API_URL) {
      return _jsonpCall(fnName, args);
    }

    return Promise.reject(new Error('No transport available: google.script.run not present and API_URL not configured.'));
  }

  function _jsonpCall(fnName, argsArray) {
    return new Promise((resolve, reject) => {
      const cbName = '__gs_cb_' + Date.now() + '_' + Math.floor(Math.random() * 10000);
      const timeoutMs = REQUEST_TIMEOUT_MS || 30000;
      let timeoutId = null;
      const cleanup = () => {
        if (timeoutId) clearTimeout(timeoutId);
        try { delete window[cbName]; } catch (e) { window[cbName] = undefined; }
        const s = document.getElementById(cbName + '_script');
        if (s && s.parentNode) s.parentNode.removeChild(s);
      };

      window[cbName] = function(res) {
        cleanup();
        if (res && res.ok) resolve(res.data);
        else reject(new Error(res && res.error ? res.error : 'Server returned an error'));
      };

      // Construct query string
      const qs = '?fn=' + encodeURIComponent(fnName)
        + '&callback=' + encodeURIComponent(cbName)
        + '&args=' + encodeURIComponent(JSON.stringify(argsArray || []));

      const script = document.createElement('script');
      script.id = cbName + '_script';
      script.src = API_URL + qs;
      script.async = true;
      script.onerror = function() {
        cleanup();
        reject(new Error('JSONP script load error'));
      };

      // Timeout
      timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error('Request timed out'));
      }, timeoutMs);

      document.head.appendChild(script);
    });
  }

  function _call(fnName, ...args) {
    if (DEBUG) console.log(`[api] Calling ${fnName}`, args);
    return _gasCall(fnName, ...args);
  }

  // Public API
  window.api = {
    getLoanData: () => _call("getLoanData"),
    getPARValue: () => _call("getPARValue"),
    saveCallReport: (data) => _call("saveCallReport", data),
    getCallReportData: () => _call("getCallReportData"),
    saveUser: (data) => _call("saveUser", data),
    getUserList: () => _call("getUserList"),
    loginUser: (creds) => _call("loginUser", creds),
    importExcelToSheet: (b64, name) => _call("importExcelToSheet", b64, name),
    getLastUploadDate: () => _call("getLastUploadDate"),
    saveSalesActivityToSheet: (data) => _call("saveSalesActivityToSheet", data),
    getAllSalesActivities: () => _call("getAllSalesActivities")
  };
})();
