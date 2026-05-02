/*
  Browser-side PDF generator for CRS client forms.
  This lets client forms create and download printable PDFs locally
  without requiring the Vercel API routes to run.
*/

(function () {
  const PAGE = { width: 612, height: 792, margin: 42 };
  const FONT = { body: "F1", bold: "F2" };

  const SERVICE_PLAN_SECTIONS = [
    ["A", "Personal Hygiene / Bathing", ["Gather bathing supplies", "Assist with entering/leaving tub or shower", "Standby assistance for safety", "Sponge bath", "Bed bath", "Wash hair", "Dry hair", "Oral hygiene", "Grooming", "Shaving", "Nail care", "Apply lotion / skin care", "Dressing after bathing", "Other"]],
    ["B", "Dressing / Personal Care", ["Select clothing", "Upper body dressing", "Lower body dressing", "Undressing", "Apply shoes / socks", "Assist with braces / supports", "Personal appearance / grooming", "Other"]],
    ["C", "Toileting / Continence", ["Toilet transfer assistance", "Standby assistance for toileting", "Assist with clothing during toileting", "Incontinence brief change", "Perineal care / hygiene", "Assist with commode use", "Assist with urinal use", "Empty commode / supplies cleanup", "Catheter bag positioning / non-skilled observation only", "Handwashing after toileting", "Other"]],
    ["D", "Mobility / Transfers", ["Bed mobility", "Transfer bed to chair", "Transfer chair to toilet", "Repositioning", "Walking assistance", "Wheelchair assistance", "Standby for fall prevention", "Other"]],
    ["E", "Nutrition / Meal Support", ["Meal planning", "Meal preparation", "Feeding assistance", "Set up meal tray", "Encourage fluids", "Clean eating area", "Observe appetite / intake", "Other"]],
    ["F", "Housekeeping / Home Support", ["Laundry", "Dishes", "Trash removal", "Clean bathroom used by client", "Clean bedroom / client area", "Change linens", "Organize supplies", "Other"]],
    ["G", "Supervision / Safety Monitoring", ["Cueing / reminders", "Redirection", "Monitoring for confusion", "Supervision for safety", "Observe changes in condition", "Report concerns to supervisor", "Other"]]
  ];

  function normalize(value) {
    if (value === true) return "Yes";
    if (value === false) return "No";
    return String(value || "")
      .normalize("NFKD")
      .replace(/[^\x20-\x7E]/g, "")
      .trim();
  }

  function escapePdfText(value) {
    return normalize(value)
      .replace(/\\/g, "\\\\")
      .replace(/\(/g, "\\(")
      .replace(/\)/g, "\\)")
      .replace(/\r?\n/g, " ");
  }

  function wrapText(value, maxChars) {
    const words = normalize(value).split(/\s+/).filter(Boolean);
    const lines = [];
    let line = "";

    words.forEach((word) => {
      const next = line ? `${line} ${word}` : word;
      if (next.length > maxChars && line) {
        lines.push(line);
        line = word;
        return;
      }
      line = next;
    });

    if (line) lines.push(line);
    return lines.length ? lines : [""];
  }

  function safeName(value) {
    return normalize(value)
      .replace(/[^a-z0-9]+/gi, "_")
      .replace(/^_|_$/g, "") || "Client";
  }

  function pdfDate(value) {
    return normalize(value).replace(/[^0-9-]+/g, "") || new Date().toISOString().slice(0, 10);
  }

  function listChecked(data, fields) {
    return fields
      .filter(([_, key]) => data[key] === true || normalize(data[key]) === "on")
      .map(([label]) => label);
  }

  function createPdfContext(titleText) {
    const pages = [];
    let stream = [];
    let y = 732;

    function push(command) { stream.push(command); }
    function addPage() { pages.push(stream); stream = []; y = 732; }
    function ensure(spaceNeeded) { if (y - spaceNeeded < PAGE.margin) addPage(); }

    function text(textValue, x, yPos, size = 9, font = FONT.body, color = 0) {
      push(`${color} g BT /${font} ${size} Tf ${x} ${yPos} Td (${escapePdfText(textValue)}) Tj ET`);
    }

    function line(x1, y1, x2, y2, width = 0.7) {
      push(`0 G ${width} w ${x1} ${y1} m ${x2} ${y2} l S`);
    }

    function rect(x, yPos, width, height) {
      push(`0 G 0.7 w ${x} ${yPos} ${width} ${height} re S`);
    }

    function fillRect(x, yPos, width, height) {
      push(`0 g ${x} ${yPos} ${width} ${height} re f`);
    }

    function title() {
      text("Community Regenerative Solutions", 132, 748, 18, FONT.bold);
      text(titleText, 150, 724, 15, FONT.bold);
      line(PAGE.margin, 710, PAGE.width - PAGE.margin, 710, 1);
      y = 690;
    }

    function section(titleValue) {
      ensure(32);
      fillRect(PAGE.margin, y - 4, PAGE.width - PAGE.margin * 2, 18);
      text(titleValue.toUpperCase(), PAGE.margin + 7, y + 1, 10, FONT.bold, 1);
      y -= 27;
    }

    function paragraph(value) {
      wrapText(value, 96).forEach((lineText) => {
        ensure(12);
        text(lineText, PAGE.margin, y, 9);
        y -= 11;
      });
      y -= 6;
    }

    function fieldRow(fields, height = 36) {
      ensure(height + 4);
      const gap = 12;
      const width = (PAGE.width - PAGE.margin * 2 - gap * (fields.length - 1)) / fields.length;
      fields.forEach(([label, fieldValue], index) => {
        const x = PAGE.margin + index * (width + gap);
        const lineY = y - 18;
        text(label, x, y, 7, FONT.bold);
        line(x, lineY, x + width, lineY);
        wrapText(fieldValue, Math.max(12, Math.floor(width / 5.2))).slice(0, 2).forEach((part, partIndex) => {
          text(part, x + 2, lineY + 4 - partIndex * 10, 9);
        });
      });
      y -= height;
    }

    function fullField(label, fieldValue, minHeight = 40) {
      if (!normalize(fieldValue)) return;
      const lines = wrapText(fieldValue, 96);
      const height = Math.max(minHeight, 20 + lines.length * 10);
      ensure(height + 6);
      rect(PAGE.margin, y - height, PAGE.width - PAGE.margin * 2, height);
      text(label, PAGE.margin + 5, y - 11, 8, FONT.bold);
      lines.forEach((lineText, index) => {
        text(lineText, PAGE.margin + 5, y - 24 - index * 10, 8);
      });
      y -= height + 8;
    }

    function checklist(items) {
      if (!items.length) return;
      items.forEach((item) => {
        ensure(14);
        text(`[X] ${item}`, PAGE.margin + 2, y, 9);
        y -= 13;
      });
      y -= 4;
    }

    function table(headers, rows, columnWidths) {
      if (!rows.length) return;
      const rowHeight = 24;
      const totalWidth = columnWidths.reduce((sum, width) => sum + width, 0);
      const startX = PAGE.margin;
      ensure(rowHeight * (rows.length + 1) + 8);

      rect(startX, y - rowHeight, totalWidth, rowHeight);
      let x = startX;
      headers.forEach((header, index) => {
        if (index > 0) line(x, y, x, y - rowHeight);
        text(header, x + 4, y - 15, 8, FONT.bold);
        x += columnWidths[index];
      });
      y -= rowHeight;

      rows.forEach((row) => {
        ensure(rowHeight + 4);
        rect(startX, y - rowHeight, totalWidth, rowHeight);
        x = startX;
        row.forEach((cell, index) => {
          if (index > 0) line(x, y, x, y - rowHeight);
          wrapText(cell, Math.floor((columnWidths[index] - 8) / 5.2)).slice(0, 2).forEach((part, lineIndex) => {
            text(part, x + 4, y - 10 - lineIndex * 9, 8);
          });
          x += columnWidths[index];
        });
        y -= rowHeight;
      });
      y -= 10;
    }

    function finish() { pages.push(stream); return pages; }

    return { title, section, paragraph, fieldRow, fullField, checklist, table, finish };
  }

  function buildPdfBuffer(pageStreams) {
    const objects = [];
    const addObject = (body) => { objects.push(body); return objects.length; };
    const catalogId = addObject("<< /Type /Catalog /Pages 2 0 R >>");
    const pagesId = addObject("");
    const fontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");
    const boldFontId = addObject("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>");
    const pageIds = [];

    pageStreams.forEach((stream) => {
      const content = stream.join("\n");
      const contentId = addObject(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
      const pageId = addObject(`<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontId} 0 R /F2 ${boldFontId} 0 R >> >> /Contents ${contentId} 0 R >>`);
      pageIds.push(pageId);
    });

    objects[pagesId - 1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;

    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((body, index) => {
      offsets.push(pdf.length);
      pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
    });

    const xrefOffset = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach((offset) => {
      pdf += `${String(offset).padStart(10, "0")} 00000 n \n`;
    });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${objects.length ? `${catalogId} 0 R` : "1 0 R"} >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return new Blob([pdf], { type: "application/pdf" });
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function fieldName(code, index, suffix) {
    return `section${code}Row${index}${suffix}`;
  }

  function generateClientIntake(data) {
    const pdf = createPdfContext("Client Intake Form (CRS-CL01)");
    pdf.title();
    pdf.section("Client Information");
    pdf.fieldRow([["Full Legal Name", data.fullName], ["Date of Birth", data.dateOfBirth]]);
    pdf.fieldRow([["Gender", data.gender], ["Phone Number", data.phone], ["Email Address", data.email]]);
    pdf.fullField("Service Address", data.serviceAddress, 48);
    pdf.fullField("Mailing Address", data.mailingAddress, 48);
    pdf.section("Responsible Party / Guardian");
    pdf.fieldRow([["Full Name", data.responsiblePartyName], ["Relationship", data.responsiblePartyRelationship]]);
    pdf.fieldRow([["Phone Number", data.responsiblePartyPhone], ["Email", data.responsiblePartyEmail], ["Authorized", data.responsiblePartyAuthorized]]);
    pdf.section("Emergency Contact");
    pdf.fieldRow([["Full Name", data.emergencyName], ["Relationship", data.emergencyRelationship], ["Phone", data.emergencyPhone]]);
    pdf.section("Requested Services");
    pdf.checklist(listChecked(data, [["Bathing / Personal Hygiene", "serviceBathingHygiene"], ["Dressing Assistance", "serviceDressing"], ["Toileting / Incontinence Care", "serviceToileting"], ["Mobility / Transfers", "serviceMobilityTransfers"], ["Meal Preparation", "serviceMealPreparation"], ["Feeding Assistance", "serviceFeeding"], ["Light Housekeeping", "serviceHousekeeping"], ["Companionship / Supervision", "serviceCompanionship"], ["Errands / Shopping", "serviceErrands"]]));
    pdf.fieldRow([["Preferred Schedule Days", data.preferredScheduleDays], ["Preferred Schedule Hours", data.preferredScheduleHours]]);
    pdf.section("Functional Status");
    pdf.table([["Area", "Status"]][0], [["Mobility", data.mobilityStatus], ["Transfers", data.transferStatus], ["Toileting", data.toiletingStatus], ["Bathing", data.bathingStatus]], [180, 350]);
    pdf.section("Health & Safety");
    pdf.fullField("Primary Conditions / Diagnoses", data.primaryConditions, 48);
    pdf.fullField("Allergies", data.allergies, 40);
    pdf.fullField("Medications (awareness only)", data.medications, 48);
    pdf.checklist(listChecked(data, [["Fall Risk", "safetyFallRisk"], ["Pets", "safetyPets"], ["Smoking in home", "safetySmoking"], ["Clutter / Obstructions", "safetyClutter"], ["Other", "safetyOther"]]));
    pdf.fullField("Other safety concern", data.otherSafetyConcern, 40);
    pdf.fullField("Emergency instructions or special notes", data.emergencyInstructions, 48);
    pdf.section("Client Preferences");
    pdf.fullField("Preferred language", data.preferredLanguage, 32);
    pdf.fullField("Care preferences / routines", data.carePreferences, 48);
    pdf.fullField("Anything important for staff to know", data.staffNotes, 48);
    pdf.section("Consent & Signature");
    pdf.table(["Consent", "Status"], [["I consent to receive services from CRS", data.serviceConsent ? "Yes" : "No"]], [430, 100]);
    pdf.fieldRow([["Client / Responsible Party Name", data.signerName], ["Signature", data.signature]]);
    pdf.fieldRow([["Date", data.signatureDate]]);
    return { blob: buildPdfBuffer(pdf.finish()), filename: `${safeName(data.fullName)}_Client_Intake.pdf` };
  }

  function generateClientAssessment(data) {
    const pdf = createPdfContext("Initial Assessment (CRS-CL02)");
    pdf.title();
    pdf.section("Client Identification");
    pdf.fieldRow([["Client Name", data.clientName], ["Date of Assessment", data.assessmentDate], ["Assessor Name", data.assessorName]]);
    pdf.fullField("Service Address", data.serviceAddress, 40);
    pdf.section("General Condition");
    pdf.fieldRow([["Overall Physical Condition", data.overallCondition]]);
    pdf.fullField("Primary Conditions / Diagnoses", data.primaryConditions, 42);
    pdf.fullField("General Observations", data.generalObservations, 48);
    pdf.section("Mobility & Transfers");
    pdf.fieldRow([["Mobility Status", data.mobilityStatus], ["Transfers", data.transfersStatus], ["Fall Risk", data.fallRisk]]);
    pdf.fullField("Notes", data.mobilityNotes, 40);
    pdf.section("Bathing & Personal Hygiene");
    pdf.fieldRow([["Bathing Ability", data.bathingAbility], ["Grooming", data.groomingStatus], ["Skin Concerns", data.skinConcerns]]);
    pdf.fullField("Notes", data.bathingNotes, 40);
    pdf.section("Dressing");
    pdf.fieldRow([["Dressing Ability", data.dressingAbility]]);
    pdf.fullField("Clothing Needs / Limitations", data.clothingNeeds, 40);
    pdf.section("Toileting & Continence");
    pdf.fieldRow([["Toileting Ability", data.toiletingAbility], ["Continence Status", data.continenceStatus]]);
    pdf.checklist(listChecked(data, [["None", "suppliesNone"], ["Briefs", "suppliesBriefs"], ["Pads", "suppliesPads"], ["Catheter (monitor only)", "suppliesCatheter"]]));
    pdf.fullField("Notes", data.toiletingNotes, 40);
    pdf.section("Nutrition & Meal Preparation");
    pdf.fieldRow([["Meal Preparation Needs", data.mealPrepNeeds], ["Feeding Ability", data.feedingAbility], ["Appetite Concerns", data.appetiteConcerns]]);
    pdf.fullField("Dietary Restrictions", data.dietaryRestrictions, 40);
    pdf.fullField("Notes", data.nutritionNotes, 40);
    pdf.section("Housekeeping Needs");
    pdf.fieldRow([["Light Housekeeping", data.lightHousekeeping]]);
    pdf.checklist(listChecked(data, [["Laundry", "housekeepingLaundry"], ["Dishes", "housekeepingDishes"], ["Trash Removal", "housekeepingTrash"], ["Cleaning Client Areas", "housekeepingCleaning"]]));
    pdf.fullField("Notes", data.housekeepingNotes, 40);
    pdf.section("Cognitive & Behavioral Status");
    pdf.fieldRow([["Orientation", data.orientationStatus], ["Memory", data.memoryStatus], ["Supervision Needs", data.supervisionNeeds]]);
    pdf.checklist(listChecked(data, [["None", "behaviorNone"], ["Agitation", "behaviorAgitation"], ["Wandering", "behaviorWandering"], ["Resistance to Care", "behaviorResistance"]]));
    pdf.fullField("Notes", data.cognitiveNotes, 40);
    pdf.section("Communication");
    pdf.fieldRow([["Communication Ability", data.communicationAbility], ["Preferred Language", data.preferredLanguage]]);
    pdf.checklist(listChecked(data, [["None", "hearingVisionNone"], ["Hearing Impairment", "hearingImpairment"], ["Vision Impairment", "visionImpairment"]]));
    pdf.fullField("Notes", data.communicationNotes, 40);
    pdf.section("Safety & Environmental Risks");
    pdf.checklist(listChecked(data, [["Fall Hazards", "safetyFallHazards"], ["Clutter", "safetyClutter"], ["Pets", "safetyPets"], ["Smoking in Home", "safetySmoking"], ["Unsafe Equipment", "safetyUnsafeEquipment"], ["Poor Lighting", "safetyPoorLighting"]]));
    pdf.fieldRow([["Emergency Plan Reviewed", data.emergencyPlanReviewed]]);
    pdf.fullField("Special Safety Instructions", data.specialSafetyInstructions, 46);
    pdf.section("Medication Awareness");
    pdf.fieldRow([["Medication Assistance", data.medicationAssistance]]);
    pdf.fullField("Notes", data.medicationNotes, 40);
    pdf.section("Summary");
    pdf.fieldRow([["Overall Level of Assistance", data.overallAssistance]]);
    pdf.fullField("Key Care Needs Identified", data.keyCareNeeds, 48);
    pdf.checklist(listChecked(data, [["Personal Care Assistance", "recommendedPersonalCare"], ["Mobility / Transfers", "recommendedMobility"], ["Toileting Support", "recommendedToileting"], ["Meal Preparation", "recommendedMeals"], ["Housekeeping", "recommendedHousekeeping"], ["Supervision / Safety Monitoring", "recommendedSupervision"]]));
    pdf.section("Assessor Certification");
    pdf.fieldRow([["Assessor Name", data.certifierName], ["Signature", data.signature]]);
    pdf.fieldRow([["Date", data.signatureDate]]);
    return { blob: buildPdfBuffer(pdf.finish()), filename: `${safeName(data.clientName)}_Client_Assessment.pdf` };
  }

  function generateClientServicePlan(data) {
    const pdf = createPdfContext("Client Service Plan (CRS-CL03)");
    pdf.title();
    pdf.section("Header Section");
    pdf.fieldRow([["Client Name", data.clientName], ["Date of Birth", data.dateOfBirth], ["Effective Date", data.effectiveDate]]);
    pdf.fieldRow([["Review Date", data.reviewDate], ["Prepared By / Assessor", data.preparedBy], ["Phone", data.phoneNumber]]);
    pdf.fullField("Service Address", data.serviceAddress, 40);
    pdf.fieldRow([["Responsible Party / Guardian", data.responsibleParty], ["Emergency Contact", data.emergencyContact], ["Emergency Phone", data.emergencyPhone]]);
    pdf.section("Plan Summary");
    pdf.fieldRow([["Overall Assistance Level", data.assistanceLevel]]);
    pdf.checklist(listChecked(data, [["Fall Risk", "riskFall"], ["Cognitive Impairment", "riskCognitive"], ["Transfer Assistance Needed", "riskTransfer"], ["Supervision Needed", "riskSupervision"], ["Other", "riskOther"]]));
    pdf.fullField("Notes / Special Concerns", data.summaryNotes, 44);
    SERVICE_PLAN_SECTIONS.forEach(([code, title, rows]) => {
      const renderedRows = rows.map((activity, index) => ([
        activity,
        data[fieldName(code, index, "Frequency")],
        data[fieldName(code, index, "Assistance")],
        data[fieldName(code, index, "Notes")]
      ])).filter((row) => row.slice(1).some((value) => normalize(value)));
      if (!renderedRows.length && !normalize(data[`section${code}Summary`])) return;
      pdf.section(`${code}. ${title}`);
      if (renderedRows.length) {
        pdf.table(["Activity", "Frequency", "Level of Assistance", "Notes / Instructions"], renderedRows, [190, 78, 108, 172]);
      }
      pdf.fullField("Section summary / attendant instructions", data[`section${code}Summary`], 38);
    });
    pdf.section("Special Instructions");
    pdf.fullField("Transfer precautions", data.transferPrecautions, 38);
    pdf.fullField("Fall prevention instructions", data.fallPrevention, 38);
    pdf.fullField("Cognitive / behavior notes", data.cognitiveNotes, 38);
    pdf.fullField("Home environment concerns", data.homeConcerns, 38);
    pdf.fullField("Preferred routines / care preferences", data.preferredRoutines, 38);
    pdf.fullField("Tasks declined or not authorized", data.declinedTasks, 38);
    pdf.section("Approval / Signature");
    pdf.fieldRow([["Client / Responsible Party Name", data.clientSignerName], ["Signature", data.clientSignature], ["Date", data.clientSignatureDate]]);
    pdf.fieldRow([["Agency Representative Name", data.agencyRepName], ["Agency Representative Signature", data.agencyRepSignature], ["Date", data.agencyRepDate]]);
    return { blob: buildPdfBuffer(pdf.finish()), filename: `${safeName(data.clientName)}_Client_Service_Plan.pdf` };
  }

  function generateVisitNote(data) {
    const pdf = createPdfContext("Visit Note / Care Log (CRS-CL04)");
    pdf.title();
    pdf.section("Visit Information");
    pdf.table(["Client", "Date", "Attendant", "Arrival / Departure"], [[data.clientName, data.dateOfService, data.attendantName, `${normalize(data.arrivalTime)} / ${normalize(data.departureTime)}`]], [135, 85, 155, 155]);
    pdf.section("Services Provided");
    pdf.checklist(listChecked(data, [["Bathing / Hygiene Assistance", "serviceBathingHygiene"], ["Grooming", "serviceGrooming"], ["Dressing Assistance", "serviceDressing"], ["Toileting / Incontinence Care", "serviceToileting"], ["Mobility / Transfers", "serviceMobilityTransfers"], ["Meal Preparation", "serviceMealPreparation"], ["Feeding Assistance", "serviceFeeding"], ["Light Housekeeping", "serviceHousekeeping"], ["Laundry", "serviceLaundry"], ["Safety Supervision", "serviceSafetySupervision"], ["Companionship", "serviceCompanionship"], ["Errands / Shopping", "serviceErrands"], ["Other", "serviceOther"]]));
    pdf.fullField("Other services provided", data.otherServices, 34);
    pdf.section("Client Condition / Observations");
    pdf.fieldRow([["Condition Today", data.clientCondition]]);
    pdf.fullField("Notes / observations", data.observationNotes, 48);
    pdf.section("Incidents / Concerns");
    pdf.fieldRow([["Any incident, injury, refusal, or unusual event?", data.incidentOccurred]]);
    pdf.fullField("Details", data.incidentDetails, 42);
    pdf.section("Task Completion");
    pdf.fieldRow([["Services completed as planned?", data.servicesCompleted]]);
    pdf.fullField("Explanation", data.incompleteExplanation, 42);
    pdf.section("Signatures");
    pdf.fieldRow([["Attendant Signature", data.attendantSignature], ["Client / Responsible Party Signature", data.clientSignature]]);
    pdf.fieldRow([["Date Signed", data.signedDate]]);
    return { blob: buildPdfBuffer(pdf.finish()), filename: `${safeName(data.clientName)}_Visit_Note_${pdfDate(data.dateOfService)}.pdf` };
  }

  function generateIncidentReport(data) {
    const pdf = createPdfContext("Incident Report (CRS-CL05)");
    pdf.title();
    pdf.section("Basic Information");
    pdf.table(["Client", "Date", "Time", "Attendant", "Location"], [[data.clientName, data.incidentDate, data.incidentTime, data.attendantName, data.incidentLocation]], [118, 78, 62, 128, 144]);
    pdf.section("Type of Incident");
    pdf.checklist(listChecked(data, [["Fall", "typeFall"], ["Injury", "typeInjury"], ["Refusal of Care", "typeRefusal"], ["Change in Condition", "typeConditionChange"], ["Behavioral Issue", "typeBehavioral"], ["Safety Hazard", "typeSafetyHazard"], ["Other", "typeOther"]]));
    pdf.fullField("Other", data.otherIncidentType, 32);
    pdf.section("Description of Incident");
    pdf.fullField("Description", data.incidentDescription, 54);
    pdf.section("Action Taken");
    pdf.checklist(listChecked(data, [["Assisted client", "actionAssisted"], ["Provided basic first aid", "actionFirstAid"], ["Contacted supervisor", "actionSupervisor"], ["Contacted responsible party", "actionResponsibleParty"], ["Emergency services called (911)", "actionEmergencyServices"], ["No action required", "actionNone"], ["Other", "actionOther"]]));
    pdf.fullField("Other actions", data.otherActions, 32);
    pdf.section("Client Condition After Incident");
    pdf.fieldRow([["Condition", data.clientConditionAfter]]);
    pdf.fullField("Notes", data.conditionNotes, 38);
    pdf.section("Notifications");
    pdf.checklist(listChecked(data, [["Supervisor notified", "notifySupervisor"], ["Responsible party notified", "notifyResponsibleParty"], ["Physician notified", "notifyPhysician"]]));
    pdf.fieldRow([["Time Notified", data.timeNotified], ["Person Notified", data.personNotified]]);
    pdf.section("Additional Notes");
    pdf.fullField("Additional Notes", data.additionalNotes, 40);
    pdf.section("Signature");
    pdf.fieldRow([["Attendant Name", data.signatureAttendantName], ["Signature", data.attendantSignature], ["Date", data.signatureDate]]);
    pdf.fieldRow([["Supervisor Review Name", data.supervisorReviewName], ["Supervisor Signature", data.supervisorSignature], ["Review Date", data.reviewDate]]);
    return { blob: buildPdfBuffer(pdf.finish()), filename: `${safeName(data.clientName)}_Incident_Report_${pdfDate(data.incidentDate)}.pdf` };
  }

  function generateClientAdmission(data) {
    const pdf = createPdfContext("Client Admission Packet (CRS-CL06)");
    pdf.title();
    [
      ["1. Introduction", "Community Regenerative Solutions provides private-pay personal assistance services designed to support safety, independence, and daily functioning in the home. This admission packet explains the basic terms of service and the expectations for clients, responsible parties, and CRS staff."],
      ["2. Service Agreement", "CRS provides non-skilled personal assistance services only. Services may include help with personal care, mobility support, meal preparation, light housekeeping, supervision, and other approved daily living tasks. CRS staff do not provide skilled nursing services, medical treatment, medical decision-making, or medication administration."],
      ["3. Scheduling & Attendance", "CRS will make reasonable efforts to provide services according to the agreed schedule. Clients or responsible parties should notify CRS as soon as possible if a visit needs to be canceled, changed, or rescheduled."],
      ["4. Billing & Payment", "Private-pay services are billed according to the rate and payment arrangement agreed upon before services begin. Payment is expected according to the agreed billing schedule."],
      ["5. Client Rights", "Clients have the right to be treated with dignity, respect, privacy, and consideration and to receive care without discrimination, abuse, neglect, or exploitation."],
      ["6. Client Responsibilities", "Clients and responsible parties are expected to provide accurate information, maintain a reasonably safe environment for services, communicate changes in condition or schedule, and treat CRS staff respectfully."],
      ["7. Privacy & Confidentiality", "CRS respects client privacy and protects personal information. Client information is shared only as needed for service coordination, billing, compliance, safety, or as otherwise authorized by the client or required by law."],
      ["8. Complaint Process", "Clients and responsible parties may report complaints, concerns, or service issues to CRS at any time. CRS will review concerns professionally and make reasonable efforts to resolve issues promptly."],
      ["9. Release of Information", "If the client wants CRS to communicate with specific family members, responsible parties, or other contacts about services, those names appear below if provided."],
      ["10. Acknowledgment & Consent", "By signing below, the client or responsible party acknowledges that they have reviewed this admission packet, understand that CRS provides non-skilled personal assistance services only, and consent to receive services according to the agreed service plan and schedule."]
    ].forEach(([title, paragraph]) => {
      pdf.section(title);
      pdf.paragraph(paragraph);
      if (title === "9. Release of Information") {
        const releases = [data.releaseNameOne, data.releaseNameTwo, data.releaseNameThree].filter((item) => normalize(item));
        if (releases.length) {
          pdf.table(["#", "Authorized Person / Organization"], releases.map((name, index) => [`${index + 1}`, name]), [40, 490]);
        }
      }
      if (title === "10. Acknowledgment & Consent") {
        pdf.fieldRow([["Consent Status", data.acknowledgmentConsent ? "Yes" : "No"]]);
      }
    });
    pdf.section("11. Signature");
    pdf.fieldRow([["Client / Responsible Party Name", data.clientName], ["Signature", data.signature], ["Date", data.signatureDate]]);
    return { blob: buildPdfBuffer(pdf.finish()), filename: `${safeName(data.clientName)}_Client_Admission.pdf` };
  }

  const generators = {
    "client-intake": generateClientIntake,
    "client-assessment": generateClientAssessment,
    "client-service-plan": generateClientServicePlan,
    "client-visit-note": generateVisitNote,
    "client-incident-report": generateIncidentReport,
    "client-admission": generateClientAdmission
  };

  window.CRSClientPdfGenerator = {
    generateAndDownload(formType, data) {
      const generator = generators[formType];
      if (!generator) {
        throw new Error(`No local PDF generator is available for ${formType}.`);
      }
      const output = generator(data || {});
      downloadBlob(output.blob, output.filename);
      return output;
    }
  };
})();
