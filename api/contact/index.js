module.exports = async function (context, req) {
  try {
    const logicAppUrl = process.env.LOGIC_APP_HTTP_TRIGGER_URL;

    if (!logicAppUrl) {
      context.res = { status: 500, body: { ok: false, error: "Server misconfigured" } };
      return;
    }

    // Must have JSON body
    if (!req.body || typeof req.body !== "object") {
      context.res = { status: 400, body: { ok: false, error: "Invalid JSON body" } };
      return;
    }

    const upstream = await fetch(logicAppUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(req.body)
    });

    if (!upstream.ok) {
      const text = await upstream.text().catch(() => "");
      context.log.warn(`Logic App failed: ${upstream.status} ${text.slice(0, 200)}`);
      context.res = { status: 502, body: { ok: false, error: "Upstream failed" } };
      return;
    }

    context.res = { status: 200, body: { ok: true } };
  } catch (err) {
    context.log.error(err);
    context.res = { status: 500, body: { ok: false, error: "Internal error" } };
  }
};