const clientHandlers = {
  "client-intake": require("../server/submit-handlers/client-intake"),
  "client-assessment": require("../server/submit-handlers/client-assessment"),
  "client-service-plan": require("../server/submit-handlers/client-service-plan"),
  "client-visit-note": require("../server/submit-handlers/client-visit-note"),
  "client-incident-report": require("../server/submit-handlers/client-incident-report"),
  "client-admission": require("../server/submit-handlers/client-admission"),
  "client-file-checklist": require("../server/submit-handlers/client-file-checklist")
};

const payloadKeys = {
  "client-intake": "intake",
  "client-assessment": "assessment",
  "client-service-plan": "servicePlan",
  "client-visit-note": "visitNote",
  "client-incident-report": "incidentReport",
  "client-admission": "admission",
  "client-file-checklist": "fileChecklist"
};

function normalizeFormType(value) {
  return String(value || "")
    .trim()
    .toLowerCase();
}

async function readJsonBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);

  const rawBody = Buffer.concat(chunks).toString("utf8");
  const contentType = req.headers["content-type"] || "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    return Object.fromEntries(new URLSearchParams(rawBody));
  }

  return JSON.parse(rawBody || "{}");
}

function buildHandlerBody(body, formType) {
  const payloadKey = payloadKeys[formType];

  if (!payloadKey) {
    return {
      ...body,
      formType
    };
  }

  return {
    ...body,
    formType,
    [payloadKey]: body.data || {}
  };
}

module.exports = async function handler(req, res) {
  console.info("CRS client submit route started", { method: req.method });

  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const body = await readJsonBody(req);
    const formType = normalizeFormType(body.formType);
    const selectedHandler = clientHandlers[formType];

    console.info("CRS client submit route formType received", {
      formType,
      hasData: Boolean(body.data && typeof body.data === "object"),
      bodyKeys: Object.keys(body || {})
    });

    if (!selectedHandler) {
      return res.status(400).json({
        error: `Unsupported or missing client formType: ${formType || "(missing)"}`
      });
    }

    req.body = buildHandlerBody(body, formType);

    console.info("CRS client submit route handler dispatch", {
      formType,
      payloadKey: payloadKeys[formType],
      handlerBodyKeys: Object.keys(req.body || {})
    });

    return selectedHandler(req, res);
  } catch (error) {
    console.error("CRS client submit route failed:", error);
    return res.status(500).json({
      error: error.message || "Client form submission failed."
    });
  }
};
