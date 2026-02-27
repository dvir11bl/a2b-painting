// Smooth scroll for elements with data-scroll-target
document.querySelectorAll('[data-scroll-target]').forEach(btn => {
  btn.addEventListener('click', () => {
    const sel = btn.getAttribute('data-scroll-target');
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

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

// Parallax the hero background on scroll (skips reduced motion and small screens).
(function () {
  const hero = document.getElementById('hero');
  const bg   = hero?.querySelector('.hero__bg');
  if (!hero || !bg) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const smallScreen = window.matchMedia('(max-width: 640px)').matches;
  if (prefersReduced || smallScreen) return;

  const START = 15;
  const END   = 82;
  const SPEED = 1.5;

  let ticking = false;
  const clamp = (n, a, b) => Math.min(Math.max(n, a), b);

  function onScroll() {
    if (ticking) return;
    ticking = true;

    requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      // Amount of the hero that has scrolled past the top.
      const scrolled = Math.max(0, -rect.top);

      // Progress reaches 1.0 faster with SPEED.
      const progress = clamp(scrolled / (rect.height / SPEED), 0, 1);

      const y = START + (END - START) * progress;
      bg.style.setProperty('--bgY', `${y}%`);
      ticking = false;
    });
  }

  onScroll();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
})();

// Success stories swiper
new Swiper('.success-swiper', {
  slidesPerView: 1,
  spaceBetween: 0,
  centeredSlides: false,

  // Loop slides.
  loop: true,
  speed: 900,

  // Autoplay and pause on hover.
  autoplay: {
    delay: 4000,
    disableOnInteraction: false,
    pauseOnMouseEnter: true,
  },

  navigation: {
    nextEl: '.success-swiper .swiper-button-next',
    prevEl: '.success-swiper .swiper-button-prev',
  },
  pagination: {
    el: '.success-swiper .swiper-pagination',
    clickable: true,
  },

});

// Wrap story title/subtitle with avatar for consistent layout
(function(){
  const cards = document.querySelectorAll('#success .story-card');
  if (!cards.length) return;
  cards.forEach(card => {
    const title = card.querySelector('.story__title');
    const subtitle = card.querySelector('.story__subtitle');
    if (!title || !subtitle) return;

    // Create header wrapper.
    const header = document.createElement('div');
    header.className = 'story__header';

    // Use existing avatar or create a default
    let img = card.querySelector('.story__avatar');
    if (!img) {
      img = document.createElement('img');
      img.className = 'story__avatar';
      img.src = 'assets/media/avatar-default.svg';
      img.alt = `Photo of ${title.textContent?.trim() || 'storyteller'}`;
    }

    // Meta container for title/subtitle
    const meta = document.createElement('div');
    meta.className = 'story__meta';

    // Insert header and move nodes into it
    card.insertBefore(header, title);
    meta.appendChild(title);
    meta.appendChild(subtitle);
    header.appendChild(img);
    header.appendChild(meta);
  });
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

// Toggle the privacy modal open/close.
(function(){
  const openBtn = document.getElementById('privacy-link');
  const closeBtn = document.getElementById('close-privacy');
  const modal = document.getElementById('privacy-modal');
  if (!openBtn || !closeBtn || !modal) return;

  openBtn.addEventListener('click', (e) => {
    e.preventDefault();
    modal.style.display = 'block';
  });

  closeBtn.addEventListener('click', () => {
    modal.style.display = 'none';
  });
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
