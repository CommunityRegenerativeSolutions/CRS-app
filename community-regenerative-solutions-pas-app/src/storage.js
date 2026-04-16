/*
  This small storage helper keeps employee records in the browser.
  For a shared office database later, this is the file to replace.
*/
const CRS_STORAGE_KEY = "crsPasEmployeeRecords";

window.CRSStorage = {
  loadEmployees() {
    const saved = localStorage.getItem(CRS_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  },

  saveEmployees(employees) {
    localStorage.setItem(CRS_STORAGE_KEY, JSON.stringify(employees));
  }
};
