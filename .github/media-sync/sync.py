"""RECRUITIVE Mag（carasu.jp/media/）を ChatGPT 側の最新版に合わせる。

メンバーは ChatGPT でメディアを作り、ChatGPT のホスティングに公開している。
このスクリプトはその公開版を丸ごと取り込み、carasu.jp 向けに整えて media/ を置き換える。
GitHub Actions（.github/workflows/media-sync.yml）が1時間ごとに実行する。

整えること（2026-09-28 取締役判断）
  1. 配信側（Cloudflare）が各HTMLに差し込むスクリプトを外す
  2. 画像を長辺1600pxの JPEG にして軽くする（PNGのままだと1枚2MB）
  3. noindex を外して検索に出す。記事が3本未満のタグページだけ noindex,follow
  4. rules.json の置き換え（事実確認が取れない記述を伏せる）
  5. rules.json の block に書いた言葉が1つでも残っていたら、公開しない（終了コード1）

止めること（公開せずに終了コード1。GitHub が失敗をメールで知らせる）
  - 取り込みで1つでも読めないファイルがあった（途中までの版で本番を上書きしない）
  - ページ数が今の本番より2割以上減った（取り損ねを「記事が消えた」と取り違えない）
  - block の言葉が残っていた

使い方: python sync.py <公開リポジトリのルート>
"""
import glob
import html as htmllib
import io
import json
import os
import re
import shutil
import sys
import tempfile
import urllib.parse
import urllib.request

from PIL import Image

BASE = "https://carasu-owned-media-preview.carasu-inc-9130.chatgpt.site"
START = "/media/"
SITE = "https://carasu.jp"
HERE = os.path.dirname(os.path.abspath(__file__))
UA = {"User-Agent": "Mozilla/5.0 (compatible; carasu-media-sync/1.0; +https://carasu.jp/)"}

CF_SCRIPT = re.compile(r"<script>\(function\(\)\{function c\(\).*?</script>", re.S)
REF = re.compile(
    r'''(?:href|src)=["']([^"']+)["']'''
    r'''|srcset=["']([^"']+)["']'''
    r'''|url\(["']?([^)"']+)["']?\)'''
    r'''|<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']'''
)
ROBOTS_META = re.compile(r'<meta name="robots" content="[^"]*">')
MIN_ARTICLES_FOR_TOPIC_INDEX = 3
SHRINK_LIMIT = 0.8


def fail(msg):
    print("::error::" + msg)
    sys.exit(1)


def fetch(path):
    url = BASE + urllib.parse.quote(path)
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read(), r.headers.get("Content-Type", "")


def local_refs(page_path, text):
    out = []
    for groups in REF.findall(text):
        for raw in groups:
            if not raw:
                continue
            for part in raw.split(","):
                u = part.strip().split(" ")[0]
                if not u or u.startswith(("data:", "mailto:", "tel:", "#", "javascript:")):
                    continue
                if u.startswith(("http:", "https:")):
                    if not u.startswith(BASE):
                        # canonical・og:image は carasu.jp を指している。中身は ChatGPT 側から取る
                        if u.startswith(SITE + START):
                            u = u[len(SITE):]
                        else:
                            continue
                    else:
                        u = u[len(BASE):]
                elif not u.startswith("/"):
                    u = urllib.parse.urljoin(page_path, u)
                u = u.split("#")[0].split("?")[0]
                if u.startswith(START):
                    out.append(u)
    return out


def crawl(out_dir):
    """/media/ 配下を全部取る。1つでも読めなければ止める。"""
    seen, queue, errors = set(), [START], []
    while queue:
        p = queue.pop(0)
        if p in seen:
            continue
        seen.add(p)
        try:
            data, ctype = fetch(p)
        except Exception as e:  # noqa: BLE001
            errors.append(f"{p}: {e}")
            continue
        local = p + "index.html" if p.endswith("/") else p
        fp = os.path.join(out_dir, local.lstrip("/"))
        os.makedirs(os.path.dirname(fp), exist_ok=True)
        with open(fp, "wb") as f:
            f.write(data)
        if "html" in ctype or "css" in ctype or p.endswith(("/", ".html", ".css")):
            queue.extend(local_refs(p, data.decode("utf-8", "ignore")))
    if errors:
        fail("取り込みで読めないファイルがありました。本番は変えていません:\n" + "\n".join(errors[:20]))
    return os.path.join(out_dir, START.strip("/"))


def shrink_images(media):
    renamed = {}
    for f in glob.glob(os.path.join(media, "assets", "images", "*")):
        name = os.path.basename(f)
        if not name.lower().endswith((".png", ".jpg", ".jpeg")):
            continue
        im = Image.open(f)
        if im.mode in ("RGBA", "LA", "P") and "transparency" in im.info or im.mode in ("RGBA", "LA"):
            continue  # 透過のあるロゴ・アイコンはそのまま
        if im.width <= 1000 and os.path.getsize(f) < 300_000:
            continue  # 小さい画像はそのまま
        im = im.convert("RGB")
        if im.width > 1600:
            im = im.resize((1600, round(im.height * 1600 / im.width)), Image.LANCZOS)
        new = os.path.splitext(name)[0] + ".jpg"
        buf = io.BytesIO()
        im.save(buf, "JPEG", quality=82, optimize=True, progressive=True)
        if new != name:
            os.remove(f)
            renamed[name] = new
        with open(os.path.join(os.path.dirname(f), new), "wb") as w:
            w.write(buf.getvalue())
    return renamed


def text_files(media):
    for pat in ("**/*.html", "**/*.css", "**/*.js"):
        yield from glob.glob(os.path.join(media, pat), recursive=True)


def rel(media, f):
    return os.path.relpath(f, media).replace(os.sep, "/")


def apply_rules(media, rules):
    warnings = []
    for rule in rules.get("replace", []):
        targets = [f for f in glob.glob(os.path.join(media, rule["page"]), recursive=True)]
        hit = 0
        for f in targets:
            t = open(f, encoding="utf-8").read()
            if rule.get("start"):
                a = t.find(rule["start"])
                b = t.find(rule["end"], a + 1) if a >= 0 else -1
                if a >= 0 and b > a:
                    t = t[:a] + rule["new"] + t[b:]
                    hit += 1
            elif rule["old"] in t:
                hit += t.count(rule["old"])
                t = t.replace(rule["old"], rule["new"])
            open(f, "w", encoding="utf-8", newline="").write(t)
        if hit == 0:
            warnings.append(f"置き換え先が見つからない（ChatGPT側で文面が変わった可能性）: {rule.get('note', '')}")
    return warnings


def count_article_links(t):
    return len(set(re.findall(r'href="/media/articles/([^"/]+)/"', t)))


def tidy(media, renamed, rules):
    for junk in ("robots.txt", "sitemap.xml"):
        p = os.path.join(media, junk)
        if os.path.exists(p):
            os.remove(p)
    for f in text_files(media):
        t = open(f, encoding="utf-8").read()
        t = CF_SCRIPT.sub("", t)
        for a, b in renamed.items():
            t = t.replace("/" + a, "/" + b)
        if f.endswith(".html"):
            t = ROBOTS_META.sub("", t)
            r = rel(media, f)
            if r.startswith("topics/") and count_article_links(t) < MIN_ARTICLES_FOR_TOPIC_INDEX:
                t = t.replace("<head>", '<head>\n<meta name="robots" content="noindex,follow">', 1)
        open(f, "w", encoding="utf-8", newline="").write(t)
    return apply_rules(media, rules)


def check_blocked(media, rules):
    found = []
    for f in text_files(media):
        t = open(f, encoding="utf-8").read()
        for word in rules.get("block", []):
            if word in t:
                found.append(f"{rel(media, f)}: 「{word}」")
    return found


def page_date(t):
    m = re.search(r'"dateModified":"(\d{4}-\d{2}-\d{2})', t) or re.search(r'"datePublished":"(\d{4}-\d{2}-\d{2})', t)
    return m.group(1) if m else None


def sitemap_lines(media):
    """検索に出すページだけを載せる（noindex のタグページは載せない）。"""
    rows, dates = [], []
    for f in sorted(glob.glob(os.path.join(media, "**", "index.html"), recursive=True)):
        t = open(f, encoding="utf-8").read()
        if 'content="noindex' in t:
            continue
        r = rel(media, f)[: -len("index.html")]
        d = page_date(t) if r.startswith("articles/") and r != "articles/" else None
        if d:
            dates.append(d)
        rows.append((r, d))
    latest = max(dates) if dates else None
    out = []
    for r, d in rows:
        d = d or latest
        lm = f"<lastmod>{d}</lastmod>" if d else ""
        out.append(f"  <url><loc>{SITE}{START}{r}</loc>{lm}</url>")
    return out


def update_sitemap(repo, lines):
    p = os.path.join(repo, "sitemap.xml")
    t = open(p, encoding="utf-8").read()
    kept = [ln for ln in t.splitlines() if SITE + START not in ln]
    t = "\n".join(kept)
    t = t.replace("</urlset>", "\n".join(lines) + "\n</urlset>")
    open(p, "w", encoding="utf-8", newline="").write(t.rstrip("\n") + "\n")


def html_count(d):
    return len(glob.glob(os.path.join(d, "**", "*.html"), recursive=True)) if os.path.isdir(d) else 0


def main():
    repo = os.path.abspath(sys.argv[1] if len(sys.argv) > 1 else ".")
    rules = json.load(open(os.path.join(HERE, "rules.json"), encoding="utf-8"))
    work = tempfile.mkdtemp(prefix="media-sync-")
    media = crawl(work)
    if not os.path.exists(os.path.join(media, "index.html")):
        fail("トップページが取れませんでした。本番は変えていません")

    renamed = shrink_images(media)
    warnings = tidy(media, renamed, rules)
    for w in warnings:
        print("::warning::" + w)

    blocked = check_blocked(media, rules)
    if blocked:
        fail("公開しない言葉が残っています。本番は変えていません（rules.json を直すか、ChatGPT側で記事を直してください）:\n"
             + "\n".join(blocked))

    dst = os.path.join(repo, "media")
    before, after = html_count(dst), html_count(media)
    if before and after < before * SHRINK_LIMIT:
        fail(f"ページ数が {before} → {after} に減りました。取り損ねの可能性があるので本番は変えていません")

    if os.path.isdir(dst):
        shutil.rmtree(dst)
    shutil.copytree(media, dst)
    update_sitemap(repo, sitemap_lines(dst))
    shutil.rmtree(work, ignore_errors=True)
    print(f"media/ を最新版にしました（HTML {before} → {after} ページ）")


if __name__ == "__main__":
    main()
