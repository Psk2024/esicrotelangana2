/* =========================================================
   ACCOUNTING UNIT MAPPING
   There are only THREE accounting units. Most branches are
   accounted under "Regional Office, Telangana". A couple of
   branches (the hospitals) are their own accounting unit.
   ========================================================= */
const ACCOUNTING_UNIT_OVERRIDES = new Set([
  "ESIC MCH, Sanathnagar",
  "ESIC SSH, Sanathnagar"
]);

const DEFAULT_ACCOUNTING_UNIT = "Regional Office, Telangana";

function getAccountingUnit(branch) {
  const b = (branch || "").trim();
  if (ACCOUNTING_UNIT_OVERRIDES.has(b)) return b;
  return DEFAULT_ACCOUNTING_UNIT;
}
