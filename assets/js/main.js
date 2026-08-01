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
    // ヘッダーに is-nav-open を付ける：開いている間だけ backdrop-filter を外すため。
    // これが無いと、スクロール後（.is-scrolled）にヘッダーが fixed の基準になり、
    // メニューの背景が画面を覆えなくなる（CSS側の注記も参照）。
    var header = document.getElementById('header');
    function setNav(open) {
      navLinks.classList.toggle('is-open', open);
      toggle.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      if (header) header.classList.toggle('is-nav-open', open);
      document.body.style.overflow = open ? 'hidden' : '';
      document.documentElement.style.overflow = open ? 'hidden' : '';
    }
    toggle.addEventListener('click', function () {
      setNav(!navLinks.classList.contains('is-open'));
    });
    // メニュー内のリンクを押したら閉じる
    navLinks.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { setNav(false); });
    });
    // Esc でも閉じる
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && navLinks.classList.contains('is-open')) setNav(false);
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

  /* ---------------------------------------------------------------
     9. YouTube動画：画面内で自動再生（ミュート）・画面外で一時停止
        音は常にオフ。対象は data-yt 付き iframe（src に enablejsapi=1 が必要）
  --------------------------------------------------------------- */
  var ytFrames = Array.prototype.slice.call(document.querySelectorAll('iframe[data-yt]'));
  if (ytFrames.length) {
    var ytPlayers = [];
    function bindYtObserver() {
      if (!('IntersectionObserver' in window)) return;
      var vio = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var rec = ytPlayers.filter(function (r) { return r.iframe === entry.target; })[0];
          if (!rec || !rec.player || typeof rec.player.playVideo !== 'function') return;
          try {
            rec.player.mute();                          // 常にミュート（音は鳴らさない）
            if (entry.isIntersecting) rec.player.playVideo();
            else rec.player.pauseVideo();
          } catch (e) {}
        });
      }, { threshold: 0.5 });
      ytPlayers.forEach(function (r) { vio.observe(r.iframe); });
    }
    window.onYouTubeIframeAPIReady = function () {
      ytFrames.forEach(function (f) {
        var player = new YT.Player(f, {
          events: { onReady: function (e) { e.target.mute(); } }
        });
        ytPlayers.push({ iframe: f, player: player });
      });
      bindYtObserver();
    };
    if (window.YT && window.YT.Player) {
      window.onYouTubeIframeAPIReady();
    } else if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
      var tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      document.head.appendChild(tag);
    }
  }

  /* ---------------------------------------------------------------
     10. 制作実績（自前動画）：画面内で無音ループ自動再生 → クリックで拡大再生
         対象は .vwork-media（中の <video data-vsrc> を遅延読み込みする）。
         音は一覧では絶対に鳴らさない。拡大時も初期はミュートで、
         ユーザーが「SOUND ON」を押したときだけ音を出す。
     --------------------------------------------------------------- */
  var vMedias = Array.prototype.slice.call(document.querySelectorAll('.vwork-media'));
  if (vMedias.length) {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // 読み込みは画面に近づいてから（データ量を無駄に使わない）
    function ensureLoaded(video) {
      if (!video || video.dataset.loaded) return;
      var src = video.getAttribute('data-vsrc');
      if (!src) return;
      video.src = src;
      video.load();
      video.dataset.loaded = '1';
    }

    vMedias.forEach(function (media) {
      var video = media.querySelector('.vwork-loop');
      if (!video) return;
      video.muted = true;            // 念のためJS側でも固定
      video.defaultMuted = true;
      video.volume = 0;

      // PCではカーソルを乗せた時点で確実に読み込み＆再生
      media.addEventListener('mouseenter', function () {
        ensureLoaded(video);
        if (!reduce) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
      });
    });

    if ('IntersectionObserver' in window) {
      var vio2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          var video = entry.target.querySelector('.vwork-loop');
          if (!video) return;
          if (entry.isIntersecting) {
            ensureLoaded(video);
            if (!reduce) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
          } else {
            try { video.pause(); } catch (e) {}
          }
        });
      }, { threshold: 0.35 });
      vMedias.forEach(function (m) { vio2.observe(m); });
    } else {
      vMedias.forEach(function (m) { ensureLoaded(m.querySelector('.vwork-loop')); });
    }

    /* --- 拡大再生（ライトボックス） --- */
    var modal = document.createElement('div');
    modal.className = 'vmodal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-label', '制作実績の再生');
    modal.innerHTML =
      '<div class="vmodal-inner">' +
        '<div class="vmodal-stage"><video playsinline controls preload="metadata"></video></div>' +
        '<div class="vmodal-bar">' +
          '<div><div class="vmodal-title"></div><div class="vmodal-client"></div></div>' +
          '<div class="vmodal-actions">' +
            '<button type="button" class="vmodal-btn" data-sound>SOUND ON</button>' +
            '<button type="button" class="vmodal-btn" data-close>CLOSE ✕</button>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    var mVideo  = modal.querySelector('video');
    var mTitle  = modal.querySelector('.vmodal-title');
    var mClient = modal.querySelector('.vmodal-client');
    var mSound  = modal.querySelector('[data-sound]');
    var lastFocus = null;

    function openModal(media) {
      var src = media.getAttribute('data-video');
      if (!src) return;
      lastFocus = document.activeElement;
      mTitle.textContent  = media.getAttribute('data-title') || '';
      mClient.textContent = media.getAttribute('data-client') || '';
      mVideo.src = src;
      mVideo.muted = true;                  // 開いた瞬間に音は出さない
      mSound.textContent = 'SOUND ON';
      modal.classList.add('is-mounted');
      // display の変化を確定させてからフェードさせる（rAF に頼らない：
      // 背面タブなど rAF が止まる状況で「見えない黒幕だけ残る」のを防ぐ）
      void modal.offsetWidth;
      modal.classList.add('is-open');
      document.documentElement.style.overflow = 'hidden';
      var p = mVideo.play(); if (p && p.catch) p.catch(function () {});
      modal.querySelector('[data-close]').focus();
    }

    function closeModal() {
      modal.classList.remove('is-open');
      try { mVideo.pause(); } catch (e) {}
      document.documentElement.style.overflow = '';
      setTimeout(function () {
        modal.classList.remove('is-mounted');
        mVideo.removeAttribute('src');
        mVideo.load();
      }, 400);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    vMedias.forEach(function (media) {
      media.addEventListener('click', function () { openModal(media); });
    });

    mSound.addEventListener('click', function () {
      mVideo.muted = !mVideo.muted;
      mSound.textContent = mVideo.muted ? 'SOUND ON' : 'SOUND OFF';
    });
    modal.querySelector('[data-close]').addEventListener('click', closeModal);
    modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });
  }

})();
