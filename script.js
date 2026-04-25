(function () {
  'use strict';

  var envelope      = document.getElementById('envelope');
  var flap          = document.querySelector('.env-flap');
  var letter        = document.getElementById('letter');
  var hint          = document.getElementById('hint');
  var invite        = document.getElementById('invitation');
  var scene         = document.getElementById('scene');
  var bottomFlowers = document.getElementById('bottom-flowers');
  var topFlowers    = document.getElementById('top-flowers');
  var opened        = false;

  // ── Music ──
  var bgAudio      = document.getElementById('bg-audio');
  var musicToggle  = document.getElementById('music-toggle');

  bgAudio.volume = 0;

  function fadeUpAudio(duration) {
    var target   = 0.1;
    var steps    = 30;
    var interval = duration / steps;
    var step     = target / steps;
    var timer = setInterval(function () {
      bgAudio.volume = Math.min(bgAudio.volume + step, target);
      if (bgAudio.volume >= target) clearInterval(timer);
    }, interval);
  }

  function fadeOutAudio(duration, cb) {
    var steps    = 30;
    var interval = duration / steps;
    var step     = bgAudio.volume / steps;
    var timer = setInterval(function () {
      bgAudio.volume = Math.max(bgAudio.volume - step, 0);
      if (bgAudio.volume <= 0.001) {
        bgAudio.volume = 0;
        clearInterval(timer);
        bgAudio.pause();
        if (cb) cb();
      }
    }, interval);
  }

  musicToggle.addEventListener('click', function () {
    if (musicToggle.classList.contains('playing')) {
      // Pause
      musicToggle.classList.remove('playing');
      musicToggle.setAttribute('aria-pressed', 'false');
      fadeOutAudio(600);
    } else {
      // Play — call play() synchronously (gesture context)
      musicToggle.classList.add('playing');
      musicToggle.setAttribute('aria-pressed', 'true');
      bgAudio.play().catch(function () {});
      fadeUpAudio(800);
    }
  });

  // Pause when tab hidden, resume if still playing
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (!bgAudio.paused) bgAudio.pause();
    } else {
      if (musicToggle.classList.contains('playing')) {
        bgAudio.play().catch(function () {});
      }
    }
  });
    

  // ── Night mode ──
  var nightToggle = document.getElementById('night-toggle');
  if (localStorage.getItem('night') === 'true') {
    document.body.classList.add('night');
  }
  if (document.body.classList.contains('night')) {
    nightToggle.setAttribute('aria-checked', 'true');
  }
  nightToggle.addEventListener('click', function () {
    var isNight = document.body.classList.toggle('night');
    nightToggle.setAttribute('aria-checked', isNight ? 'true' : 'false');
    localStorage.setItem('night', isNight);
  });

  // Disable scroll on envelope screen
  document.body.style.overflow = 'hidden';

  function openEnvelope() {
    if (opened) return;
    opened = true;

    // Start audio at volume 0 synchronously (preserves gesture context for iOS)
    bgAudio.play().catch(function () {});
    musicToggle.classList.add('playing');
    musicToggle.setAttribute('aria-pressed', 'true');

    // Step 1 — open flap (0ms)
    flap.classList.add('open');

    // Step 1b — drop flap behind letter once past 90° (~half of 1.8s)
    setTimeout(function () {
      flap.classList.add('behind');
    }, 950);

    // Step 2 — overflow visible + letter + flowers + butterflies rise (1300ms)
    setTimeout(function () {
      envelope.classList.add('open-overflow');
      envelope.classList.add('flowers-out');
      letter.classList.add('rising');
      document.getElementById('butterfly-1').classList.add('flying');
      document.getElementById('butterfly-2').classList.add('flying');
      document.getElementById('butterfly-3').classList.add('flying');
      document.getElementById('butterfly-4').classList.add('flying');
    }, 1300);

    // Step 3 — fade out envelope + scene + flowers + hint (3200ms)
    setTimeout(function () {
      envelope.classList.add('fading');
      scene.classList.add('closing');
      bottomFlowers.classList.add('closing');
      topFlowers.classList.add('closing');
      hint.classList.add('hidden');
    }, 3200);

    // Step 4 — show invitation and reveal sections (4200ms)
    // #invitation is already position:relative in the flow (opacity:0), so there
    // is no position change here — zero layout shift possible on any browser.
    setTimeout(function () {
      document.body.classList.add('scrollable');
      invite.removeAttribute('aria-hidden');
      invite.classList.add('visible');
      scene.style.display = 'none';
      bottomFlowers.style.display = 'none';
      topFlowers.style.display = 'none';
      document.body.style.overflow = '';
      nightToggle.classList.remove('night-toggle--hidden');
      musicToggle.classList.remove('music-toggle--hidden');
      fadeUpAudio(1200);
    }, 4200);
  }

  envelope.addEventListener('click', openEnvelope);

  // Keyboard accessibility
  envelope.addEventListener('keydown', function (e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openEnvelope();
    }
  });

  // Scroll reveal
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });

  document.querySelectorAll('.msg-inner, .cd-inner, .rsvp-inner, .tt-inner').forEach(function (el) {
    revealObserver.observe(el);
  });

  // Timetable modal
  var ttModal      = document.getElementById('tt-modal');
  var ttModalIcon  = ttModal.querySelector('.tt-modal__icon');
  var ttModalTime  = ttModal.querySelector('.tt-modal__time');
  var ttModalTitle = ttModal.querySelector('.tt-modal__title');
  var ttModalDesc  = ttModal.querySelector('.tt-modal__desc');
  var ttModalClose = ttModal.querySelector('.tt-modal__close');
  var ttOverlay    = ttModal.querySelector('.tt-modal__overlay');

  function openTtModal(item) {
    ttModalIcon.textContent  = item.dataset.icon  || '';
    ttModalTime.textContent  = item.dataset.time  || '';
    ttModalTitle.textContent = item.dataset.title || '';
    ttModalDesc.textContent  = item.dataset.desc  || '';
    ttModal.classList.add('open');
    ttModal.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function closeTtModal() {
    ttModal.classList.remove('open');
    ttModal.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.tt-item').forEach(function (item) {
    item.addEventListener('click', function () {
      openTtModal(item);
    });
  });

  ttModalClose.addEventListener('click', closeTtModal);
  ttOverlay.addEventListener('click', closeTtModal);
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeTtModal();
  });

  // Countdown — set your wedding date here
  var weddingDate = new Date('2026-04-25T18:00:00');

  function updateCountdown() {
    var now = new Date();
    var diff = weddingDate - now;
    if (diff <= 0) {
      document.getElementById('cd-days').textContent    = '00';
      document.getElementById('cd-hours').textContent   = '00';
      document.getElementById('cd-minutes').textContent = '00';
      document.getElementById('cd-seconds').textContent = '00';
      return;
    }
    var days    = Math.floor(diff / 86400000);
    var hours   = Math.floor((diff % 86400000) / 3600000);
    var minutes = Math.floor((diff % 3600000)  / 60000);
    var seconds = Math.floor((diff % 60000)    / 1000);
    function pad(n) { return n < 10 ? '0' + n : '' + n; }
    document.getElementById('cd-days').textContent    = pad(days);
    document.getElementById('cd-hours').textContent   = pad(hours);
    document.getElementById('cd-minutes').textContent = pad(minutes);
    document.getElementById('cd-seconds').textContent = pad(seconds);
  }

  updateCountdown();
  setInterval(updateCountdown, 1000);

  // RSVP — attendance radio toggles guest count field
  var attendanceInputs = document.querySelectorAll('input[name="attendance"]');
  var guestCountField = document.getElementById('guest-count-field');

  attendanceInputs.forEach(function (radio) {
    radio.addEventListener('change', function () {
      if (radio.value === 'yes') {
        guestCountField.classList.add('visible');
      } else {
        guestCountField.classList.remove('visible');
      }
    });
  });

  // RSVP — form submit (showcase only)
  var rsvpForm = document.getElementById('rsvp-form');
  var rsvpSuccess = document.getElementById('rsvp-success');

  rsvpForm.addEventListener('submit', function (e) {
    e.preventDefault();
    rsvpForm.style.display = 'none';
    rsvpSuccess.classList.add('visible');
  });

  // Smooth scroll for inv-cta
  document.querySelector('.inv-cta').addEventListener('click', function (e) {
    e.preventDefault();
    var target = document.getElementById('rsvp');
    if (target) { target.scrollIntoView({ behavior: 'smooth' }); }
  });

}());
