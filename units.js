/* =========================================================
   ACCOUNTING UNIT
   The sheet has a dedicated "Accounting Unit" column (F),
   separate from "Branch" (E). We read it directly rather
   than guessing it from the branch name.
   ========================================================= */
const ACCOUNTING_UNIT_COLUMN_INDEX = 5; // column F
const DEFAULT_ACCOUNTING_UNIT = "Regional Office, Telangana";

function getAccountingUnit(row) {
  const val = (row[ACCOUNTING_UNIT_COLUMN_INDEX] || "").trim();
  return val || DEFAULT_ACCOUNTING_UNIT;
}
