/* LUXE SOCIAL LAB — メディア用の軽量スクリプト
   1) 目次スクロールスパイ（現在地ハイライト）
   2) リンクコピー
   3) リード獲得フォームの mailto フォールバック
   4) GA4 が入っている場合の data-cta クリック計測
   ※ ナビ開閉・スクロールヘッダー・reveal は共通の main.js が担当 */
(function () {
  "use strict";

  /* ---- 1) 目次スクロールスパイ ---- */
  var toc = document.getElementById("toc");
  if (toc) {
    var links = Array.prototype.slice.call(toc.querySelectorAll("a"));
    var ids = links
      .map(function (a) {
        var id = decodeURIComponent((a.getAttribute("href") || "").replace(/^#/, ""));
        return id ? { a: a, el: document.getElementById(id) } : null;
      })
      .filter(function (x) {
        return x && x.el;
      });
    if (ids.length && "IntersectionObserver" in window) {
      var current = null;
      var io = new IntersectionObserver(
        function (entries) {
          entries.forEach(function (en) {
            if (en.isIntersecting) current = en.target;
          });
          ids.forEach(function (x) {
            x.a.classList.toggle("is-active", x.el === current);
          });
        },
        { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
      );
      ids.forEach(function (x) {
        io.observe(x.el);
      });
    }
  }

  /* ---- 2) リンクをコピー ---- */
  document.querySelectorAll("[data-copy]").forEach(function (el) {
    el.addEventListener("click", function (e) {
      e.preventDefault();
      var url = el.getAttribute("data-copy");
      var done = function () {
        var t = el.textContent;
        el.textContent = "コピーしました";
        setTimeout(function () {
          el.textContent = t;
        }, 1600);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(url).then(done, done);
      else done();
    });
  });

  /* ---- 3) リード獲得フォームの mailto フォールバック ---- */
  document.querySelectorAll('form.m-leadform[data-fallback="mailto"]').forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      var to = form.getAttribute("data-to") || "info@carasu.jp";
      var subject = form.getAttribute("data-subject") || "お問い合わせ";
      var lines = [];
      form.querySelectorAll("input, select, textarea").forEach(function (f) {
        if (f.type === "checkbox") {
          lines.push((f.name || "同意") + ": " + (f.checked ? "同意する" : "未同意"));
        } else if (f.name && f.value) {
          lines.push(f.name + ": " + f.value);
        }
      });
      var body =
        "以下の内容で資料を請求します。\n\n" +
        lines.join("\n") +
        "\n\n（このメールは " + location.href + " から作成されました）";
      window.location.href =
        "mailto:" + to + "?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
    });
  });

  /* ---- 5) 読書プログレスバー ---- */
  var bar = document.getElementById("readProgress");
  var article = document.querySelector("article");
  if (bar && article) {
    var tick = function () {
      var total = article.offsetHeight - window.innerHeight;
      var scrolled = Math.min(Math.max(-article.getBoundingClientRect().top, 0), Math.max(total, 1));
      bar.style.width = (total > 0 ? (scrolled / total) * 100 : 0).toFixed(1) + "%";
    };
    window.addEventListener("scroll", tick, { passive: true });
    window.addEventListener("resize", tick, { passive: true });
    tick();
  }

  /* ---- 4) GA4 data-cta クリック計測（gtag があれば） ---- */
  if (typeof window.gtag === "function") {
    document.querySelectorAll("[data-cta]").forEach(function (el) {
      el.addEventListener("click", function () {
        window.gtag("event", "select_content", {
          content_type: "cta",
          item_id: el.getAttribute("data-cta"),
        });
      });
    });
  }
})();
