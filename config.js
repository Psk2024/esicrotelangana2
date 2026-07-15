/* =========================================================
   SHARED CONFIG
   Single source of truth for the Google Sheets API key,
   spreadsheet ID, and data range. Previously duplicated in
   home.js and script.js.

   SECURITY NOTE: this key is visible to anyone who views the
   page source. Restrict it in Google Cloud Console to:
     - HTTP referrers: your site's domain(s) only
     - API restriction: Google Sheets API only
   For stronger protection (e.g. if the sheet contains data
   that shouldn't be public), proxy this request through a
   Cloud Function instead of calling the Sheets API directly
   from the browser.
   ========================================================= */
const CONFIG = {
  apiKey: "AIzaSyBLOOYaN0zUBPUkA0FyPot1QL-LFWCpEzc",
  spreadsheetId: "1a4JmwnRPvVHOh5BNOZ-F_sqspasdcowRB7uF-qScd48",
  employeeRange: "Employees2!A1:N"
};

/* =========================================================
   COLUMN MAP (confirmed from sheet headers)
   Single source of truth for row indices, used across
   home.js, script.js, and units.js.
   ========================================================= */
const COLUMNS = {
  EMP_ID: 0,
  NAME: 1,
  DESIGNATION: 2,
  GROUP: 3,
  BRANCH: 4,
  ACCOUNTING_UNIT: 5,
  GENDER: 6,
  DOB: 7,
  RETIREMENT: 8,
  DOJ_BRANCH: 9,
  DOJ_ACCOUNTING_UNIT: 10,
  DOJ_ESIC: 11,
  CONTACT: 12,
  DATE_OF_PROMOTION: 13
};

/* =========================================================
   HTML ESCAPING
   Every field pulled from the spreadsheet (or from a URL
   parameter) must pass through this before being inserted
   via innerHTML, to prevent stored/reflected XSS if a cell
   or URL ever contains markup.
   ========================================================= */
function escapeHtml(value) {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
