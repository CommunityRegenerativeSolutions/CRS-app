const form = document.querySelector("#clientAdmissionForm");
const successMessage = document.querySelector("#successMessage");
const errorSummary = document.querySelector("#errorSummary");
const submissionStatus = document.querySelector("#submissionStatus");
const submitButton = form.querySelector(".submit-button");
const signatureDate = document.querySelector("#signatureDate");

const fieldLabels = {
  acknowledgmentConsent: "Acknowledgment and consent",
  clientName: "Client / Responsible Party Name",
  signature: "Signature",
  signatureDate: "Date"
};

signatureDate.value = new Date().toISOString().slice(0, 10);

function clearErrors() {
  errorSummary.hidden = true;
  errorSummary.innerHTML = "";
  form.querySelectorAll(".field-error").forEach((field) => {
    field.classList.remove("field-error");
    field.removeAttribute("aria-invalid");
  });
}

function showStatus(message, type = "info") {
  submissionStatus.textContent = message;
  submissionStatus.className = `submission-status ${type}`;
  submissionStatus.hidden = false;
}

function markInvalidField(field) {
  field.classList.add("field-error");
  field.setAttribute("aria-invalid", "true");
}

function validateForm() {
  clearErrors();
  const messages = [];

  Array.from(form.querySelectorAll("[required]")).forEach((field) => {
    if (field.type === "checkbox") {
      if (!field.checked) {
        messages.push(`${fieldLabels[field.name] || "This checkbox"} is required.`);
        markInvalidField(field);
      }
      return;
    }

    if (!field.value.trim()) {
      messages.push(`${fieldLabels[field.name] || "This field"} is required.`);
      markInvalidField(field);
    }
  });

  return messages;
}

function showErrors(messages) {
  errorSummary.innerHTML = `
    <strong>Please fix the following before submitting:</strong>
    <ul>${messages.map((message) => `<li>${message}</li>`).join("")}</ul>
  `;
  errorSummary.hidden = false;
  errorSummary.focus();
  showStatus("Please complete the required fields before submitting.", "error");
}

function collectSubmission() {
  const formData = new FormData(form);
  const admission = Object.fromEntries(formData.entries());

  form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    admission[checkbox.name] = checkbox.checked;
  });

  return {
    formType: "client-admission",
    submittedAt: new Date().toISOString(),
    submittedAtDisplay: new Date().toLocaleString(),
    data: admission
  };
}

function setSubmitting(isSubmitting) {
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? "Submitting..." : "Submit Admission Packet";
}

function generateClientAdmissionPdf(submission) {
  console.info("CRS client admission: Generating PDF locally.");
  if (!window.CRSClientPdfGenerator) {
    throw new Error("Local PDF generator is not available.");
  }
  window.CRSClientPdfGenerator.generateAndDownload(submission.formType, submission.data);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  console.info("CRS client admission: Submit started.");
  submissionStatus.hidden = true;

  const messages = validateForm();
  if (messages.length) {
    console.warn("CRS client admission: Validation failed:", messages);
    showErrors(messages);
    return;
  }

  setSubmitting(true);
  showStatus("Generating admission PDF...", "info");

  try {
    generateClientAdmissionPdf(collectSubmission());
    form.hidden = true;
    successMessage.hidden = false;
    successMessage.focus();
  } catch (error) {
    console.error("CRS client admission: JavaScript submission error:", error);
    showErrors([error.message || "Submission failed. Please try again."]);
  } finally {
    setSubmitting(false);
  }
});
