const nodemailer = require("nodemailer");

function clean(s, max = 2000) {
  return (typeof s === "string" ? s.trim() : "").slice(0, max);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

module.exports = async function (context, req) {
  try {
    const body = req.body || {};

    // Honeypot field (hidden input). If filled, drop silently.
    if (body.website && String(body.website).trim() !== "") {
      context.res = { status: 200, jsonBody: { ok: true } };
      return;
    }

    const name = clean(body.name, 80);
    const phone = clean(body.phone, 40);
    const email = clean(body.email, 120);
    const cityZip = clean(body.cityZip, 80);
    const projectType = clean(body.projectType, 60);
    const message = clean(body.message, 2000);

    // Required fields (you can also require email if you want)
    if (!name || !phone || !cityZip) {
      context.res = { status: 400, jsonBody: { ok: false, error: "Missing required fields" } };
      return;
    }

    // If email is required on your form, enforce it here:
    if (!email || !isValidEmail(email)) {
      context.res = { status: 400, jsonBody: { ok: false, error: "Valid email is required" } };
      return;
    }

    const {
      SMTP_HOST,
      SMTP_PORT,
      SMTP_USER,
      SMTP_PASS,
      OWNER_EMAIL,
      FROM_EMAIL
    } = process.env;

    if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS || !OWNER_EMAIL || !FROM_EMAIL) {
      context.res = { status: 500, jsonBody: { ok: false, error: "Server not configured" } };
      return;
    }

    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: false, // 587 STARTTLS
      auth: { user: SMTP_USER, pass: SMTP_PASS }
    });

    const submittedAt = new Date().toLocaleString("en-US", { timeZone: "America/New_York" });

    // 1) Email to OWNER
    const ownerSubject = `New Estimate Request — ${name} (${cityZip})`;
    const ownerText =
`New estimate request received:

Name: ${name}
Phone: ${phone}
Email: ${email}
City/Zip: ${cityZip}
Project Type: ${projectType || "(not provided)"}

Message:
${message || "(no message)"}

Submitted: ${submittedAt}
`;

    await transporter.sendMail({
      from: `A2B Painting <${FROM_EMAIL}>`,
      to: OWNER_EMAIL,
      replyTo: email,
      subject: ownerSubject,
      text: ownerText
    });

    // 2) Confirmation to CUSTOMER
    const customerSubject = "We’ve received your request — A2B Painting";
    const customerText =
`Hi ${name},

Thanks for contacting A2B Painting!
We’ve received your request and will get back to you shortly to discuss your project and schedule your free estimate.

If you need immediate assistance, call or text:
(727) 643-1680

— A2B Painting
Serving Tampa Bay Area
`;

    await transporter.sendMail({
      from: `A2B Painting <${FROM_EMAIL}>`,
      to: email,
      subject: customerSubject,
      text: customerText
    });

    context.res = { status: 200, jsonBody: { ok: true } };
  } catch (err) {
    context.log.error(err);
    context.res = { status: 500, jsonBody: { ok: false, error: "Internal error" } };
  }
};