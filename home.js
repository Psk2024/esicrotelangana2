/* ================= CONFIG =================
   apiKey / spreadsheetId / employeeRange now live in
   config.js (shared with script.js) so they're defined
   in exactly one place. */
const unitColors = [
  "Tomato",
  "DodgerBlue",
  "SlateBlue",
  "#8e24aa",
  "#2e7d32",
  "#c2410c",
  "#0f766e"
];

/* ================= DOM ================= */
const unitCardsContainer = document.getElementById("unitCardsContainer");
const employeeResultsContainer = document.getElementById("employeeResultsContainer");
const unitSearchInput = document.getElementById("unitSearchInput");

/* ================= STATE ================= */
let unitSummary = [];   // [{ unit, count }]
let allEmployees = [];  // raw rows, kept for employee search

/* ================= FETCH DATA ================= */
async function fetchUnits() {
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${CONFIG.employeeRange}?key=${CONFIG.apiKey}`
    );
    const json = await res.json();
    const rows = json.values || [];

    if (!rows.length) {
      unitCardsContainer.innerHTML = "<p class='loading-text'>No data available</p>";
      return;
    }

    allEmployees = rows.slice(1);

    const unitMap = new Map(); // accounting unit -> Set of employee IDs
    allEmployees.forEach(r => {
      const unit = getAccountingUnit(r);
      const empId = r[COLUMNS.EMP_ID];
      if (!unitMap.has(unit)) unitMap.set(unit, new Set());
      unitMap.get(unit).add(empId);
    });

    unitSummary = Array.from(unitMap.entries())
      .map(([unit, ids]) => ({ unit, count: ids.size }))
      .sort((a, b) => {
        // Regional Office first, then alphabetical
        if (a.unit === DEFAULT_ACCOUNTING_UNIT) return -1;
        if (b.unit === DEFAULT_ACCOUNTING_UNIT) return 1;
        return a.unit.localeCompare(b.unit);
      });

    renderUnitCards(unitSummary);
  } catch (err) {
    console.error(err);
    unitCardsContainer.innerHTML = "<p class='loading-text'>⚠ Unable to load accounting units</p>";
  }
}

/* ================= RENDER: UNIT CARDS ================= */
function renderUnitCards(units) {
  if (!units.length) {
    unitCardsContainer.innerHTML = "<p class='loading-text'>No accounting units found</p>";
    return;
  }

  const totalEmployees = units.reduce((sum, u) => sum + u.count, 0);

  let html = `
    <a class="unit-card unit-card-all" href="directory.html">
      <div class="unit-card-icon" style="background:var(--primary)">All</div>
      <div class="unit-card-body">
        <div class="unit-card-name">All Accounting Units</div>
        <div class="unit-card-count">${totalEmployees} Employees</div>
      </div>
    </a>
  `;

  units.forEach((u, i) => {
    const color = unitColors[i % unitColors.length];
    const initials = u.unit
      .split(/\s|,/)
      .filter(Boolean)
      .slice(0, 2)
      .map(w => w[0])
      .join("")
      .toUpperCase();

    html += `
      <a class="unit-card" href="directory.html?unit=${encodeURIComponent(u.unit)}">
        <div class="unit-card-icon" style="background:${color}">${escapeHtml(initials)}</div>
        <div class="unit-card-body">
          <div class="unit-card-name">${escapeHtml(u.unit)}</div>
          <div class="unit-card-count">${u.count} Employee${u.count === 1 ? "" : "s"}</div>
        </div>
      </a>
    `;
  });

  unitCardsContainer.innerHTML = html;
}

/* ================= RENDER: EMPLOYEE SEARCH RESULTS ================= */
function renderEmployeeResults(term) {
  const matches = allEmployees.filter(r => {
    const id = (r[COLUMNS.EMP_ID] || "").toLowerCase();
    const name = (r[COLUMNS.NAME] || "").toLowerCase();
    const designation = (r[COLUMNS.DESIGNATION] || "").toLowerCase();
    return id.includes(term) || name.includes(term) || designation.includes(term);
  });

  if (!matches.length) {
    employeeResultsContainer.innerHTML = `<p class="loading-text">No employees found for "${term}"</p>`;
    return;
  }

  const MAX_RESULTS = 30;
  const shown = matches.slice(0, MAX_RESULTS);

  let html = shown
    .map(r => {
      const empId = r[COLUMNS.EMP_ID] || "";
      const name = r[COLUMNS.NAME] || "-";
      const designation = r[COLUMNS.DESIGNATION] || "-";
      const branch = r[COLUMNS.BRANCH] || "-";
      const unit = getAccountingUnit(r);
      const initials = name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0])
        .join("")
        .toUpperCase();

      return `
        <a class="employee-result-card" href="directory.html?unit=${encodeURIComponent(unit)}&emp=${encodeURIComponent(empId)}">
          <div class="employee-result-icon">${escapeHtml(initials) || "?"}</div>
          <div class="employee-result-body">
            <div class="employee-result-name">${escapeHtml(name)}</div>
            <div class="employee-result-meta">${escapeHtml(designation)} &middot; ${escapeHtml(branch)}</div>
            <div class="employee-result-unit">${escapeHtml(unit)}</div>
          </div>
        </a>
      `;
    })
    .join("");

  if (matches.length > MAX_RESULTS) {
    html += `<p class="loading-text">Showing first ${MAX_RESULTS} of ${matches.length} matches — refine your search for more.</p>`;
  }

  employeeResultsContainer.innerHTML = html;
}

/* ================= SEARCH ================= */
unitSearchInput.addEventListener("input", () => {
  const term = unitSearchInput.value.trim().toLowerCase();

  if (!term) {
    employeeResultsContainer.innerHTML = "";
    employeeResultsContainer.classList.remove("active");
    unitCardsContainer.classList.remove("hidden");
    return;
  }

  unitCardsContainer.classList.add("hidden");
  employeeResultsContainer.classList.add("active");
  renderEmployeeResults(term);
});

/* ================= INIT =================
   Wait for auth-guard.js to confirm sign-in before hitting
   the Sheets API - no point fetching data for a page that's
   about to redirect to login. */
document.addEventListener("authReady", fetchUnits);
