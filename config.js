/**
 * ============================================================
 * CONFIGURATION & CONSTANTS
 * ============================================================
 * Centralized application configuration
 */

window.APP_CONFIG = {
  // API Configuration
  API_URL: "https://script.google.com/macros/s/AKfycbw1GbgGE01Na80V1zKSTD9Tg4Vdp7b9Oii2KDGS_ItyahEIaVSESCiTx6bpUOFp91Sa/exec",
  REQUEST_TIMEOUT_MS: 30000,
  DEBUG: true,

  // App Info
  APP_NAME: "CREDIT OPERATIONS",
  APP_VERSION: "1.0.0",

  // Column Indices for Data
  LOAN_COLS: {
    NUMBER: 0,
    BORROWER: 1,
    AMOUNT: 2,
    DISBURSED_DATE: 3,
    EXPIRY_DATE: 4,
    OUTSTANDING_BALANCE: 5,
    PRINCIPAL_ARREARS: 6,
    INTEREST_ARREARS: 7,
    PENALTY: 8,
    CONTACT: 9,
    CREDIT_OFFICER: 11
  },

  CALL_REPORT_COLS: {
    LOAN_NUMBER: 0,
    BORROWER: 1,
    PRINCIPAL_ARREARS: 2,
    INTEREST_ARREARS: 3,
    PENALTY: 4,
    DATE_TIME: 5,
    FEEDBACK: 6,
    ACTION: 7,
    OFFICER: 8
  },

  SALES_ACTIVITY_COLS: {
    TIMESTAMP: 0,
    ACTIVITY_DATE: 1,
    OFFICER: 2,
    DESTINATION: 3,
    SALES_ACTIVITY: 4,
    CLIENTS_VISITED: 5,
    TRANSPORT_MODE: 6,
    REMARKS: 7
  },

  // Messages
  MESSAGES: {
    NO_DATA: "No data found",
    LOADING: "Loading, please wait...",
    UPLOADING: "Uploading, please wait...",
    AUTHENTICATING: "Authenticating...",
    ERROR_NO_LOGIN: "No login credit officer found!"
  },

  // UI Settings
  MODAL_ANIMATION_MS: 300,
  UPLOAD_TIMEOUT_MS: 60000,
  PAR_REFRESH_INTERVAL_MS: 60000
};