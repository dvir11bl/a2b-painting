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

// Submit contact form as JSON to /contact_api.php
(function(){
  const form = document.getElementById('contactForm');
  if (!form) return;
  const statusEl = document.getElementById('contactFormStatus');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const actions = form.querySelector('.form__actions');
    const submitBtn = actions?.querySelector('button');
    const originalText = submitBtn?.textContent;
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending...'; }
    if (statusEl) { statusEl.textContent = ''; statusEl.style.color = ''; }

    // Collect form fields
    const payload = {
      name: (form.querySelector('#name')?.value || '').trim(),
      phone: (form.querySelector('#phone')?.value || '').trim(),
      email: (form.querySelector('#email')?.value || '').trim(),
    };

    try {
      const res = await fetch('/contact_api.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error('Request failed');
      if (statusEl) {
        statusEl.textContent = 'Thank you! We received your request.';
      }

      // Show success overlay and hide the submit button
      const overlay = form.querySelector('.form__success');
      const overlayText = form.querySelector('.form__success-text');
      const actions = form.querySelector('.form__actions');
      if (overlay) {
        overlay.removeAttribute('aria-hidden');
        overlay.focus?.();
      }
      if (overlayText) {
        overlayText.textContent = 'Thank you! We received your request and will contact you soon.';
      }
      if (submitBtn) submitBtn.classList.add('is-hidden');
      if (actions) actions.classList.add('submitted');
      form.classList.add('submitted');
      form.reset();
    } catch (err) {
      if (statusEl) {
        statusEl.textContent = 'We could not send your request. Please try again.';
        statusEl.style.color = '#FF7A00';
      }
    } finally {
      if (submitBtn) { submitBtn.disabled = false; if (originalText) submitBtn.textContent = originalText; }
    }
  });
})();

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
