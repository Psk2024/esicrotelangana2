/* ================= CONFIG ================= */
const apiKey = "AIzaSyBLOOYaN0zUBPUkA0FyPot1QL-LFWCpEzc";
const spreadsheetId = "1a4JmwnRPvVHOh5BNOZ-F_sqspasdcowRB7uF-qScd48";
const employeeRange = "Employees2!A1:N";

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
const unitSearchInput = document.getElementById("unitSearchInput");

/* ================= STATE ================= */
let unitSummary = []; // [{ unit, count }]

/* ================= FETCH DATA ================= */
async function fetchUnits() {
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${employeeRange}?key=${apiKey}`
    );
    const json = await res.json();
    const rows = json.values || [];

    if (!rows.length) {
      unitCardsContainer.innerHTML = "<p class='loading-text'>No data available</p>";
      return;
    }

    const dataRows = rows.slice(1);

    const unitMap = new Map(); // accounting unit -> Set of employee IDs
    dataRows.forEach(r => {
      const unit = getAccountingUnit(r);
      const empId = r[0];
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

/* ================= RENDER ================= */
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
        <div class="unit-card-icon" style="background:${color}">${initials}</div>
        <div class="unit-card-body">
          <div class="unit-card-name">${u.unit}</div>
          <div class="unit-card-count">${u.count} Employee${u.count === 1 ? "" : "s"}</div>
        </div>
      </a>
    `;
  });

  unitCardsContainer.innerHTML = html;
}

/* ================= SEARCH ================= */
unitSearchInput.addEventListener("input", () => {
  const term = unitSearchInput.value.trim().toLowerCase();
  const filtered = unitSummary.filter(u => u.unit.toLowerCase().includes(term));
  renderUnitCards(filtered);
});

/* ================= INIT ================= */
fetchUnits();
