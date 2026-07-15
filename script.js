/* ================= CONFIG ================= */
const headerColors = [
  "var(--primary)",
  "var(--secondary)",
  "var(--accent-dark)",
  "#0f766e",
  "#6d28d9"
];
const DESIGNATION_ALIAS = {
  /* Social Security Officer group */
  "Social Security Officer": "Social Security Officer",
  "Branch Manager Gr. II": "Social Security Officer",
  "Office Superintendent": "Social Security Officer",
  "Office Superintendent II": "Social Security Officer",

  /* Insurance Medical Officer group */
  "IMO Gr. I": "Medical Officers",
  "IMO Gr. II": "Medical Officers",
  "State Medical Officer":"Medical Officers",
  "Medical Vigilance Officer":"Medical Officers",
  "Chief Medical Officer":"Medical Officers",
  "Medical Referee":"Medical Officers",
  
  "Cook":"Canteen Staff",
  "Cleaner":"Canteen Staff",
  "Tea Maker":"Canteen Staff",

  "Assistant":"Assistant",
  "Assistant (C)":"Assistant",

  "Assistant Director":"Assistant Director",
  "Assistant Director (Adhoc)":"Assistant Director",
  
  "Upper Division Clerk":"Upper Division Clerk",
  "Upper Division Clerk (C)":"Upper Division Clerk",
  
  "Junior Engineer (Electrical)":"Junior Engineers",
  "Junior Engineer (Civil)":"Junior Engineers",
  
  "Record Keeper":"Multitasking Staff",
  "Multitasking Staff":"Multitasking Staff"
  
  

};
const DESIGNATION_GROUP = {
  /* Group A */
  "Regional Director": "A",
  "Joint Director": "A",
  "Deputy Director": "A",
  "Assistant Director": "A",
  "Insurance Medical Officer": "A",
  "Chief Medical Officer": "A",
  "State Medical Officer": "A",
  "Medical Referee": "A",
  "Medical Vigilance Officer": "A",

  /* Group B */
  "Social Security Officer": "C",
  "Private Secretary": "B",
  "Personal Assistant": "C",
  "Stenographer": "C",

  /* Group C */
  "Assistant": "C",
  "Upper Division Clerk": "C",
  "Lower Divisional Clerk": "C",
  "Multitasking Staff": "C",
  "Junior Engineers": "B",
  "Canteen Staff": "C",
  "Senior Pharmacist": "C",
  "Nursing Officer": "B",
  "Junior Translation Officer": "B",
  "Executive Engineer": "A",
  "Asst. Executive Engineer (Civil)": "A"
};

/* apiKey / spreadsheetId / employeeRange and the COLUMNS map
   now live in config.js (shared with home.js) so they're
   defined in exactly one place. */

/* ================= DOM ================= */
const select = document.getElementById("cadreSelect");
const searchInput = document.getElementById("searchInput");
const container = document.getElementById("employeeTableContainer");
const totalCountEl = document.getElementById("totalCount");
const branchSummaryEl = document.getElementById("branchSummary");

const modal = document.getElementById("employeeModal");
const modalBody = document.getElementById("modalBody");
const closeBtn = document.querySelector(".close-btn");

/* ================= STATE ================= */
let allData = [];
let filteredData = [];

/* ================= ACCOUNTING UNIT (from home page selection) ================= */
const urlParams = new URLSearchParams(window.location.search);
const selectedUnit = urlParams.get("unit") ? decodeURIComponent(urlParams.get("unit")) : "";
const selectedEmpId = urlParams.get("emp") ? decodeURIComponent(urlParams.get("emp")) : "";

/* ================= FETCH DATA ================= */
async function fetchData() {
  try {
    const res = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${CONFIG.spreadsheetId}/values/${CONFIG.employeeRange}?key=${CONFIG.apiKey}`
    );
    const json = await res.json();
    const rows = json.values || [];

    if (!rows.length) {
      container.innerHTML = "<p>No data available</p>";
      return;
    }

    allData = rows.slice(1);

    // Scope to the accounting unit chosen on the home page, if any
    if (selectedUnit) {
      allData = allData.filter(r => getAccountingUnit(r) === selectedUnit);

      const titleEl = document.getElementById("pageTitle");
      const subtitleEl = document.getElementById("unitSubtitle");
      if (subtitleEl) subtitleEl.textContent = selectedUnit;
      if (titleEl) document.title = `Employee Directory - ${selectedUnit}`;

      if (!allData.length) {
        container.innerHTML = `<p>No employees found for "${selectedUnit}"</p>`;
      }
    }

    filteredData = [...allData];

    totalCountEl.textContent = new Set(allData.map(r => r[COLUMNS.EMP_ID])).size;

    populateCadreOptions();
    filterAndDisplay();
    openEmployeeFromSearch();
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>⚠ Unable to load data</p>";
  }
}

/* ================= AUTO-OPEN EMPLOYEE (from home page search) ================= */
function openEmployeeFromSearch() {
  if (!selectedEmpId) return;
  const index = filteredData.findIndex(r => (r[COLUMNS.EMP_ID] || "") === selectedEmpId);
  if (index !== -1) showEmployeeModal(index);
}

/* ================= DROPDOWN ================= */
function populateCadreOptions() {
  const cadres = [...new Set(allData.map(r => r[COLUMNS.BRANCH]).filter(Boolean))].sort();
  select.innerHTML = `<option value="">All Branches</option>`;

  cadres.forEach(c => {
    const opt = document.createElement("option");
    opt.value = c;
    opt.textContent = c;
    select.appendChild(opt);
  });

}

/* ================= FILTER ================= */
function normalizeDesignation(designation) {
  return DESIGNATION_ALIAS[designation] || designation || "Unknown";
}
function filterAndDisplay() {
  const cadre = select.value;
  const term = searchInput.value.trim().toLowerCase();

  filteredData = allData.filter(r => {
    const matchCadre = cadre ? r[COLUMNS.BRANCH] === cadre : true;
    const matchSearch =
      !term ||
      r[COLUMNS.EMP_ID]?.toLowerCase().includes(term) ||
      r[COLUMNS.NAME]?.toLowerCase().includes(term) ||
      r[COLUMNS.BRANCH]?.toLowerCase().includes(term);

    return matchCadre && matchSearch;
  });

  renderTables();
  renderBranchSummary();

  if (dashboardVisible) {
    renderDesignationDashboard();
}
}

/* ================= TABLE RENDER ================= */
function renderTables() {
  if (!filteredData.length) {
    container.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">🔍</div>
        <p>No employees found</p>
      </div>`;
    return;
  }

  const grouped = {};
  filteredData.forEach((r, i) => {
    const place = r[COLUMNS.GROUP] || "Unknown";
    grouped[place] ??= [];
    grouped[place].push({ row: r, index: i });
  });

  let html = "";
  let colorIndex = 0;

  for (const [place, list] of Object.entries(grouped)) {
    const count = new Set(list.map(o => o.row[COLUMNS.EMP_ID])).size;
    const color = headerColors[colorIndex++ % headerColors.length];

    html += `
      <div class="place-section">
        <h2 style="color:${color}">
          ${escapeHtml(place)}
          <span class="place-count">(${count})</span>
        </h2>

        <table class="employee-table">
          <thead>
            <tr>
              <th>Employee ID</th>
              <th>Name</th>
              <th>Designation</th>
              <th>Branch</th>
              <th>Date of Joining</th>
            </tr>
          </thead>
          <tbody>
    `;

    list.forEach(o => {
      const r = o.row;
      html += `
        <tr class="clickable-row" data-index="${o.index}">
          <td>${escapeHtml(r[COLUMNS.EMP_ID]) || "-"}</td>
          <td>${escapeHtml(r[COLUMNS.NAME]) || "-"}</td>
          <td>${escapeHtml(r[COLUMNS.DESIGNATION]) || "-"}</td>
          <td>${escapeHtml(r[COLUMNS.BRANCH]) || "-"}</td>
          <td>${escapeHtml(r[COLUMNS.DOJ_BRANCH]) || "-"}</td>
        </tr>
      `;
    });

    html += `</tbody></table></div>`;
  }

  container.innerHTML = html;

  document.querySelectorAll(".clickable-row").forEach(row => {
    row.addEventListener("click", () =>
      showEmployeeModal(+row.dataset.index)
    );
  });
}

/* ================= BRANCH SUMMARY ================= */
function renderBranchSummary() {
  if (!select.value) {
    branchSummaryEl.innerHTML = "";
    return;
  }

  const counts = {};
  const ids = new Set();

  filteredData.forEach(r => {
    counts[r[COLUMNS.DESIGNATION]] = (counts[r[COLUMNS.DESIGNATION]] || 0) + 1;
    ids.add(r[COLUMNS.EMP_ID]);
  });

  branchSummaryEl.innerHTML = `
    <div class="branch-summary">
      <div class="branch-summary-title">Branch Summary</div>
      <div class="branch-summary-items">
        ${Object.entries(counts)
          .map(
            ([d, c]) =>
              `<div class="summary-pill">${escapeHtml(d)}<span>${c}</span></div>`
          )
          .join("")}
      </div>
      <div class="branch-summary-total">
        Total Employees: <strong>${ids.size}</strong>
      </div>
    </div>
  `;
}

/* ================= MODAL ================= */
function showEmployeeModal(index) {
  const e = filteredData[index];
  if (!e) return;

  const empId = e[COLUMNS.EMP_ID] || "";
  const imageUrl = empId ? `images/${encodeURIComponent(empId)}.jpg` : "images/default.png";
  const contact = e[COLUMNS.CONTACT] || "";
  const contactHtml = contact
    ? (contact.includes("@")
        ? `<a href="mailto:${encodeURIComponent(contact)}">${escapeHtml(contact)}</a>`
        : escapeHtml(contact))
    : "-";

  modalBody.innerHTML = `
    <div class="emp-modal-header">
      <div class="emp-modal-title">
        <h3>${escapeHtml(e[COLUMNS.NAME]) || "-"}</h3>
        ${e[COLUMNS.GROUP] ? `<span class="emp-group-badge">${escapeHtml(e[COLUMNS.GROUP])}</span>` : ""}
      </div>
      <p>${escapeHtml(e[COLUMNS.DESIGNATION]) || "-"}</p>
    </div>

    <div class="emp-modal-body">
      <div class="emp-photo-col">
        <div class="emp-photo">
          <img src="${imageUrl}" onerror="this.src='images/default.png'">
        </div>
        <div class="emp-id-chip">ID ${escapeHtml(empId) || "-"}</div>
      </div>

      <div class="emp-details">
        <div class="detail-section">
          <div class="detail-section-title">Posting</div>
          <div class="detail-grid">
            <div class="label">Branch</div><div class="value">${escapeHtml(e[COLUMNS.BRANCH]) || "-"}</div>
            <div class="label">Accounting Unit</div><div class="value">${escapeHtml(e[COLUMNS.ACCOUNTING_UNIT]) || "-"}</div>
            <div class="label">Gender</div><div class="value">${escapeHtml(e[COLUMNS.GENDER]) || "-"}</div>
            <div class="label">Date of Birth</div><div class="value">${escapeHtml(e[COLUMNS.DOB]) || "-"}</div>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Service Record</div>
          <div class="detail-grid">
            <div class="label">Date of Joining (Branch)</div><div class="value">${escapeHtml(e[COLUMNS.DOJ_BRANCH]) || "-"}</div>
            <div class="label">Date of Joining (Accounting Unit)</div><div class="value">${escapeHtml(e[COLUMNS.DOJ_ACCOUNTING_UNIT]) || "-"}</div>
            <div class="label">Date of Joining (ESIC)</div><div class="value">${escapeHtml(e[COLUMNS.DOJ_ESIC]) || "-"}</div>
            <div class="label">Date of Promotion of Current Post</div><div class="value">${escapeHtml(e[COLUMNS.DATE_OF_PROMOTION]) || "-"}</div>
            <div class="label">Date of Retirement</div><div class="value">${escapeHtml(e[COLUMNS.RETIREMENT]) || "-"}</div>
          </div>
        </div>

        <div class="detail-section">
          <div class="detail-section-title">Contact</div>
          <div class="detail-grid">
            <div class="label">Contact Details</div><div class="value">${contactHtml}</div>
          </div>
        </div>
      </div>
    </div>
  `;

  modal.style.display = "block";
}

let activeDesignation = null;

function renderDesignationDashboard() {
  const dashboard = document.getElementById("designationDashboard");
  if (!dashboard) return;

  // designation -> Set of unique Employee IDs
  const designationMap = new Map();

  allData.forEach(r => {
    const empId = r[COLUMNS.EMP_ID];
    const designation = normalizeDesignation(r[COLUMNS.DESIGNATION]);

    if (!designationMap.has(designation)) {
      designationMap.set(designation, new Set());
    }

    designationMap.get(designation).add(empId);
  });

  dashboard.innerHTML = Array.from(designationMap.entries())
    .map(([designation, empSet]) => `
      <div class="designation-card ${activeDesignation === designation ? "active" : ""}"
           onclick="toggleDesignationFilter('${escapeHtml(designation).replace(/'/g, "\\'")}')">
        <div class="designation-name">${escapeHtml(designation)}</div>
        <div class="designation-count">${empSet.size}</div>
      </div>
    `)
    .join("");
}
function resetAllFilters() {
  activeDesignation = null;

  // reset dropdown & search
  select.value = "";
  searchInput.value = "";

  // reset data
  filteredData = [...allData];

  container.scrollIntoView({ behavior: "smooth" });

  renderTables();
  renderBranchSummary();
  renderDesignationDashboard();
}
function toggleDesignationFilter(designation) {
  if (activeDesignation === designation) {
    activeDesignation = null;
  } else {
    activeDesignation = designation;
  }

  const cadre = select.value;
  const term = searchInput.value.trim().toLowerCase();

  filteredData = allData.filter(r => {
    const matchDesignation = activeDesignation
      ? normalizeDesignation(r[COLUMNS.DESIGNATION]) === activeDesignation
      : true;

    const matchCadre = cadre ? r[COLUMNS.BRANCH] === cadre : true;

    const matchSearch =
      !term ||
      r[COLUMNS.EMP_ID]?.toLowerCase().includes(term) ||
      r[COLUMNS.NAME]?.toLowerCase().includes(term) ||
      r[COLUMNS.BRANCH]?.toLowerCase().includes(term);

    return matchDesignation && matchCadre && matchSearch;
  });

  container.scrollIntoView({ behavior: "smooth" });

  renderTables();
  renderBranchSummary();
  renderDesignationDashboard();
}
/* ================= MODAL CLOSE ================= */
closeBtn.onclick = () => (modal.style.display = "none");

window.onclick = e => {
  if (e.target === modal) modal.style.display = "none";
};

window.addEventListener("keydown", e => {
  if (e.key === "Escape") modal.style.display = "none";
});

/* ================= EVENTS ================= */
select.addEventListener("change", filterAndDisplay);
searchInput.addEventListener("input", filterAndDisplay);
const totalCard = document.getElementById("totalCard");
const dashboard = document.getElementById("designationDashboard");

let dashboardVisible = false;

totalCard.addEventListener("click", () => {
  dashboardVisible = !dashboardVisible;

  if (dashboardVisible) {
    dashboard.style.display = "grid";   // show
    renderDesignationDashboard();       // build dashboard
  } else {
    dashboard.style.display = "none";   // hide
  }
});
/* ================= INIT =================
   Wait for auth-guard.js to confirm sign-in before hitting
   the Sheets API - no point fetching data for a page that's
   about to redirect to login. */
document.addEventListener("authReady", fetchData);
