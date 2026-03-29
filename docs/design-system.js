/* ═══════════════════════════════════════════════
   FLUENT — Design System Catalog JS
   ═══════════════════════════════════════════════ */

/* ─── Scroll Spy ─── */
function initScrollSpy() {
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.catalog-sidebar .nav-link');

  if (!sections.length || !navLinks.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const id = entry.target.id;
          navLinks.forEach((link) => {
            const isActive = link.dataset.section === id;
            link.classList.toggle('active', isActive);
          });
        }
      });
    },
    {
      rootMargin: '-10% 0px -70% 0px',
      threshold: 0,
    }
  );

  sections.forEach((section) => observer.observe(section));
}

/* ─── Toggle Select (quiz options / filter pills) ─── */
function toggleSelect(el) {
  const isQuizOption = el.closest('[data-quiz-group]');

  if (isQuizOption) {
    // Only one selected at a time within the group
    const group = el.closest('[data-quiz-group]');
    group.querySelectorAll('.quiz-option, .selectable').forEach((opt) => {
      opt.classList.remove('selected');
    });
    el.classList.add('selected');
  } else if (el.classList.contains('filter-pill')) {
    // Filter pills: toggle active/selected state
    const isActive = el.classList.contains('active') || el.classList.contains('selected');
    if (isActive) {
      el.classList.remove('active', 'selected');
    } else {
      el.classList.add('selected');
    }
  } else {
    // Multi-select toggle for pills etc.
    el.classList.toggle('selected');
  }
}

/* ─── Fire Confetti ─── */
function fireConfetti(btn) {
  const rect = btn.getBoundingClientRect();
  const originX = rect.left + rect.width / 2;
  const originY = rect.top + rect.height / 2;
  const colors = [
    '#6c5ce7', '#a29bfe',
    '#00b894', '#55efc4',
    '#e17055', '#fab1a0',
    '#fdcb6e', '#ffeaa7',
  ];
  const count = 30;

  for (let i = 0; i < count; i++) {
    const particle = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const size = Math.random() * 8 + 4;
    const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5) * 0.5;
    const distance = Math.random() * 120 + 60;
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance - 40;
    const rotation = Math.random() * 720 - 360;
    const duration = 0.6 + Math.random() * 0.8;

    particle.style.cssText = `
      position: fixed;
      left: ${originX}px;
      top: ${originY}px;
      width: ${size}px;
      height: ${size}px;
      background: ${color};
      border-radius: ${Math.random() > 0.5 ? '50%' : '3px'};
      pointer-events: none;
      z-index: 9999;
      --tx: ${tx}px;
      --ty: ${ty}px;
      --r: ${rotation}deg;
      animation: confettiPop ${duration}s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
    `;

    document.body.appendChild(particle);
    setTimeout(() => particle.remove(), (duration + 0.1) * 1000);
  }
}

/* ─── Toggle Switch ─── */
function toggleSwitch(el) {
  el.classList.toggle('active');
}

/* ─── Dismiss Alert ─── */
function dismissAlert(el) {
  // el can be the close button — find the alert parent
  const alert = el.closest('[data-alert]') || el.parentElement;
  if (!alert) return;

  alert.classList.add('alert-dismissing');
  alert.addEventListener('animationend', () => {
    alert.remove();
  }, { once: true });
}

/* ─── Modal ─── */
function openModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';

  // Close on overlay click
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(id);
  }, { once: true });

  // Close on Escape
  function onEsc(e) {
    if (e.key === 'Escape') {
      closeModal(id);
      document.removeEventListener('keydown', onEsc);
    }
  }
  document.addEventListener('keydown', onEsc);

  // Store cleanup ref
  modal._escHandler = onEsc;
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (!modal) return;

  modal.classList.remove('active');
  document.body.style.overflow = '';

  if (modal._escHandler) {
    document.removeEventListener('keydown', modal._escHandler);
    modal._escHandler = null;
  }
}

/* ─── Smooth Scroll for Sidebar Links ─── */
function initSmoothScroll() {
  document.querySelectorAll('.catalog-sidebar .nav-link[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const id = link.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (!target) return;

      const offset = 24;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });
}

/* ─── Stagger Animation ─── */
function playStagger() {
  const items = document.querySelectorAll('#stagger-container .stagger-item');
  // Reset all to hidden
  items.forEach((item) => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(16px)';
  });
  // Cascade reveal
  items.forEach((item, i) => {
    setTimeout(() => {
      item.style.opacity = '1';
      item.style.transform = 'translateY(0)';
    }, i * 80);
  });
}

/* ─── Page Transition Demo ─── */
let _pageContentVisible = 'a';
function togglePageContent() {
  const contentA = document.getElementById('page-content-a');
  const contentB = document.getElementById('page-content-b');
  if (!contentA || !contentB) return;

  if (_pageContentVisible === 'a') {
    // Fade out A
    contentA.style.opacity = '0';
    contentA.style.transform = 'translateY(-20px)';
    // Fade in B after brief delay
    setTimeout(() => {
      contentB.style.opacity = '1';
      contentB.style.transform = 'translateY(0)';
      _pageContentVisible = 'b';
    }, 300);
  } else {
    // Fade out B
    contentB.style.opacity = '0';
    contentB.style.transform = 'translateY(20px)';
    // Fade in A
    setTimeout(() => {
      contentA.style.opacity = '1';
      contentA.style.transform = 'translateY(0)';
      _pageContentVisible = 'a';
    }, 300);
  }
}

/* ─── Splash Replay ─── */
function replaySplash() {
  const logo = document.getElementById('splash-logo');
  const tagline = document.getElementById('splash-tagline');
  if (!logo || !tagline) return;

  // Remove animation, force reflow, re-add
  logo.style.animation = 'none';
  tagline.style.animation = 'none';
  logo.offsetHeight; // reflow
  logo.style.animation = 'splashBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) both';
  tagline.style.animation = 'fadeIn 0.5s ease 0.5s both';
}

/* ─── Mobile Menu Toggle ─── */
function toggleMobileMenu() {
  const sidebar = document.querySelector('.catalog-sidebar');
  if (!sidebar) return;
  sidebar.classList.toggle('open');
}

/* ─── Init ─── */
document.addEventListener('DOMContentLoaded', () => {
  initScrollSpy();
  initSmoothScroll();

  // Show hamburger on mobile
  const hamburger = document.getElementById('hamburger-btn');
  if (hamburger) {
    hamburger.classList.remove('hidden');
    hamburger.classList.add('flex');
  }

  // Close sidebar when clicking outside on mobile
  document.addEventListener('click', (e) => {
    const sidebar = document.querySelector('.catalog-sidebar');
    const hamburgerBtn = document.getElementById('hamburger-btn');
    if (!sidebar || !hamburgerBtn) return;
    if (
      sidebar.classList.contains('open') &&
      !sidebar.contains(e.target) &&
      !hamburgerBtn.contains(e.target)
    ) {
      sidebar.classList.remove('open');
    }
  });
});
