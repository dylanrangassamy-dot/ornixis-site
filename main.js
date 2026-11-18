// Ornixis Assistance — animations et interactions
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // --- Titre du hero : révélation mot à mot ---
  document.querySelectorAll('[data-split]').forEach(function (el) {
    var words = el.textContent.trim().split(/\s+/);
    el.setAttribute('aria-label', el.textContent.trim());
    el.textContent = '';
    words.forEach(function (w, i) {
      var outer = document.createElement('span');
      outer.className = 'word';
      outer.setAttribute('aria-hidden', 'true');
      var inner = document.createElement('span');
      inner.style.setProperty('--i', i);
      inner.textContent = w;
      outer.appendChild(inner);
      el.appendChild(outer);
      if (i < words.length - 1) el.appendChild(document.createTextNode(' '));
    });
  });

  // --- Apparition au défilement, avec décalage entre voisins ---
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !reduced) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });

    reveals.forEach(function (el) {
      var siblings = Array.prototype.filter.call(el.parentNode.children, function (c) {
        return c.classList.contains('reveal');
      });
      el.style.setProperty('--d', Math.min(siblings.indexOf(el), 5) * 90 + 'ms');
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  }

  // --- Barre de progression et état de la navigation ---
  var progress = document.querySelector('.progress');
  var nav = document.getElementById('nav');
  var ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (progress) progress.style.transform = 'scaleX(' + (max > 0 ? window.scrollY / max : 0) + ')';
      if (nav) nav.classList.toggle('is-scrolled', window.scrollY > 8);
      ticking = false;
    });
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // --- Lien actif selon la section visible ---
  var links = document.querySelectorAll('.nav__links a[href^="#"]');
  if ('IntersectionObserver' in window && links.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        links.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + e.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    links.forEach(function (a) {
      var target = document.querySelector(a.getAttribute('href'));
      if (target) spy.observe(target);
    });
  }

  // --- Menu mobile ---
  var burger = document.getElementById('burger');
  var menu = document.getElementById('menu');
  if (burger && menu) {
    var setMenu = function (open) {
      menu.classList.toggle('is-open', open);
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    };
    burger.addEventListener('click', function () {
      setMenu(!menu.classList.contains('is-open'));
    });
    menu.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') setMenu(false);
    });
  }

  // --- Panneau « suivi de dossier » : lignes cochées une à une, en boucle ---
  var list = document.getElementById('panelList');
  var bar = document.getElementById('panelBar');
  var status = document.getElementById('panelStatus');
  if (list && !reduced) {
    var items = list.querySelectorAll('li');
    var step = 0;
    var tick = function () {
      if (step < items.length) {
        items[step].classList.add('is-on');
        step++;
        bar.style.width = (step / items.length * 100) + '%';
        if (step === items.length) {
          status.textContent = 'Terminé';
          status.classList.add('is-done');
          setTimeout(tick, 3200);
        } else {
          setTimeout(tick, 850);
        }
      } else {
        items.forEach(function (li) { li.classList.remove('is-on'); });
        bar.style.width = '0';
        status.textContent = 'En cours';
        status.classList.remove('is-done');
        step = 0;
        setTimeout(tick, 900);
      }
    };
    setTimeout(tick, 1200);
  } else if (list) {
    list.querySelectorAll('li').forEach(function (li) { li.classList.add('is-on'); });
    if (status) { status.textContent = 'Terminé'; status.classList.add('is-done'); }
  }

  // --- Cartes : halo qui suit le curseur + légère inclinaison en 3D ---
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  document.querySelectorAll('.card').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      var x = e.clientX - r.left, y = e.clientY - r.top;
      card.style.setProperty('--mx', x + 'px');
      card.style.setProperty('--my', y + 'px');
      if (!finePointer || reduced || !card.classList.contains('is-in')) return;
      var ry = (x / r.width - 0.5) * 5;
      var rx = (0.5 - y / r.height) * 5;
      card.style.transition = 'transform 0.2s ease-out, box-shadow 0.3s';
      card.style.transform = 'perspective(1000px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-4px)';
    });
    card.addEventListener('pointerleave', function () {
      if (!card.style.transform) return;
      card.style.transition = 'transform 0.7s cubic-bezier(0.22, 1, 0.36, 1), box-shadow 0.3s';
      card.style.transform = '';
    });
  });

  // --- Photos : effet de profondeur au défilement ---
  var parallax = document.querySelectorAll('[data-parallax]');
  if (parallax.length && !reduced) {
    var pTick = false;
    var moveParallax = function () {
      pTick = false;
      var vh = window.innerHeight;
      parallax.forEach(function (img) {
        var r = img.parentNode.getBoundingClientRect();
        if (r.bottom < -100 || r.top > vh + 100) return;
        var p = (r.top + r.height / 2 - vh / 2) / vh;
        var strength = parseFloat(img.getAttribute('data-parallax')) || 40;
        img.style.transform = 'translate3d(0,' + (p * strength).toFixed(1) + 'px,0) scale(1.18)';
      });
    };
    window.addEventListener('scroll', function () {
      if (!pTick) { pTick = true; requestAnimationFrame(moveParallax); }
    }, { passive: true });
    window.addEventListener('resize', moveParallax);
    moveParallax();
  }

  // --- Halo de l'accroche : suit lentement le curseur ---
  var hero = document.querySelector('.hero');
  var orb = document.querySelector('.hero__orb');
  if (hero && orb && finePointer && !reduced) {
    hero.addEventListener('pointermove', function (e) {
      var r = hero.getBoundingClientRect();
      orb.style.setProperty('--ox', ((e.clientX - r.left) / r.width - 0.5) * 160 + 'px');
      orb.style.setProperty('--oy', ((e.clientY - r.top) / r.height - 0.5) * 120 + 'px');
    });
  }

  // --- Formulaire de contact : ouvre la messagerie du visiteur ---
  // Sans serveur pour l'instant ; à brancher sur un service d'envoi lors de la mise en ligne.
  var form = document.getElementById('contactForm');
  var note = document.getElementById('formNote');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      Array.prototype.forEach.call(form.elements, function (f) {
        if (!f.name) return;
        var valid = f.checkValidity();
        f.classList.toggle('is-invalid', !valid);
        if (!valid) ok = false;
      });
      if (!ok) {
        note.textContent = 'Merci de remplir tous les champs avec des informations valides.';
        note.classList.add('is-error');
        return;
      }
      note.classList.remove('is-error');
      var d = new FormData(form);
      var body = d.get('message') + '\n\n' + d.get('nom') + '\n' + d.get('email') + '\n' + d.get('tel');
      window.location.href = 'mailto:contact@ornixisassistance.fr'
        + '?subject=' + encodeURIComponent('Demande de contact — ' + d.get('nom'))
        + '&body=' + encodeURIComponent(body);
      note.textContent = 'Votre messagerie s\'ouvre avec le message prêt à envoyer.';
    });
    form.addEventListener('input', function (e) {
      e.target.classList.remove('is-invalid');
    });
  }

  var year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();
})();
