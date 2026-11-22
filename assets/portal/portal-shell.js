(function () {
  'use strict';

  function initPortalShell() {
    var sidebar = document.getElementById('bcc-sidebar');
    var overlay = document.getElementById('bcc-sidebar-overlay');
    var openBtn = document.getElementById('bcc-btn-hamburger');
    var closeBtn = document.getElementById('bcc-btn-close-sidebar');

    if (!sidebar) return;

    var mqDesktop = window.matchMedia('(min-width: 768px)');
    var lastFocused = null;

    function syncInert() {
      if (mqDesktop.matches) {
        sidebar.removeAttribute('inert');
        sidebar.classList.remove('is-open');
        if (overlay) overlay.classList.remove('is-open');
        if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      } else if (!sidebar.classList.contains('is-open')) {
        sidebar.setAttribute('inert', '');
      }
    }

    function openSidebar() {
      if (mqDesktop.matches) return;
      lastFocused = document.activeElement;
      sidebar.removeAttribute('inert');
      sidebar.classList.add('is-open');
      if (overlay) overlay.classList.add('is-open');
      if (openBtn) openBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      if (closeBtn) {
        closeBtn.focus();
      }
    }

    function closeSidebar(restoreFocus) {
      sidebar.classList.remove('is-open');
      if (overlay) overlay.classList.remove('is-open');
      if (openBtn) openBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      if (!mqDesktop.matches) {
        sidebar.setAttribute('inert', '');
      }
      if (restoreFocus && lastFocused && typeof lastFocused.focus === 'function') {
        lastFocused.focus();
      }
    }

    if (openBtn) {
      openBtn.addEventListener('click', function () {
        if (sidebar.classList.contains('is-open')) {
          closeSidebar(true);
        } else {
          openSidebar();
        }
      });
    }

    if (closeBtn) {
      closeBtn.addEventListener('click', function () {
        closeSidebar(true);
      });
    }

    if (overlay) {
      overlay.addEventListener('click', function () {
        closeSidebar(true);
      });
    }

    document.addEventListener('keydown', function (ev) {
      if (ev.key === 'Escape' && sidebar.classList.contains('is-open')) {
        closeSidebar(true);
      }
    });

    if (typeof mqDesktop.addEventListener === 'function') {
      mqDesktop.addEventListener('change', syncInert);
    } else if (typeof mqDesktop.addListener === 'function') {
      mqDesktop.addListener(syncInert);
    }

    syncInert();

    // Higiene de segurança em links externos (rel="noopener noreferrer")
    document.querySelectorAll('a[target="_blank"]').forEach(function (a) {
      var rel = (a.getAttribute('rel') || '').trim();
      var tokens = rel ? rel.split(/\s+/) : [];
      if (tokens.indexOf('noopener') === -1) tokens.push('noopener');
      if (tokens.indexOf('noreferrer') === -1) tokens.push('noreferrer');
      a.setAttribute('rel', tokens.join(' '));
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPortalShell);
  } else {
    initPortalShell();
  }
})();
