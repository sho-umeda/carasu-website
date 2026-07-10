/* =====================================================================
   carasu inc. — Corporate Site  /  main.js
   ---------------------------------------------------------------------
   全ページ共通のふるまい。依存ライブラリなしの素のJavaScriptです。
     1. ヘッダーの背景付与（スクロール検知）
     2. ハンバーガーメニューの開閉（スマホ）
     3. スクロールに応じたフェードイン演出（data-reveal）
     4. 現在ページをナビでハイライト
     5. 制作実績（Works）のカテゴリ絞り込み
     6. FAQ等のアコーディオン（data-accordion）
   ===================================================================== */
(function () {
  'use strict';

  /* ---------------------------------------------------------------
     1. ヘッダー：少しスクロールしたら背景（ブラー）を付ける
  --------------------------------------------------------------- */
  var header = document.getElementById('header');
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 24) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------------------------------------------------------------
     2. ハンバーガーメニュー（スマホ）
  --------------------------------------------------------------- */
  var toggle = document.getElementById('navToggle');
  var navLinks = document.getElementById('navLinks');
  if (toggle && navLinks) {
    toggle.addEventListener('click', function () {
      var open = navLinks.classList.toggle('is-open');
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    // メニュー内のリンクを押したら閉じる
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        navLinks.classList.remove('is-open');
        toggle.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------------------------------------------------------------
     3. スクロール演出：画面に入った要素に .is-in を付与
        （CSS側の [data-reveal] がフェードアップします）
  --------------------------------------------------------------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target); // 一度出したら監視解除
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    // 未対応ブラウザではそのまま表示
    revealEls.forEach(function (el) { el.classList.add('is-in'); });
  }

  /* ---------------------------------------------------------------
     4. 現在ページをナビでハイライト
  --------------------------------------------------------------- */
  var path = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(function (a) {
    var href = a.getAttribute('href');
    if (href === path) a.classList.add('is-active');
  });

  /* ---------------------------------------------------------------
     5. 制作実績（Works）のカテゴリ絞り込み
        works.html の .filter-btn[data-filter] と .work-card[data-cat] で動作
  --------------------------------------------------------------- */
  var filterBtns = document.querySelectorAll('.filter-btn');
  var filterCards = document.querySelectorAll('[data-cat]');
  if (filterBtns.length && filterCards.length) {
    filterBtns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cat = btn.getAttribute('data-filter');
        filterBtns.forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        filterCards.forEach(function (card) {
          var show = (cat === 'all') || (card.getAttribute('data-cat').indexOf(cat) !== -1);
          card.style.display = show ? '' : 'none';
        });
      });
    });
  }

  /* ---------------------------------------------------------------
     6. アコーディオン（採用FAQ等）：[data-accordion] > .acc-item > .acc-head
  --------------------------------------------------------------- */
  document.querySelectorAll('[data-accordion] .acc-head').forEach(function (head) {
    head.addEventListener('click', function () {
      var item = head.closest('.acc-item');
      if (item) item.classList.toggle('is-open');
    });
  });

  /* ---------------------------------------------------------------
     7. 現在年をフッターに反映（<span data-year>）
  --------------------------------------------------------------- */
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  /* ---------------------------------------------------------------
     8. 数字のカウントアップ（[data-count] をスクロールで 0→目標値へ）
  --------------------------------------------------------------- */
  var counters = document.querySelectorAll('[data-count]');
  var prefersReduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function animateCount(el) {
    var raw = el.getAttribute('data-count');
    var target = parseFloat(raw);
    var decimals = (raw.split('.')[1] || '').length;
    var dur = 1600, startTs = null;
    function step(ts) {
      if (!startTs) startTs = ts;
      var p = Math.min((ts - startTs) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);          // easeOutCubic
      el.textContent = (target * eased).toFixed(decimals);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals);
    }
    requestAnimationFrame(step);
  }
  if (counters.length && 'IntersectionObserver' in window && !prefersReduce) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { animateCount(entry.target); cio.unobserve(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { el.textContent = '0'; cio.observe(el); });
  }

})();
