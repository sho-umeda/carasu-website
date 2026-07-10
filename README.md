# carasu inc. — コーポレートサイト雛形

映像制作に強いクリエイティブスタジオ **carasu** の新コーポレートサイトの雛形です。
「今後50億・100億と成長しても、銀行・社外・社内から信頼される」ことを狙い、
**ダーク基調のシック**な世界観（黒 × オフホワイト × シャンパンゴールド）で構築しています。

参考にしたサイトの型：nahato（信頼×B2Bのシック）、CHOCOLATE（映像主役）、GO（大胆なタイポ）。

---

## 1. ディレクトリ構成

```
carasu-website/
├─ index.html          トップページ
├─ works.html          制作実績 一覧（カテゴリ絞り込み付き）
├─ work-detail.html    制作実績 詳細（1件テンプレ）
├─ news.html           カラスニュース 一覧（SEO記事用・絞り込み付き）
├─ news-article.html   カラスニュース 記事（1件テンプレ・目次/構造化データ入り）
├─ recruit.html        採用情報（(a)経営理念=PMVV ＋ (b)採用詳細）
├─ about.html          会社概要
├─ contact.html        お問い合わせ（フォーム雛形）
├─ sitemap.xml         SEO用サイトマップ（雛形）
├─ robots.txt          クローラ向け設定（雛形）
├─ README.md           このファイル
└─ assets/
   ├─ css/style.css    デザインシステム（色・書体・全コンポーネント）
   └─ js/main.js       共通の動き（メニュー・スクロール演出・絞り込み 等）
```

## 2. ローカルでの見かた

依存ライブラリはありません。簡易サーバーで開くだけです（書体はネット接続時に読み込まれます）。

```bash
# このフォルダで
python -m http.server 5500
# → ブラウザで http://localhost:5500/ を開く
```

> ※ファイルを直接ダブルクリック（file://）でも表示できますが、
> 一部ブラウザで動きが制限されるため、上記のローカルサーバー推奨です。

---

## 3. デザインの考え方（触る前に）

- **色・余白・角丸などは、ほぼすべて `assets/css/style.css` 冒頭の `:root` 変数**にまとまっています。
  ここを書き換えると全ページに反映されます。
  - 差し色を変える → `--accent`（現在はシャンパンゴールド `#c6a35b`）
  - 背景の黒み → `--bg`
  - 文字色 → `--fg` / `--fg-2`（補助） / `--fg-3`（控えめ）
- **書体**：英・数字＝Manrope、和文＝Noto Sans JP、見出しの品格用＝Noto Serif JP（明朝）。
- **動き**：スクロールで要素がフェードイン（`data-reveal` を付けた要素）。

---

## 4. よくある編集

### 🎬 ヒーローに動画を入れる
`index.html` の `<section class="hero">` 内、`<div class="hero-media">` にある
コメントアウトされた `<video>` を有効化し、`assets/video/showreel.mp4` を置いてください。
`poster` に静止画を指定すると、読み込み前の見栄えが良くなります。

### 🖼 プレースホルダ画像を実物に差し替える
グレーのグラデ枠（`<div class="ph ph-1" ...>`）が仮画像です。
`<img src="assets/img/xxx.jpg" alt="...">` に置き換えてください（枠のサイズは自動）。

### 🗂 制作実績を増やす
1. **一覧**：`works.html` の `.work-card`（`<a>…</a>`）を1件コピーして内容を変更。
   - `data-cat` に該当カテゴリ（`film` / `branding` / `web` / `sns`）を半角スペース区切りで指定すると絞り込みに反映。
2. **詳細**：`work-detail.html` を複製（例：`work-brandmovie.html`）し、
   `<title>` / OGP / 本文を変更。一覧カードの `href` をそのファイル名に。

### 📝 カラスニュース（記事）を書き溜める
1. **一覧**：`news.html` の `.news-item` を1件コピーし、日付・カテゴリ・タイトルを変更。
   - `data-cat` は `news`（お知らせ）/ `case`（実績紹介）/ `knowledge`（ナレッジ）/ `interview`（インタビュー）。
2. **記事**：`news-article.html` を複製（例：`news-20260701.html`）し、
   - `<title>`・`<meta name="description">`・OGP を記事内容に更新（**SEOで重要**）。
   - ページ上部の **`<script type="application/ld+json">`（構造化データ）** の headline / datePublished 等も更新。
   - 本文（`.prose`）と目次（`.toc`）を編集。見出し `<h2 id="sX">` と目次リンク `href="#sX"` を対応させる。

### 👥 採用情報を編集
`recruit.html`。
- **経営理念**は社内PMVVを反映済み（Purpose/Mission/Vision/Value・カルチャー）。文言変更は該当箇所を直接編集。
- **募集職種**は `.job-card` を複製/削除で増減。
- **募集要項** `spec-table` は雛形です。確定条件に差し替えてください（`※要確認`/`※一例` の注記を外す）。

### 🏢 会社情報を更新
`about.html` の `info-table`。`準備中` の項目（設立・代表者・資本金・所在地）を埋めてください。
沿革（`history`）は `※サンプル` を実データに差し替え。

### ✉️ お問い合わせフォームを"実際に送れる"ように
`contact.html` の `<form>` は現在ダミー（送信されません）。
Googleフォーム / formrun / 自社API などの送信先に接続してください。
（ページ末尾の簡易バリデーション用 `<script>` は接続後に差し替え可）

---

## 5. SEO まわり
- 各ページに `<title>` / `meta description` / `canonical` / OGP を設定済み。ページ複製時は必ず内容を更新。
- 記事ページには構造化データ（`BlogPosting`）の雛形入り。
- `sitemap.xml` / `robots.txt` はドメイン確定後にURLを実値へ更新。
- 独自ドメイン公開時は、`https://carasu.jp/` 部分を実URLに合わせてください。

## 6. 未確定・要確認（雛形のまま残している箇所）
- 会社情報（設立・代表者・資本金・所在地）… `about.html`：**準備中**
- 沿革の年月・内容 … `about.html`：**※サンプル**
- 実績の具体内容・クライアント名・数値 … `works.html` / `work-detail.html`：**Sample / ※数値はサンプル**
- 募集要項の具体条件 … `recruit.html`：**※要確認 / ※一例**
- SNS・プライバシーポリシー等のリンク先 … 各ページ `href="#"`
- ロゴ・favicon・OGP画像 … 仮のものを設定（`assets/img/` に正式版を配置して差し替え）

## 7. 今後の拡張（提案）
- 実績・記事が増えたら **CMS化**（microCMS / WordPress 等）で運用を効率化。
- 実写真・実映像の投入で世界観がさらに向上。
- ライトモード対応、多言語（EN）対応も同じ変数設計の上で拡張可能。

---
*Designed & built as a starting template. ここから自由に育ててください。*
