# CARASU コーポレートサイト + オウンドメディア「LUXE SOCIAL LAB」

株式会社CARASU のコーポレートサイトと、ラグジュアリー領域特化のオウンドメディア
**LUXE SOCIAL LAB（ラグジュアリー・ソーシャル研究所）** を1つのリポジトリで管理します。

- **コーポレート**：白基調モノクロ（名刺ブランド）。既存ページはそのまま。
- **メディア（/lab /column /download /audit）**：ダーク・シネマティックな別世界。
- 静的サイトジェネレータ **Eleventy(11ty)** でビルド。記事は Markdown を1つ足すだけで増やせます。

---

## 1. セットアップ & 開発

```bash
cd projects/carasu-website
npm install            # 初回のみ
npm run dev            # 開発サーバー（http://localhost:8080/carasu-website/ ）
npm run build          # 本番ビルド（_site/ を生成）
```

## 2. ディレクトリ構成

```
projects/carasu-website/
├─ eleventy.config.mjs        Eleventy設定（pathPrefix・フィルタ・コレクション）
├─ package.json
├─ src/                       ← ここが正本
│  ├─ *.html                  既存コーポレート9ページ（パススルー＝素通しで無傷配信）
│  ├─ assets/                 css（style.css=白 / media.css=メディア用ダーク）・js・img
│  ├─ _data/
│  │  ├─ site.json            サイト共通変数（★ラボ名・GA4・HubSpot・ドメイン）
│  │  └─ whitepapers.json     資料（WP）のメタデータ
│  ├─ _includes/
│  │  ├─ layouts/             base-media / article / （WP LPは download/wp.njk）
│  │  └─ components/          cta-footer / cta-inline / article-card / wp-card / lead-form
│  ├─ column/posts/*.md       ★記事（Markdown）。ここに足すだけで公開される
│  ├─ lab/ download/ audit/ privacy/   メディア各ページ
│  ├─ sitemap.njk feed.njk robots.njk  自動生成
│  └─ _site/                  ビルド出力（gitignore）
└─ README.md
```

## 3. 記事を1本追加する（非エンジニアでもOK）

`src/column/posts/` に `.md` ファイルを1つ作るだけです。冒頭の frontmatter を埋めてください。

```markdown
---
title: "記事タイトル（全角32〜42字・具体的に）"
description: "検索結果・SNSに出る説明。全角100〜120字。"
date: "2026-08-01"
category: "ナレッジ"          # ナレッジ / 事例分析 / 検証レポート / お知らせ
tags: ["ラグジュアリー", "ショート動画"]
summary: "記事の要点（TL;DR）。2〜3文。AIが引用しやすい要約。"
takeaways: ["要点1", "要点2", "要点3"]
faq:
  - q: "想定される質問1"
    a: "その回答（自己完結・60〜160字）。"
cta: "wp01"                    # wp01 / audit / contact（記事末のCTA）
readingTime: 6
thumbnail: "/assets/img/column/xxx.svg"   # 任意。無ければ自動プレースホルダ
draft: false                  # true でビルド除外
---
本文（Markdown）。## と ### の見出しから目次を自動生成します。
内部リンクは /column/other-slug/ の形で書けば自動でリンクされます。
```

保存 → `git add/commit/push`（またはデプロイ手順）で公開されます。要点ボックス・FAQ・目次・
構造化データ（BlogPosting/FAQPage/BreadcrumbList）・OGP・関連記事は**システムが自動で付与**します。

## 4. 資料（ホワイトペーパー）を追加する

`src/_data/whitepapers.json` に1件足す → 表紙画像を `assets/img/wp/` に置く →
`/download/{slug}/` の個別LP・フォームが自動生成されます。

## 5. サイト共通変数（`src/_data/site.json`）

| 項目 | 内容 | 現状 |
|---|---|---|
| `lab.name` / `lab.nameJa` | ラボ名称 | **提案段階**（要・正式決定） |
| `framework.name` | フレームワーク名 | **提案段階** |
| `ga4Id` | GA4測定ID | 空（入れると全メディアページで計測開始） |
| `hubspot.portalId` / `forms` | HubSpotフォーム | 空（入れると各LPが自動でHubSpot埋め込みに切替。空の間はメール請求フォールバックで動作） |
| `domain` | 本番ドメイン | https://carasu.jp（canonical/OGP/sitemapに使用） |

## 6. デプロイ（現状：限定公開 / noindex）

```bash
python C:/Users/umeum/carasu_ai/scripts/deploy_carasu_site.py   # build → 公開リポジトリ同期＋noindex注入
cd C:/Users/umeum/carasu-website && git add -A && git commit -m "..." && git push origin main
```

公開URL：https://sho-umeda.github.io/carasu-website/ （**noindex＝検索避け・URLを知る人だけ**）

## 7. 本番公開（carasu.jp・検索公開）への切替 ※人間の作業

1. `carasu.jp` を GitHub Pages のカスタムドメインに接続（DNS設定）
2. `eleventy.config.mjs` の `pathPrefix` を `"/"` に変更
3. `scripts/deploy_carasu_site.py` の `INJECT_NOINDEX = False`・`WRITE_CNAME = True` に変更
4. Google Search Console にドメイン登録／`carasu.jp/sitemap.xml` を送信

> ソースは常に `https://carasu.jp` 基準で書かれています。限定公開中はデプロイスクリプトが
> 全 html/xml/txt の URL を現行公開URL（github.io）へ自動書換し、noindex を注入します。
> ＝「リンク共有OK・OGPプレビュー表示／Google検索には出さない」状態。本番切替はフラグ2つだけ。

## 7.5 AIO（AI最適化）対策 ※実装済み

- **llms.txt / llms-full.txt**：AI向けサイト索引と記事全文（記事追加で自動更新）
- **robots.txt**：GPTBot / ClaudeBot / PerplexityBot / Google-Extended 等のAIクローラーを明示的に許可
- **構造化データ**：Organization（創業・代表・住所・knowsAbout）／WebSite／BlogPosting（speakable・audience・dateModified）／FAQPage（記事＋lab/consult/audit/資料LP）／DefinedTerm（「世界観ドリブン・ショート設計」の帰属明示）／BreadcrumbList／ItemList／AboutPage／ContactPage
- **記事構造**：TL;DR要約・要点・FAQ・問いの形の見出し・更新日表示
- ※noindex（限定公開）中はAI検索経由の流入は限定的。**フル効果は carasu.jp 検索公開後**

## 8. 既知の要対応・提案事項

- **ラボ名称/フレームワーク名は提案段階**（`site.json` の1箇所変更で全ページ反映）
- **記事の数字・主張は公開前に一次情報で要確認** → `docs_owned_media_factcheck.md` にリスト化済み
- OGP画像は当面SVG。SNS拡散を本格化する際はラスター(PNG)化を推奨
- 記事本文はSEO+AIO対応済み（捏造データなし・フレームワーク/公開情報ベース）
- コーポレートトップの「※数値はサンプル」実績数値は実数確定待ち
