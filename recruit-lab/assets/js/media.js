/* =====================================================================
   採用担当の備忘録（HIRING NOTES） / media.js

   1. 読書プログレスバー（＋携帯の下部固定バーに読了率を出す）
   2. 目次の自動生成と現在位置追従（携帯ではTL;DRの直後へ移して折りたたむ）
   3. 表を横スクロール枠で包み、数値列を右寄せにする
   4. 図の番号（図1・図2…）を上から順に振る
   5. 記事一覧の絞り込み（業種・課題）
   9. フォームの送信（ページを移動させない）
   0. ?measure=1 のときだけ動く開発用の実測表示
   ===================================================================== */
(function () {
  "use strict";

  var article = document.querySelector(".m-prose");

  /* --- 4. 図番号を振る -------------------------------------------
     ショートコードは記事内の順番を知らないので、ここで採番する。 */
  if (article) {
    var figs = article.querySelectorAll(".g .g__no");
    Array.prototype.forEach.call(figs, function (el, i) {
      el.textContent = "図" + (i + 1);
    });
  }

  /* --- 1. 読書プログレスバー ------------------------------------ */
  var bar = document.querySelector(".m-progress__bar");
  var readOut = document.querySelector("[data-read]");
  if (bar && article) {
    var update = function () {
      var rect = article.getBoundingClientRect();
      var total = rect.height - window.innerHeight;
      var done = -rect.top;
      var ratio = total > 0 ? Math.min(Math.max(done / total, 0), 1) : 0;
      bar.style.width = (ratio * 100).toFixed(2) + "%";
      if (readOut) readOut.textContent = Math.round(ratio * 100) + "%";
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // 下部固定バーは記事ページだけ（トップや一覧では邪魔になる）
    document.body.classList.add("has-bottom");
  }

  /* --- 2. 目次 --------------------------------------------------- */
  var tocList = document.querySelector("[data-toc]");
  if (tocList && article) {
    var heads = Array.prototype.slice.call(article.querySelectorAll("h2, h3"));
    if (heads.length) {
      heads.forEach(function (h) {
        if (!h.id) return;
        var li = document.createElement("li");
        if (h.tagName === "H3") li.className = "lv3";
        var a = document.createElement("a");
        a.href = "#" + h.id;
        a.textContent = h.textContent;
        li.appendChild(a);
        tocList.appendChild(li);
      });

      var links = Array.prototype.slice.call(tocList.querySelectorAll("a"));
      var byId = {};
      links.forEach(function (a) { byId[a.getAttribute("href").slice(1)] = a; });

      if ("IntersectionObserver" in window) {
        var visible = {};
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) { visible[e.target.id] = e.isIntersecting; });
          var currentId = null;
          for (var i = 0; i < heads.length; i++) {
            if (visible[heads[i].id]) { currentId = heads[i].id; break; }
          }
          if (!currentId) {
            for (var j = heads.length - 1; j >= 0; j--) {
              if (heads[j].getBoundingClientRect().top < 120) { currentId = heads[j].id; break; }
            }
          }
          links.forEach(function (a) { a.classList.remove("is-active"); });
          if (currentId && byId[currentId]) byId[currentId].classList.add("is-active");
        }, { rootMargin: "-70px 0px -75% 0px", threshold: 0 });
        heads.forEach(function (h) { if (h.id) io.observe(h); });
      }
    } else {
      var toc = tocList.closest(".m-toc");
      if (toc) toc.style.display = "none";
    }
  }


  /* --- 6. 本文内の目次（h2だけ・番号つき） -----------------------
     テテマーチのコラムはリード直後に目次を置いている。長文の記事では
     「何章あるか」が先に見えるほうが読み始めやすい。 */
  var indexList = document.querySelector("[data-index]");
  if (indexList && article) {
    var h2s = Array.prototype.slice.call(article.querySelectorAll("h2"));
    if (h2s.length >= 3) {
      h2s.forEach(function (h) {
        if (!h.id) return;
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.href = "#" + h.id;
        a.textContent = h.textContent;
        li.appendChild(a);
        indexList.appendChild(li);
      });
    } else {
      var ix = indexList.closest(".m-index");
      if (ix) ix.style.display = "none";
    }
  }

  /* --- 7. 中段のCTAバナーを自動で差し込む -----------------------
     記事側に書くと24本すべてに手を入れることになるので、ここで入れる。
     位置は3つ目の見出しの直前（読み始めて離脱する手前）。 */
  if (article) {
    var heads2 = article.querySelectorAll("h2");
    if (heads2.length >= 5) {
      var target = heads2[2];
      var consult = document.querySelector(".m-cta .m-btn--key");
      var b = document.createElement("aside");
      b.className = "m-banner";
      b.innerHTML =
        '<div class="m-banner__body">' +
        '<p class="m-banner__t">読みながら、自社に当てて考えたい方へ</p>' +
        '<p class="m-banner__d">現状のアカウントと採用の数字を見ながら、何から手をつけるべきかを30分で整理します。' +
        '売り込みはしません。その場で決めていただく必要もありません。</p>' +
        "</div>" +
        '<a class="m-btn m-btn--key" href="' + (consult ? consult.getAttribute("href") : "#") +
        '">30分の無料相談</a>';
      target.parentNode.insertBefore(b, target);
    }
  }

  /* --- 3. 表：横スクロール枠 ＋ 数値列を右寄せ --------------------
     Markdownの表には列の型を書けないので、中身を見て数値列を判定する。
     判定して右寄せ＋等幅数字にすると、桁が揃って比較できるようになる。 */
  if (article) {
    var numRe = /^[¥$]?[+\-−]?[\d,.]+(%|倍|円|万円|億円|件|名|人|社|店|日|時間|か月|ヶ月|ポイント|pt)?$/;
    Array.prototype.slice.call(article.querySelectorAll("table")).forEach(function (t) {
      if (!t.parentNode.classList.contains("m-tablewrap")) {
        var wrap = document.createElement("div");
        wrap.className = "m-tablewrap";
        t.parentNode.insertBefore(wrap, t);
        wrap.appendChild(t);
      }
      var rows = Array.prototype.slice.call(t.querySelectorAll("tbody tr"));
      var cols = t.querySelectorAll("thead th").length;
      for (var c = 0; c < cols; c++) {
        var vals = 0, filled = 0;
        rows.forEach(function (r) {
          var cell = r.children[c];
          if (!cell) return;
          var s = cell.textContent.trim().replace(/\s/g, "").replace(/\*\*/g, "");
          if (!s || s === "—" || s === "-") return;
          filled++;
          if (numRe.test(s)) vals++;
        });
        // その列の8割以上が数値なら数値列とみなす
        if (filled >= 2 && vals / filled >= 0.8) {
          rows.forEach(function (r) { if (r.children[c]) r.children[c].classList.add("is-num"); });
          var th = t.querySelectorAll("thead th")[c];
          if (th) th.classList.add("is-num");
        }
      }
      // 実際にはみ出したときだけ「横にスクロールできます」を出す
      var wrapEl = t.parentNode;
      var mark = function () {
        wrapEl.setAttribute("data-scroll", t.scrollWidth > wrapEl.clientWidth + 2 ? "1" : "0");
      };
      mark();
      window.addEventListener("resize", mark);
    });
  }

  /* --- 5. 記事一覧の絞り込み ------------------------------------- */
  var filter = document.querySelector("[data-filter]");
  if (filter) {
    var cards = Array.prototype.slice.call(document.querySelectorAll("[data-tags]"));
    var count = document.querySelector("[data-filter-count]");
    var apply = function (key) {
      var n = 0;
      cards.forEach(function (card) {
        var hit = key === "all" || (card.getAttribute("data-tags") || "").split("|").indexOf(key) >= 0;
        card.style.display = hit ? "" : "none";
        if (hit) n++;
      });
      if (count) count.textContent = n + "本";
      Array.prototype.forEach.call(filter.querySelectorAll("button"), function (b) {
        b.setAttribute("aria-pressed", String(b.getAttribute("data-key") === key));
      });
    };
    filter.addEventListener("click", function (e) {
      var b = e.target.closest("button[data-key]");
      if (b) apply(b.getAttribute("data-key"));
    });
    apply("all");
  }


  /* --- 8. 計測（GA4）------------------------------------------------
     目的：チャネル別のCPL（1リードあたりの費用）を出せる状態にすること。

     ★GA4は広告費を持たない。だからここで測るのは「リード数」と「どこから来たか」だけ。
       費用との突き合わせは docs/計測の設計.md の集計表で行う。

     送るイベント
       generate_lead  … 相談/資料/メールのCTAが押された（＝リード）
       read_progress  … 25/50/75%（各1回）。記事が読まれているかの先行指標
       read_complete  … 90%到達（1回）
       outbound_click … 出典など外部リンク

     どのCTAが押されたかは data-cta / data-cta-place で分かるようにしている
     （ヘッダー・記事中段・記事末・レール・携帯の下部バー）。 */
  (function () {
    var body = document.body;
    var base = function () {
      return {
        content_group: body.getAttribute("data-cg") || "",
        article_no: body.getAttribute("data-article-no") || "",
        article_tags: body.getAttribute("data-article-tags") || ""
      };
    };
    var send = function (name, params) {
      var p = base();
      for (var k in (params || {})) p[k] = params[k];
      if (window.gtag) { window.gtag("event", name, p); }
      // gtag が無い場合も dataLayer に積む（検証で中身を確認できるようにする）
      else { (window.dataLayer = window.dataLayer || []).push(["event", name, p]); }
    };

    /* リード：CTAのクリック。1か所で拾うので、CTAを増やしても勝手に計測される */
    document.addEventListener("click", function (e) {
      var a = e.target.closest("[data-cta]");
      if (!a) return;
      send("generate_lead", {
        cta_type: a.getAttribute("data-cta"),
        cta_place: a.getAttribute("data-cta-place") || "",
        link_url: a.getAttribute("href") || ""
      });
    }, true);

    /* 外部リンク（出典）。数字の裏取りに行った人は本気度が高い */
    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href^="http"]');
      if (!a || a.hasAttribute("data-cta")) return;
      try {
        if (new URL(a.href).hostname === location.hostname) return;
      } catch (err) { return; }
      send("outbound_click", { link_url: a.href, link_domain: new URL(a.href).hostname });
    }, true);

    /* 読了の深さ。記事ページだけ */
    if (article) {
      var marks = [25, 50, 75], done = {}, completed = false;
      var onScroll = function () {
        var rect = article.getBoundingClientRect();
        var total = rect.height - window.innerHeight;
        var ratio = total > 0 ? Math.min(Math.max(-rect.top / total, 0), 1) : 0;
        var pct = ratio * 100;
        marks.forEach(function (m) {
          if (!done[m] && pct >= m) { done[m] = 1; send("read_progress", { percent: m }); }
        });
        if (!completed && pct >= 90) { completed = true; send("read_complete", { percent: 90 }); }
      };
      window.addEventListener("scroll", onScroll, { passive: true });
    }
  })();


  /* --- 9. フォームの送信（ページを移動させない）-------------------
     送信先は GAS のウェブアプリ。base.njk が body の data-form-endpoint に入れる。

     ★必須は3つ（会社名・メール・電話）。この後インサイドセールスが電話するため。
       足りないときは、その欄に印を付けて最初の1つへ移動する。
       まとめて赤くして突き放すより、どこを直せばいいか1つだけ示す方が戻ってくる。
     ★なぜ fetch の返事に頼らないか
       GAS の /exec は 302 で別ドメインへ飛ぶため、返事が読めない環境がある。
       読めたら使う、読めなくても「送った」として扱う。取りこぼすより出すほうがまし。
     ★保険として sendBeacon も撃つ。ページを閉じられても届く。
       ただし二重に届くのは困るので、fetch が成功したら撃たない。 */
  (function () {
    var forms = document.querySelectorAll("form.m-lead[data-lead]");
    if (!forms.length) return;
    var endpoint = document.body.getAttribute("data-form-endpoint") || "";

    // 電話番号：全角数字と記号を素直に受ける（人は色々な書き方をする）
    var normTel = function (v) {
      return String(v || "")
        .replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); })
        .replace(/[‐-‒–—ー―−]/g, "-")
        .replace(/[^\d+\-()\s]/g, "")
        .trim();
    };

    Array.prototype.forEach.call(forms, function (form) {
      var kind = form.getAttribute("data-lead");
      var done = form.querySelector(".m-lead__done");
      var err = form.querySelector(".m-lead__err");
      var sent = false;

      var field = function (n) { return form.querySelector('[name="' + n + '"]'); };
      var mark = function (el, bad) {
        if (!el) return;
        if (bad) { el.setAttribute("aria-invalid", "true"); }
        else { el.removeAttribute("aria-invalid"); }
      };
      // 直したらその場で印を消す（送信を押し直さずに分かるように）
      ["company", "email", "tel"].forEach(function (n) {
        var el = field(n);
        if (el) el.addEventListener("input", function () { mark(el, false); });
      });

      form.addEventListener("submit", function (e) {
        e.preventDefault();
        if (sent) return;

        var company = (field("company") || {}).value || "";
        var email = (field("email") || {}).value || "";
        var tel = normTel((field("tel") || {}).value);
        company = company.trim();
        email = email.trim();

        // 形だけ確認する。厳しくすると本物を落とす
        var bad = [];
        if (company.length < 2) bad.push("company");
        if (email.indexOf("@") < 1 || email.indexOf(".") < 0) bad.push("email");
        if (tel.replace(/\D/g, "").length < 9) bad.push("tel");
        ["company", "email", "tel"].forEach(function (n) { mark(field(n), bad.indexOf(n) >= 0); });
        if (bad.length) {
          var first = field(bad[0]);
          if (first) { first.focus(); first.scrollIntoView({ block: "center" }); }
          return;
        }

        var slots = Array.prototype.map.call(
          form.querySelectorAll('[name="slot"]:checked'), function (x) { return x.value; }
        ).join("／");
        var note = (field("note") || {}).value || "";

        var payload = {
          kind: kind,
          email: email,
          company: company,
          tel: tel,
          slot: slots,
          note: note.trim(),
          trap: (field("trap") || {}).value || "",
          article_no: document.body.getAttribute("data-article-no") || "",
          page_url: location.href,
          ref_host: (function () {
            try { return document.referrer ? new URL(document.referrer).hostname : "(direct)"; }
            catch (e2) { return "(unknown)"; }
          })(),
          ua: navigator.userAgent
        };
        var body = JSON.stringify(payload);

        form.classList.add("is-sending");
        sent = true;

        var finish = function (ok) {
          form.classList.remove("is-sending");
          if (ok) {
            form.classList.add("is-done");
            if (done) done.hidden = false;
            if (err) err.hidden = true;
          } else {
            sent = false;
            if (err) err.hidden = false;
          }
          // GA4：リードとして数える（cta_type = form-consult / form-download）
          if (window.gtag && ok) {
            window.gtag("event", "generate_lead", {
              cta_type: "form-" + kind,
              cta_place: "form",
              content_group: document.body.getAttribute("data-cg") || "",
              article_no: payload.article_no,
              article_tags: document.body.getAttribute("data-article-tags") || ""
            });
          }
        };

        if (!endpoint) { finish(false); return; }

        var beacon = function () {
          try {
            if (navigator.sendBeacon) {
              navigator.sendBeacon(endpoint, new Blob([body], { type: "text/plain;charset=UTF-8" }));
              return true;
            }
          } catch (e3) {}
          return false;
        };

        var timer = setTimeout(function () {
          // 返事が来ない環境。届いている可能性が高いので、受け付け扱いにする
          finish(true);
        }, 6000);

        // text/plain にすると事前確認（preflight）が飛ばないので、GAS でも通る
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "text/plain;charset=UTF-8" },
          body: body
        }).then(function (res) {
          return res.json().catch(function () { return { ok: true }; });
        }).then(function (r) {
          clearTimeout(timer);
          finish(!!(r && r.ok !== false));
        }).catch(function () {
          clearTimeout(timer);
          // fetch が届かなかったときだけ保険を撃つ（二重送信を避ける）
          finish(beacon());
        });
      });
    });
  })();

  /* --- 0. レイアウト計測（?measure=1 のときだけ動く開発用） -------
     携帯幅の崩れを目で判断せず数値で特定するため。本番の表示には影響しない。 */
  if (location.search.indexOf("measure=1") >= 0) {
    window.addEventListener("load", function () {
      var de = document.documentElement;
      var out = [];
      out.push("viewport=" + window.innerWidth + "x" + window.innerHeight);
      out.push("clientWidth=" + de.clientWidth + " scrollWidth=" + de.scrollWidth);
      var over = [];
      document.querySelectorAll("body *").forEach(function (el) {
        if (el.closest(".m-tablewrap, pre")) return;
        var r = el.getBoundingClientRect();
        if (r.width > 0 && Math.round(r.right) > de.clientWidth + 1) {
          over.push(el.tagName.toLowerCase() + "." +
            String(el.className || "").split(" ").filter(Boolean).slice(0, 2).join(".") +
            " right=" + Math.round(r.right));
        }
      });
      out.push("はみ出し " + over.length + "件");
      over.slice(0, 12).forEach(function (s) { out.push("  " + s); });
      var small = [];
      document.querySelectorAll(
        ".m-nav a, .m-btn, .m-faq summary, .m-toc a, .m-breadcrumb a, .m-footer a, .m-card, .m-related__item, .m-filter button"
      ).forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.height > 0 && r.height < 40) {
          small.push(el.tagName.toLowerCase() + "." +
            String(el.className || "").split(" ").filter(Boolean).slice(0, 2).join(".") +
            " h=" + Math.round(r.height));
        }
      });
      out.push("40px未満の操作部品 " + small.length + "件");
      small.slice(0, 12).forEach(function (s) { out.push("  " + s); });
      var p = document.querySelector(".m-prose p");
      if (p) out.push("本文フォント=" + getComputedStyle(p).fontSize);
      var box = document.createElement("pre");
      box.id = "measure-out";
      box.style.cssText = "position:fixed;left:0;bottom:0;z-index:9999;background:#111;color:#0f0;" +
        "font:11px/1.5 monospace;padding:8px;margin:0;max-width:100%;white-space:pre-wrap";
      box.textContent = out.join("\n");
      document.body.appendChild(box);
    });
  }
})();
