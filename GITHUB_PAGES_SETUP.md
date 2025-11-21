# GitHub Pages デプロイ手順

## 前提条件

✅ ビルドは成功しています
✅ `spotify_featuring_network.json`は`public/`フォルダに配置済み
✅ GitHub Actionsワークフロー（`.github/workflows/deploy.yml`）を作成済み

## デプロイ手順

### 1. GitHubリポジトリの準備

1. GitHubで新しいリポジトリを作成（または既存のリポジトリを使用）

2. リポジトリの設定でGitHub Pagesを有効化：
   - Settings → Pages
   - Source: **GitHub Actions** を選択

### 2. コードをプッシュ

```powershell
# プロジェクトディレクトリに移動
cd "C:\Users\moorl\OneDrive\ドキュメント\Data-Viz\Week08\audiograph-network"

# Gitリポジトリを初期化（まだの場合）
git init

# ファイルを追加
git add .

# コミット
git commit -m "Initial commit: Audiograph Network Visualization"

# リモートリポジトリを追加（your-username/your-repo-nameを実際の値に置き換え）
git remote add origin https://github.com/your-username/your-repo-name.git

# プッシュ
git push -u origin main
```

### 3. 自動デプロイ

コードをプッシュすると、GitHub Actionsが自動的に：
1. ビルドを実行
2. `out/`フォルダをGitHub Pagesにデプロイ

### 4. デプロイの確認

- GitHubリポジトリの **Actions** タブでデプロイの進行状況を確認
- デプロイが完了すると、`https://your-username.github.io/your-repo-name/` でアクセス可能

## ローカル開発について

`output: 'export'`の設定は**ビルド時のみ**影響します。開発モード（`npm run dev`）では通常通り動作します。

もし開発モードで問題が発生する場合：

1. 開発サーバーを再起動
   ```powershell
   # サーバーを停止（Ctrl+C）
   # 再度起動
   npm run dev
   ```

2. キャッシュをクリア
   ```powershell
   Remove-Item -Recurse -Force .next
   npm run dev
   ```

## トラブルシューティング

### デプロイが失敗する場合

- GitHub Actionsのログを確認
- `public/spotify_featuring_network.json`が存在することを確認
- ビルドがローカルで成功することを確認

### 404エラーが表示される場合

- `next.config.js`で`trailingSlash: true`が設定されていることを確認
- GitHub Pagesの設定でSourceが**GitHub Actions**になっていることを確認



