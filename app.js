const profileFields = [
  "fullName",
  "hireDate",
  "phone",
  "email",
  "address",
  "emergencyContactName",
  "emergencyContactPhone",
  "jobTitle",
  "generalNotes"
];

const state = {
  employees: window.CRSStorage.loadEmployees(),
  selectedEmployeeId: null
};

const employeeList = document.querySelector("#employeeList");
const employeeForm = document.querySelector("#employeeForm");
const checklistContainer = document.querySelector("#checklistContainer");
const statusBadge = document.querySelector("#statusBadge");
const percentComplete = document.querySelector("#percentComplete");
const newEmployeeButton = document.querySelector("#newEmployeeButton");
const deleteEmployeeButton = document.querySelector("#deleteEmployeeButton");
const printButton = document.querySelector("#printButton");

// Browser-safe IDs let us create many employees without a server or database.
function createId() {
  return `employee-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// The checklist starts with every required item unchecked and every notes box empty.
function createBlankChecklist() {
  const checklist = {};
  window.CRS_CHECKLIST_SECTIONS.forEach((section) => {
    checklist[section.id] = { notes: "", items: {} };
    section.items.forEach((item) => {
      checklist[section.id].items[item.id] = false;
    });
  });
  return checklist;
}

// New employees use this shape throughout the app.
function createBlankEmployee() {
  return {
    id: createId(),
    fullName: "",
    hireDate: "",
    phone: "",
    email: "",
    address: "",
    emergencyContactName: "",
    emergencyContactPhone: "",
    jobTitle: "",
    generalNotes: "",
    checklist: createBlankChecklist()
  };
}

function getSelectedEmployee() {
  return state.employees.find((employee) => employee.id === state.selectedEmployeeId);
}

function saveState() {
  window.CRSStorage.saveEmployees(state.employees);
}

// Status is intentionally simple: every checklist item must be complete.
function getCompletion(employee) {
  let completed = 0;
  let total = 0;

  window.CRS_CHECKLIST_SECTIONS.forEach((section) => {
    section.items.forEach((item) => {
      total += 1;
      if (employee.checklist?.[section.id]?.items?.[item.id]) {
        completed += 1;
      }
    });
  });

  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  return { completed, total, percent, ready: total > 0 && completed === total };
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "No hire date";
  }

  const date = new Date(`${dateValue}T00:00:00`);
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makeEmployeeCard(employee, completion) {
  const card = document.createElement("button");
  card.className = `employee-card ${employee.id === state.selectedEmployeeId ? "active" : ""}`;
  card.type = "button";

  const title = document.createElement("h3");
  title.textContent = employee.fullName || "Unnamed employee";

  const badge = document.createElement("span");
  badge.className = `status-badge ${completion.ready ? "ready" : "not-ready"}`;
  badge.textContent = completion.ready ? "READY TO WORK" : "NOT READY";

  const meta = document.createElement("div");
  meta.className = "employee-meta";
  meta.innerHTML = `
    <span>Hire date: ${formatDate(employee.hireDate)}</span>
    <span>${completion.percent}% complete</span>
  `;

  const meter = document.createElement("div");
  meter.className = "meter";
  meter.setAttribute("aria-hidden", "true");
  meter.innerHTML = `<span style="width: ${completion.percent}%"></span>`;

  card.append(title, badge, meta, meter);
  card.addEventListener("click", () => {
    state.selectedEmployeeId = employee.id;
    renderApp();
  });

  return card;
}

function renderDashboard() {
  employeeList.innerHTML = "";

  if (state.employees.length === 0) {
    employeeList.innerHTML = '<div class="empty-state">No employees yet. Use Add Employee to start the first record.</div>';
    return;
  }

  state.employees.forEach((employee) => {
    const completion = getCompletion(employee);
    employeeList.appendChild(makeEmployeeCard(employee, completion));
  });
}

// This builds the visible checklist from src/checklist-data.js.
function renderChecklist(employee) {
  checklistContainer.innerHTML = "";

  window.CRS_CHECKLIST_SECTIONS.forEach((section) => {
    const sectionData = employee.checklist[section.id] || { notes: "", items: {} };
    const sectionElement = document.createElement("section");
    sectionElement.className = "checklist-section";

    const itemsHtml = section.items.map((item) => {
      const checked = sectionData.items[item.id] ? "checked" : "";
      return `
        <label class="check-item">
          <input type="checkbox" data-section-id="${section.id}" data-item-id="${item.id}" ${checked}>
          <span>${item.label}</span>
        </label>
      `;
    }).join("");

    sectionElement.innerHTML = `
      <h4>${section.title}</h4>
      ${itemsHtml}
      <label class="section-notes">
        ${section.title} notes
        <textarea rows="3" data-section-notes="${section.id}" placeholder="Notes for ${section.title.toLowerCase()}.">${escapeHtml(sectionData.notes || "")}</textarea>
      </label>
    `;

    checklistContainer.appendChild(sectionElement);
  });
}

function renderSelectedEmployee() {
  const employee = getSelectedEmployee();
  if (!employee) {
    const blank = createBlankEmployee();
    state.employees.push(blank);
    state.selectedEmployeeId = blank.id;
    saveState();
    renderApp();
    return;
  }

  profileFields.forEach((field) => {
    document.querySelector(`#${field}`).value = employee[field] || "";
  });

  renderChecklist(employee);
  renderStatus(employee);
}

function renderStatus(employee) {
  const completion = getCompletion(employee);
  statusBadge.textContent = completion.ready ? "READY TO WORK" : "NOT READY";
  statusBadge.className = `status-badge ${completion.ready ? "ready" : "not-ready"}`;
  percentComplete.textContent = `${completion.percent}% complete`;
}

function renderApp() {
  renderDashboard();
  renderSelectedEmployee();
}

// Pulls all form and checklist values into the selected employee record.
function updateSelectedEmployeeFromForm() {
  const employee = getSelectedEmployee();
  if (!employee) {
    return;
  }

  profileFields.forEach((field) => {
    employee[field] = document.querySelector(`#${field}`).value.trim();
  });

  document.querySelectorAll("[data-section-id][data-item-id]").forEach((checkbox) => {
    const sectionId = checkbox.dataset.sectionId;
    const itemId = checkbox.dataset.itemId;
    employee.checklist[sectionId].items[itemId] = checkbox.checked;
  });

  document.querySelectorAll("[data-section-notes]").forEach((notesBox) => {
    const sectionId = notesBox.dataset.sectionNotes;
    employee.checklist[sectionId].notes = notesBox.value.trim();
  });

  saveState();
  renderStatus(employee);
  renderDashboard();
}

function addEmployee() {
  const employee = createBlankEmployee();
  state.employees.push(employee);
  state.selectedEmployeeId = employee.id;
  saveState();
  renderApp();
  document.querySelector("#fullName").focus();
}

function deleteSelectedEmployee() {
  const employee = getSelectedEmployee();
  if (!employee) {
    return;
  }

  const name = employee.fullName || "this employee";
  const confirmed = window.confirm(`Delete ${name}? This removes the record from this browser.`);
  if (!confirmed) {
    return;
  }

  state.employees = state.employees.filter((item) => item.id !== employee.id);
  state.selectedEmployeeId = state.employees[0]?.id || null;
  saveState();
  renderApp();
}

employeeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  updateSelectedEmployeeFromForm();
});

employeeForm.addEventListener("input", updateSelectedEmployeeFromForm);
employeeForm.addEventListener("change", updateSelectedEmployeeFromForm);
newEmployeeButton.addEventListener("click", addEmployee);
deleteEmployeeButton.addEventListener("click", deleteSelectedEmployee);
printButton.addEventListener("click", () => window.print());

if (!state.selectedEmployeeId && state.employees.length > 0) {
  state.selectedEmployeeId = state.employees[0].id;
}

renderApp();
