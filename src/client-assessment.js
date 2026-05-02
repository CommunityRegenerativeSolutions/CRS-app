const form = document.querySelector("#clientAssessmentForm");
const successMessage = document.querySelector("#successMessage");
const errorSummary = document.querySelector("#errorSummary");
const submissionStatus = document.querySelector("#submissionStatus");
const submitButton = form.querySelector(".submit-button");
const assessmentDate = document.querySelector("#assessmentDate");
const signatureDate = document.querySelector("#signatureDate");

const fieldLabels = {
  clientName: "Client Name",
  assessmentDate: "Date of Assessment",
  assessorName: "Assessor Name",
  serviceAddress: "Service Address",
  overallCondition: "Overall Physical Condition",
  mobilityStatus: "Mobility Status",
  transfersStatus: "Transfers",
  fallRisk: "Fall Risk",
  bathingAbility: "Bathing Ability",
  groomingStatus: "Grooming",
  skinConcerns: "Skin Condition Concerns",
  dressingAbility: "Dressing Ability",
  toiletingAbility: "Toileting Ability",
  continenceStatus: "Continence Status",
  mealPrepNeeds: "Meal Preparation Needs",
  feedingAbility: "Feeding Ability",
  appetiteConcerns: "Appetite Concerns",
  lightHousekeeping: "Light Housekeeping",
  orientationStatus: "Orientation",
  memoryStatus: "Memory",
  supervisionNeeds: "Supervision Needs",
  communicationAbility: "Communication Ability",
  emergencyPlanReviewed: "Emergency Plan Reviewed",
  medicationAssistance: "Medication Assistance",
  overallAssistance: "Overall Level of Assistance",
  certifierName: "Assessor Name",
  signature: "Signature",
  signatureDate: "Date"
};

const today = new Date().toISOString().slice(0, 10);
assessmentDate.value = today;
signatureDate.value = today;

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
    if (field.type === "radio") {
      const group = form.querySelectorAll(`input[name="${field.name}"]`);
      const checked = form.querySelector(`input[name="${field.name}"]:checked`);
      const message = `${fieldLabels[field.name] || "This option"} is required.`;

      if (!checked && !messages.includes(message)) {
        messages.push(message);
        group.forEach(markInvalidField);
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
  const assessment = Object.fromEntries(formData.entries());

  form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    assessment[checkbox.name] = checkbox.checked;
  });

  return {
    formType: "client-assessment",
    submittedAt: new Date().toISOString(),
    submittedAtDisplay: new Date().toLocaleString(),
    data: assessment
  };
}

function setSubmitting(isSubmitting) {
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? "Submitting..." : "Submit Initial Assessment";
}

function generateClientAssessmentPdf(submission) {
  console.info("CRS client assessment: Generating PDF locally.");
  if (!window.CRSClientPdfGenerator) {
    throw new Error("Local PDF generator is not available.");
  }
  window.CRSClientPdfGenerator.generateAndDownload(submission.formType, submission.data);
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  console.info("CRS client assessment: Submit started.");
  submissionStatus.hidden = true;

  const messages = validateForm();
  if (messages.length) {
    console.warn("CRS client assessment: Validation failed:", messages);
    showErrors(messages);
    return;
  }

  setSubmitting(true);
  showStatus("Generating assessment PDF...", "info");

  try {
    generateClientAssessmentPdf(collectSubmission());
    form.hidden = true;
    successMessage.hidden = false;
    successMessage.focus();
  } catch (error) {
    console.error("CRS client assessment: JavaScript submission error:", error);
    showErrors([error.message || "Submission failed. Please try again."]);
  } finally {
    setSubmitting(false);
  }
});
