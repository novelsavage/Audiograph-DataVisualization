# デプロイガイド

## 前提条件

1. `spotify_featuring_network.json`を`public/`フォルダに配置してください
   ```bash
   # Week08フォルダから実行
   cp spotify_featuring_network.json audiograph-network/public/
   ```

## Vercel へのデプロイ

### 方法1: Vercel CLI

```bash
# Vercel CLIのインストール
npm i -g vercel

# プロジェクトディレクトリで実行
cd audiograph-network
vercel
```

### 方法2: GitHub連携

1. GitHubにリポジトリをプッシュ
2. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス
3. "Add New Project"をクリック
4. GitHubリポジトリを選択
5. プロジェクト設定:
   - Framework Preset: Next.js
   - Root Directory: `audiograph-network` (リポジトリのルートが異なる場合)
   - Build Command: `npm run build`
   - Output Directory: `.next`
6. "Deploy"をクリック

### 環境変数

このプロジェクトは環境変数は不要です。

## GitHub Pages へのデプロイ

### 設定

1. `next.config.js`で`output: 'export'`が設定されていることを確認
2. GitHub Actionsを使用する場合、`.github/workflows/deploy.yml`を作成:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd audiograph-network
          npm install
          
      - name: Build
        run: |
          cd audiograph-network
          npm run build
          
      - name: Deploy
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./audiograph-network/out
```

### 手動デプロイ

```bash
cd audiograph-network
npm run build
# outフォルダの内容をGitHub Pagesのルートに配置
```

## Netlify へのデプロイ

1. Netlify Dashboardにアクセス
2. "Add new site" → "Import an existing project"
3. GitHubリポジトリを選択
4. ビルド設定:
   - Build command: `cd audiograph-network && npm run build`
   - Publish directory: `audiograph-network/out`
5. "Deploy site"をクリック

## トラブルシューティング

### JSONファイルが見つからない

- `public/spotify_featuring_network.json`が存在することを確認
- ファイル名が正確であることを確認（大文字小文字を含む）

### ビルドエラー

- Node.jsのバージョンが18以上であることを確認
- `npm install`を再実行
- `node_modules`と`.next`を削除して再インストール

```bash
rm -rf node_modules .next
npm install
npm run build
```

