const form = document.querySelector("#applicationForm");
const successMessage = document.querySelector("#successMessage");
const errorSummary = document.querySelector("#errorSummary");
const experienceDetailsGroup = document.querySelector("#experienceDetailsGroup");
const experienceDetails = document.querySelector("#experienceDetails");
const felonyExplanationGroup = document.querySelector("#felonyExplanationGroup");
const felonyExplanation = document.querySelector("#felonyExplanation");
const signatureDate = document.querySelector("#signatureDate");
const downloadPdfLink = document.querySelector("#downloadPdfLink");
const submitButton = form.querySelector(".submit-button");
const appConfig = window.CRSApplicationConfig || {};

// Set today's date as a convenience. The applicant can still change it.
signatureDate.value = new Date().toISOString().slice(0, 10);

// These labels make validation messages clear for nontechnical applicants.
const fieldLabels = {
  fullName: "Full Legal Name",
  phone: "Phone Number",
  email: "Email Address",
  address: "Home Address",
  position: "Position Applying For",
  availability: "Availability",
  authorizedToWork: "Legal authorization to work in the United States",
  reliableTransportation: "Reliable transportation",
  personalCareTasks: "Ability to assist with personal care tasks",
  caregivingExperience: "Caregiving experience",
  employer1Name: "Previous Employment 1 Employer Name",
  employer1JobTitle: "Previous Employment 1 Job Title",
  employer1Supervisor: "Previous Employment 1 Supervisor Name",
  employer1Phone: "Previous Employment 1 Employer Phone Number",
  employer1Address: "Previous Employment 1 Employer Address",
  employer1StartDate: "Previous Employment 1 Start Date",
  employer1EndDate: "Previous Employment 1 End Date",
  employer1Reason: "Previous Employment 1 Reason for Leaving",
  employer1MayContact: "Permission to contact Previous Employment 1",
  educationLevel: "Highest Level of Education Completed",
  reference1Name: "Reference 1 Full Name",
  reference1Relationship: "Reference 1 Relationship",
  reference1Phone: "Reference 1 Phone Number",
  reference1Email: "Reference 1 Email Address",
  felonyConviction: "Felony conviction question",
  felonyExplanation: "Felony explanation",
  emergencyName: "Emergency Contact Name",
  emergencyPhone: "Emergency Contact Phone Number",
  certifyTrueComplete: "Certification that application information is true and complete",
  falseInfoAcknowledgment: "Acknowledgment about false, misleading, or omitted information",
  authorizeVerification: "Authorization to verify application information",
  noGuaranteeAcknowledgment: "Acknowledgment that application submission does not guarantee employment",
  signature: "Signature",
  signatureDate: "Date"
};

const emailSections = [
  {
    title: "Personal Info",
    rows: [
      ["Full Legal Name", "fullName"],
      ["Phone Number", "phone"],
      ["Email Address", "email"],
      ["Home Address", "address"]
    ]
  },
  {
    title: "Position Information",
    rows: [
      ["Position Applying For", "position"],
      ["Availability", "availability"]
    ]
  },
  {
    title: "Qualifications",
    rows: [
      ["Legally Authorized to Work in the United States", "authorizedToWork"],
      ["Reliable Transportation", "reliableTransportation"],
      ["Able to Assist with Personal Care Tasks", "personalCareTasks"]
    ]
  },
  {
    title: "Criminal History",
    rows: [
      ["Felony Conviction", "felonyConviction"],
      ["Felony Explanation", "felonyExplanation"]
    ]
  },
  {
    title: "Experience",
    rows: [
      ["Caregiving Experience", "caregivingExperience"],
      ["Experience Description", "experienceDetails"]
    ]
  },
  {
    title: "Previous Employment 1",
    rows: emailEmployerRows("employer1")
  },
  {
    title: "Previous Employment 2",
    rows: emailEmployerRows("employer2")
  },
  {
    title: "Previous Employment 3",
    rows: emailEmployerRows("employer3")
  },
  {
    title: "Education",
    rows: [
      ["Highest Level Completed", "educationLevel"],
      ["School Name", "schoolName"],
      ["City/State", "schoolLocation"],
      ["Degree or Certification Earned", "degreeEarned"],
      ["Graduation Date or Last Date Attended", "graduationDate"]
    ]
  },
  {
    title: "References",
    rows: [
      ["Reference 1 Name", "reference1Name"],
      ["Reference 1 Relationship", "reference1Relationship"],
      ["Reference 1 Phone", "reference1Phone"],
      ["Reference 1 Email", "reference1Email"],
      ["Reference 2 Name", "reference2Name"],
      ["Reference 2 Relationship", "reference2Relationship"],
      ["Reference 2 Phone", "reference2Phone"],
      ["Reference 2 Email", "reference2Email"],
      ["Reference 3 Name", "reference3Name"],
      ["Reference 3 Relationship", "reference3Relationship"],
      ["Reference 3 Phone", "reference3Phone"],
      ["Reference 3 Email", "reference3Email"]
    ]
  },
  {
    title: "Emergency Contact",
    rows: [
      ["Emergency Contact Name", "emergencyName"],
      ["Emergency Contact Phone Number", "emergencyPhone"]
    ]
  },
  {
    title: "Acknowledgment and Authorization",
    rows: [
      ["Information is true and complete", "certifyTrueComplete"],
      ["False or omitted information acknowledgment", "falseInfoAcknowledgment"],
      ["Authorization to verify information", "authorizeVerification"],
      ["No guarantee of employment", "noGuaranteeAcknowledgment"]
    ]
  },
  {
    title: "Signature and Date",
    rows: [
      ["Applicant Signature", "signature"],
      ["Date", "signatureDate"]
    ]
  }
];

function emailEmployerRows(prefix) {
  return [
    ["Employer Name", `${prefix}Name`],
    ["Job Title", `${prefix}JobTitle`],
    ["Supervisor Name", `${prefix}Supervisor`],
    ["Employer Phone Number", `${prefix}Phone`],
    ["Employer Address", `${prefix}Address`],
    ["Start Date", `${prefix}StartDate`],
    ["End Date", `${prefix}EndDate`],
    ["Reason for Leaving", `${prefix}Reason`],
    ["May Contact Employer", `${prefix}MayContact`]
  ];
}

function getCaregivingExperienceAnswer() {
  return form.querySelector('input[name="caregivingExperience"]:checked')?.value || "";
}

function updateExperienceDetailsVisibility() {
  const hasExperience = getCaregivingExperienceAnswer() === "Yes";
  experienceDetailsGroup.hidden = !hasExperience;

  if (!hasExperience) {
    experienceDetails.value = "";
  }
}

function getFelonyConvictionAnswer() {
  return form.querySelector('input[name="felonyConviction"]:checked')?.value || "";
}

function updateFelonyExplanationVisibility() {
  const hasFelonyConviction = getFelonyConvictionAnswer() === "Yes";
  felonyExplanationGroup.hidden = !hasFelonyConviction;
  felonyExplanation.required = hasFelonyConviction;

  if (!hasFelonyConviction) {
    felonyExplanation.value = "";
    felonyExplanation.classList.remove("field-error");
    felonyExplanation.removeAttribute("aria-invalid");
  }
}

function clearErrors() {
  errorSummary.hidden = true;
  errorSummary.innerHTML = "";
  form.querySelectorAll(".field-error").forEach((field) => {
    field.classList.remove("field-error");
    field.removeAttribute("aria-invalid");
  });
}

function markInvalidField(field) {
  field.classList.add("field-error");
  field.setAttribute("aria-invalid", "true");
}

function validateForm() {
  clearErrors();

  const messages = [];
  const requiredFields = Array.from(form.querySelectorAll("[required]"));

  requiredFields.forEach((field) => {
    if (field.type === "radio") {
      const group = form.querySelectorAll(`input[name="${field.name}"]`);
      const checked = form.querySelector(`input[name="${field.name}"]:checked`);

      if (!checked && !messages.includes(`${fieldLabels[field.name]} is required.`)) {
        messages.push(`${fieldLabels[field.name]} is required.`);
        group.forEach(markInvalidField);
      }

      return;
    }

    if (field.type === "checkbox") {
      if (!field.checked) {
        messages.push(`${fieldLabels[field.name]} is required.`);
        markInvalidField(field);
      }

      return;
    }

    if (!field.value.trim()) {
      messages.push(`${fieldLabels[field.name]} is required.`);
      markInvalidField(field);
      return;
    }

    if (field.type === "email" && !field.validity.valid) {
      messages.push(`Please enter a valid email address for ${fieldLabels[field.name] || "this field"}.`);
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
}

function showSubmissionError(message) {
  showErrors([message]);
}

function collectSubmissionPreview() {
  const formData = new FormData(form);

  /*
    This object is not sent anywhere yet.
    It shows the shape a future private admin app or backend endpoint could receive.
  */
  const applicant = Object.fromEntries(formData.entries());

  form.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    applicant[checkbox.name] = checkbox.checked;
  });

  return {
    submittedAt: new Date().toISOString(),
    submittedAtDisplay: new Date().toLocaleString(),
    applicant,
    files: {
      resume: form.resume.files[0]?.name || ""
    }
  };
}

function createPdfFileName(applicantName) {
  const safeName = String(applicantName || "applicant")
    .trim()
    .replace(/[^a-z0-9]+/gi, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();

  return `CRS-employment-application-${safeName || "applicant"}.pdf`;
}

function preparePdfDownload(submission) {
  const pdfBlob = window.CRSPdfGenerator.createEmploymentApplicationPdf(submission.applicant);
  const pdfUrl = URL.createObjectURL(pdfBlob);

  downloadPdfLink.href = pdfUrl;
  downloadPdfLink.download = createPdfFileName(submission.applicant.fullName);
  downloadPdfLink.hidden = false;

  return pdfBlob;
}

function formatAnswer(value) {
  if (value === true) {
    return "Yes";
  }

  return String(value || "").trim() || "Not provided";
}

function buildEmailBody(submission) {
  const lines = [
    "Community Regenerative Solutions",
    "Employment Application Submission",
    "",
    `Submitted to: ${appConfig.submissionEmail || "Info@communityregenerativesolutions.com"}`,
    `Submitted at: ${submission.submittedAtDisplay}`,
    `Resume file selected: ${submission.files.resume || "Not provided"}`,
    ""
  ];

  emailSections.forEach((section) => {
    lines.push(section.title.toUpperCase());
    section.rows.forEach(([label, key]) => {
      lines.push(`${label}: ${formatAnswer(submission.applicant[key])}`);
    });
    lines.push("");
  });

  return lines.join("\n");
}

function isEmailEndpointConfigured() {
  return Boolean(appConfig.formspreeEndpoint && !appConfig.formspreeEndpoint.includes("REPLACE_WITH_FORM_ID"));
}

function buildEmailPayload(submission, pdfBlob) {
  const payload = new FormData();
  const subjectName = submission.applicant.fullName || "New Applicant";

  payload.append("_subject", `Employment Application - ${subjectName}`);
  payload.append("_replyto", submission.applicant.email || "");
  payload.append("send_to", appConfig.submissionEmail || "Info@communityregenerativesolutions.com");
  payload.append("submitted_at", submission.submittedAtDisplay);
  payload.append("applicant_name", submission.applicant.fullName || "");
  payload.append("applicant_email", submission.applicant.email || "");
  payload.append("message", buildEmailBody(submission));
  payload.append("completed_application_pdf", pdfBlob, createPdfFileName(submission.applicant.fullName));

  if (form.resume.files[0]) {
    payload.append("resume", form.resume.files[0]);
  }

  return payload;
}

async function sendApplicationEmail(submission, pdfBlob) {
  if (!isEmailEndpointConfigured()) {
    throw new Error("Email sending is not configured yet. Replace the Formspree endpoint in src/config.js before testing live submissions.");
  }

  const response = await fetch(appConfig.formspreeEndpoint, {
    method: "POST",
    headers: {
      Accept: "application/json"
    },
    body: buildEmailPayload(submission, pdfBlob)
  });

  if (!response.ok) {
    throw new Error("The email service did not accept the submission. Please check the Formspree setup and try again.");
  }
}

function setSubmitting(isSubmitting) {
  submitButton.disabled = isSubmitting;
  submitButton.textContent = isSubmitting ? "Sending Application..." : "Submit Application";
}

form.addEventListener("change", () => {
  updateExperienceDetailsVisibility();
  updateFelonyExplanationVisibility();
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const messages = validateForm();
  if (messages.length > 0) {
    showErrors(messages);
    return;
  }

  setSubmitting(true);

  try {
    const submission = collectSubmissionPreview();
    const pdfBlob = preparePdfDownload(submission);
    console.info("Employment application submission preview:", submission);

    await sendApplicationEmail(submission, pdfBlob);

    form.hidden = true;
    successMessage.hidden = false;
    successMessage.focus();
  } catch (error) {
    showSubmissionError(error.message);
  } finally {
    setSubmitting(false);
  }
});

updateExperienceDetailsVisibility();
updateFelonyExplanationVisibility();
