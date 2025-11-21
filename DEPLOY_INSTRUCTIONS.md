# デプロイ手順

## 前提条件

✅ `spotify_featuring_network.json`は既に`public/`フォルダに配置済みです
✅ ビルドは成功しています（`out/`フォルダが生成されています）

## 方法1: Vercel（推奨・最も簡単）

### Vercel CLIを使用する場合

1. Vercel CLIをインストール（まだの場合）
   ```bash
   npm i -g vercel
   ```

2. プロジェクトディレクトリでログイン
   ```bash
   cd audiograph-network
   vercel login
   ```

3. デプロイ
   ```bash
   vercel
   ```
   
   初回は以下の質問に答えます：
   - Set up and deploy? **Yes**
   - Which scope? **自分のアカウントを選択**
   - Link to existing project? **No**
   - Project name? **audiograph-network**（または任意の名前）
   - Directory? **./**（そのままEnter）
   - Override settings? **No**

4. デプロイが完了すると、URLが表示されます（例：`https://audiograph-network.vercel.app`）

### GitHub連携を使用する場合

1. GitHubにリポジトリをプッシュ
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. [Vercel Dashboard](https://vercel.com/dashboard)にアクセス

3. "Add New Project"をクリック

4. GitHubリポジトリを選択

5. プロジェクト設定：
   - Framework Preset: **Next.js**（自動検出されるはず）
   - Root Directory: **audiograph-network**（リポジトリのルートが異なる場合）
   - Build Command: `npm run build`（自動設定されるはず）
   - Output Directory: `.next`（自動設定されるはず）

6. "Deploy"をクリック

7. デプロイが完了すると、URLが表示されます

## 方法2: GitHub Pages

### GitHub Actionsを使用（推奨）

1. `.github/workflows/deploy.yml`ファイルを作成：

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
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
          
      - name: Setup Pages
        uses: actions/configure-pages@v4
          
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './audiograph-network/out'
          
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

2. GitHubリポジトリの設定：
   - Settings → Pages
   - Source: **GitHub Actions**

3. コードをプッシュすると自動的にデプロイされます

### 手動デプロイ

1. ビルドを実行（既に完了）
   ```bash
   cd audiograph-network
   npm run build
   ```

2. `out/`フォルダの内容をGitHub Pagesのルートに配置

## 方法3: Netlify

1. [Netlify Dashboard](https://app.netlify.com/)にアクセス

2. "Add new site" → "Import an existing project"

3. GitHubリポジトリを選択

4. ビルド設定：
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

### デプロイ後の404エラー
- `next.config.js`で`output: 'export'`が設定されていることを確認
- `trailingSlash: true`が設定されていることを確認



