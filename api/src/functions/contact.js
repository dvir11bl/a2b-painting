const { app } = require("@azure/functions");

app.http("contact", {
  methods: ["POST"],
  authLevel: "anonymous",
  route: "contact",
  handler: async (request, context) => {
    try {
      const payload = await request.json();

      const logicAppUrl = process.env.LOGIC_APP_HTTP_TRIGGER_URL;
      if (!logicAppUrl) {
        return {
          status: 500,
          jsonBody: { ok: false, error: "Missing LOGIC_APP_HTTP_TRIGGER_URL" },
        };
      }

      const resp = await fetch(logicAppUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        context.log(`Logic App failed: ${resp.status} ${text}`);
        return { status: 502, jsonBody: { ok: false, error: "Logic App call failed" } };
      }

      return { status: 200, jsonBody: { ok: true } };
    } catch (err) {
      context.log("Bad request", err);
      return { status: 400, jsonBody: { ok: false, error: "Bad request" } };
    }
  },
});