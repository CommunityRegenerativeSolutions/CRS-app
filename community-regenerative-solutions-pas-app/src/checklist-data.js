/*
  Edit this file when checklist wording changes.
  Add new sections by copying the same shape:
  { id: "shortId", title: "Section Name", items: [{ id: "itemId", label: "Checklist wording" }] }
*/
window.CRS_CHECKLIST_SECTIONS = [
  {
    id: "hiringPacket",
    title: "Hiring Packet",
    items: [
      { id: "employmentApplicationReceived", label: "Employment application received" },
      { id: "jobDescriptionSigned", label: "Job description signed" },
      { id: "hipaaAcknowledgmentSigned", label: "Confidentiality / HIPAA acknowledgment signed" },
      { id: "policyAcknowledgmentSigned", label: "Policy acknowledgment signed" },
      { id: "w4Completed", label: "W-4 completed" },
      { id: "i9Completed", label: "I-9 completed" },
      { id: "emergencyContactFormCompleted", label: "Emergency contact form completed" }
    ]
  },
  {
    id: "clearanceChecks",
    title: "Clearance Checks",
    items: [
      { id: "criminalHistoryCheckCompleted", label: "Criminal history check completed" },
      { id: "emrCheckCompleted", label: "EMR check completed" },
      { id: "narCheckCompleted", label: "NAR check completed" }
    ]
  },
  {
    id: "orientation",
    title: "Orientation",
    items: [
      { id: "agencyPoliciesReviewed", label: "Agency policies reviewed" },
      { id: "aneReportingReviewed", label: "Abuse / neglect / exploitation reporting reviewed" },
      { id: "confidentialityReviewed", label: "Confidentiality reviewed" },
      { id: "infectionControlReviewed", label: "Infection control reviewed" },
      { id: "emergencyProceduresReviewed", label: "Emergency procedures reviewed" },
      { id: "documentationRulesReviewed", label: "Documentation rules reviewed" },
      { id: "callOffProcedureReviewed", label: "Call-off procedure reviewed" }
    ]
  },
  {
    id: "clientReadiness",
    title: "Client Readiness",
    items: [
      { id: "servicePlanReviewed", label: "Service plan reviewed" },
      { id: "taskListReviewed", label: "Task list reviewed" },
      { id: "emergencyContactsProvided", label: "Emergency contacts provided" },
      { id: "supervisorContactInfoProvided", label: "Supervisor contact info provided" }
    ]
  },
  {
    id: "timesheetSetup",
    title: "Timesheet Setup",
    items: [
      { id: "shownHowToCompleteTimesheet", label: "Employee shown how to complete timesheet" },
      { id: "shownSignatureProcess", label: "Employee shown signature process" },
      { id: "understandsSubmissionProcess", label: "Employee understands submission process" }
    ]
  }
];
