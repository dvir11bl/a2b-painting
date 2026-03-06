console.log("main.js loaded");

// Smooth scroll for elements with data-scroll-target
document.querySelectorAll('[data-scroll-target]').forEach(btn => {
  btn.addEventListener('click', () => {
    const sel = btn.getAttribute('data-scroll-target');
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

// Hero CTA: mobile calls directly, desktop scrolls to contact section.
(function () {
  const cta = document.getElementById('heroCallNowBtn');
  if (!cta) return;

  const isMobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isSmallTouch = window.matchMedia('(max-width: 900px) and (hover: none)').matches;
  const isMobile = isMobileUA || isSmallTouch;

  cta.setAttribute('href', isMobile ? 'tel:+17273325248' : '#contact');
})();

// Hero CTA: subtle breathing animation on load, then occasionally.
(function () {
  const cta = document.getElementById('heroCallNowBtn');
  if (!cta) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const cycleMs = 9000;
  let intervalId = null;
  let hoverPaused = false;

  function runBreath() {
    if (hoverPaused) return;
    cta.classList.remove('is-breathing');
    // Force reflow so repeated class toggles always retrigger animation.
    void cta.offsetWidth;
    cta.classList.add('is-breathing');
  }

  function startCycle() {
    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(() => {
      runBreath();
    }, cycleMs);
  }

  runBreath();
  startCycle();

  cta.addEventListener('mouseenter', () => {
    hoverPaused = true;
    cta.classList.remove('is-breathing');
  });

  cta.addEventListener('mouseleave', () => {
    hoverPaused = false;
    startCycle();
  });
})();

// Smooth scroll for in-page anchors, slower for #contact
document.querySelectorAll('a[href^="#"]').forEach(a => {
  a.addEventListener('click', e => {
    const id = a.getAttribute('href');
    const el = document.querySelector(id);
    if (!el) return;

    e.preventDefault();

    // Adjust scroll target for the sticky header
    const header = document.querySelector('.site-header');
    const headerOffset = header ? header.offsetHeight : 0;
    const startY = window.pageYOffset;
    const rect = el.getBoundingClientRect();
    const targetY = rect.top + window.pageYOffset - headerOffset;
    const duration = (id === '#contact') ? 1600 : 700;
    const startTime = performance.now();

    const easeInOutCubic = t => t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t + 2, 3)/2;

    function step(now){
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const eased = easeInOutCubic(progress);
      const y = startY + (targetY - startY) * eased;
      window.scrollTo(0, y);
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  });
});

// Mobile menu toggle
(function(){
  const toggle = document.querySelector('.nav__toggle');
  const menu   = document.getElementById('siteMenu');
  if (!toggle || !menu) return;
  toggle.addEventListener('click', () => {
    const open = menu.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  // Close menu after clicking a link
  menu.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    menu.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }));
})();

// Contact form submission to Azure Static Web Apps API
document.addEventListener("DOMContentLoaded", () => {
  const LOGIC_APP_CONTACT_URL = "https://prod-72.eastus.logic.azure.com:443/workflows/ab35930d45634403836ae97a12bde8ed/triggers/When_an_HTTP_request_is_received/paths/invoke?api-version=2016-10-01&sp=%2Ftriggers%2FWhen_an_HTTP_request_is_received%2Frun&sv=1.0&sig=C9z9tvsLQkfktDR76_g4xcR-FCgBZYsfgy-ws7DqJ38";
  const formLoadedAt = Date.now();
  const form =
    document.getElementById("contact-form") ||
    document.getElementById("contactForm") ||
    document.querySelector("form.contact__form");
  if (!form) {
    console.error("Contact form not found: expected #contact-form, #contactForm, or form.contact__form");
    return;
  }

  let statusEl = document.getElementById("contactFormStatus") || document.getElementById("form-status");
  if (!statusEl) {
    statusEl = document.createElement("p");
    statusEl.id = "form-status";
    statusEl.setAttribute("aria-live", "polite");
    statusEl.style.marginTop = "10px";
    form.appendChild(statusEl);
  }

  console.log("submit handler attached");

  const nameField = form.querySelector("#name") || form.querySelector('[name="name"]');
  const phoneField = form.querySelector("#phone") || form.querySelector('[name="phone"]');
  const cityZipField = form.querySelector("#cityZip") || form.querySelector('[name="cityZip"]');
  const messageField = form.querySelector("#message") || form.querySelector('[name="message"]');

  if (nameField) {
    nameField.addEventListener("input", () => {
      nameField.value = nameField.value.replace(/[0-9]/g, "").slice(0, 30);
    });
  }
  if (phoneField) {
    phoneField.addEventListener("input", () => {
      phoneField.value = phoneField.value.replace(/\D/g, "").slice(0, 15);
    });
  }
  if (cityZipField) {
    cityZipField.addEventListener("input", () => {
      cityZipField.value = cityZipField.value.slice(0, 20);
    });
  }
  if (messageField) {
    messageField.addEventListener("input", () => {
      messageField.value = messageField.value.slice(0, 500);
    });
  }

  form.addEventListener("submit", async (event) => {
    console.log("submit fired");
    event.preventDefault();

    const submitBtn =
      form.querySelector('button[type="submit"]') ||
      form.querySelector(".form__actions button");
    const originalBtnText = submitBtn?.textContent;

    const nameInput = form.querySelector("#name") || form.querySelector('[name="name"]');
    const phoneInput = form.querySelector("#phone") || form.querySelector('[name="phone"]');
    const emailInput = form.querySelector("#email") || form.querySelector('[name="email"]');
    const cityZipInput = form.querySelector("#cityZip") || form.querySelector('[name="cityZip"]');
    const messageInput = form.querySelector("#message") || form.querySelector('[name="message"]');

    const name = (nameInput?.value || "").replace(/[0-9]/g, "").slice(0, 30).trim();
    const phone = (phoneInput?.value || "").replace(/\D/g, "").slice(0, 15);
    const email = (emailInput?.value || "").trim();
    const cityZip = (cityZipInput?.value || "").slice(0, 20).trim();
    const message = (messageInput?.value || "").slice(0, 500).trim();
    const consentChecked = !!(form.querySelector("#consent")?.checked || form.querySelector('[name="consent"]')?.checked);
    const website = (form.querySelector("#website")?.value || form.querySelector('[name="website"]')?.value || "").trim();
    const formFillSeconds = Math.max(0, Math.round((Date.now() - formLoadedAt) / 1000));
    const submittedAt = new Date().toISOString();

    if (nameInput) nameInput.value = name;
    if (phoneInput) phoneInput.value = phone;
    if (emailInput) emailInput.value = email;
    if (cityZipInput) cityZipInput.value = cityZip;
    if (messageInput) messageInput.value = message;

    statusEl.style.opacity = "1";
    statusEl.style.transform = "none";
    statusEl.style.color = "";
    statusEl.textContent = "";

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    if (formFillSeconds < 3) {
      statusEl.textContent = "Please wait a moment and try again.";
      statusEl.style.color = "#FF7A00";
      return;
    }

    if (website) {
      statusEl.textContent = "Thank you! Your request was submitted successfully.";
      statusEl.style.color = "#0B2D5C";
      form.reset();
      return;
    }

    const payload = {
      name,
      phone,
      email,
      cityZip,
      message,
      website,
      formFillSeconds,
      submittedAt,
    };

    try {
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = "Sending...";
      }

      const response = await fetch(LOGIC_APP_CONTACT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }

      statusEl.textContent = "Thank you! Your request was submitted successfully.";
      statusEl.style.color = "#0B2D5C";
      form.reset();
    } catch (error) {
      console.error("Contact form submission failed:", error);
      statusEl.textContent = "Submission failed. Please try again.";
      statusEl.style.color = "#FF7A00";
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        if (originalBtnText) submitBtn.textContent = originalBtnText;
      }
    }
  });
});

// Footer copyright year
(function(){
  const yearEl = document.getElementById('footerYear');
  if (!yearEl) return;
  yearEl.textContent = String(new Date().getFullYear());
})();

// Zoom feature for flash cards from the mouse entry corner
(function(){

  // Skip on touch devices
  if (!window.matchMedia('(hover: hover)').matches) return;
  const cards = document.querySelectorAll('.feature-card');
  if (!cards.length) return;
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  cards.forEach(card => {
    function originFromEvent(e){
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left;
      const y = e.clientY - r.top;

      // Distances squared to each corner.
      const dTL = x*x + y*y;
      const dTR = (r.width - x)*(r.width - x) + y*y;
      const dBL = x*x + (r.height - y)*(r.height - y);
      const dBR = (r.width - x)*(r.width - x) + (r.height - y)*(r.height - y);
      const min = Math.min(dTL, dTR, dBL, dBR);
      if (min === dTL) return ['0%','0%'];
      if (min === dTR) return ['100%','0%'];
      if (min === dBL) return ['0%','100%'];
      return ['100%','100%'];
    }

    let entered = false;
    let ox = '50%';
    let oy = '50%';

    card.addEventListener('mouseenter', (e) => {
      entered = true;
      [ox, oy] = originFromEvent(e);
      card.style.transformOrigin = `${ox} ${oy}`;
      card.style.transform = 'scale(1.05)';
    });

    // Keep the same zoom origin during the hover.
    card.addEventListener('mousemove', () => {
      if (!entered) return;
      card.style.transformOrigin = `${ox} ${oy}`;
      card.style.transform = 'scale(1.05)';
    });

    card.addEventListener('mouseleave', () => {
      entered = false;
      card.style.transformOrigin = '';
      card.style.transform = '';
    });
  });
})();
