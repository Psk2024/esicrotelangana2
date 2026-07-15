/* =========================================================
   ACCOUNTING UNIT
   The sheet has a dedicated "Accounting Unit" column (F),
   separate from "Branch" (E). We read it directly rather
   than guessing it from the branch name.
   Column index now comes from the shared COLUMNS map in
   config.js, so it stays in sync everywhere it's used.
   ========================================================= */
const DEFAULT_ACCOUNTING_UNIT = "Regional Office, Telangana";

function getAccountingUnit(row) {
  const val = (row[COLUMNS.ACCOUNTING_UNIT] || "").trim();
  return val || DEFAULT_ACCOUNTING_UNIT;
}
