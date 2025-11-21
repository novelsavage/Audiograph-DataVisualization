# Vercel へのデプロイ手順

## ✅ 前提条件

- GitHubリポジトリにコードがプッシュ済み
- `public/spotify_featuring_network.json`が含まれている

## 🚀 デプロイ方法

### 方法1: Vercel Web UI（推奨）

1. **Vercelにアクセス**
   - https://vercel.com にアクセス
   - GitHubアカウントでログイン

2. **プロジェクトをインポート**
   - "Add New Project" をクリック
   - GitHubリポジトリ `novelsavage/Audiograph-DataVisualization` を選択

3. **プロジェクト設定**
   - **Framework Preset**: Next.js（自動検出されるはず）
   - **Root Directory**: `audiograph-network` に設定
   - **Build Command**: `npm run build`（自動設定）
   - **Output Directory**: `.next`（自動設定）
   - **Install Command**: `npm install`（自動設定）

4. **環境変数**
   - このプロジェクトは環境変数不要です

5. **デプロイ**
   - "Deploy" をクリック
   - 数分でデプロイが完了します

6. **デプロイ後のURL**
   - デプロイ完了後、`https://your-project-name.vercel.app` でアクセス可能
   - カスタムドメインも設定可能

### 方法2: Vercel CLI

```powershell
# Vercel CLIをインストール
npm i -g vercel

# プロジェクトディレクトリに移動
cd "C:\Users\moorl\OneDrive\ドキュメント\Data-Viz\Week08\audiograph-network"

# デプロイ
vercel

# 初回はログインが必要
# その後、プロジェクト設定を確認してEnter
```

## 📝 注意事項

### Root Directoryの設定

リポジトリのルートが`audiograph-network`フォルダの場合、Vercelの設定で：
- **Root Directory**: `audiograph-network` を指定

または、リポジトリのルートを`audiograph-network`フォルダ自体にする場合は、Root Directoryは空のままにします。

### 自動デプロイ

GitHubと連携すると、`main`ブランチへのプッシュごとに自動デプロイされます。

### プレビューデプロイ

プルリクエストごとにプレビューデプロイが作成され、変更を確認できます。

## 🔧 トラブルシューティング

### ビルドエラー

- Vercelのデプロイログでエラーを確認
- ローカルで`npm run build`が成功することを確認

### JSONファイルが見つからない

- `public/spotify_featuring_network.json`がリポジトリに含まれているか確認
- `.gitignore`で除外されていないか確認

### パスの問題

- `next.config.js`の設定を確認
- `output: 'export'`はVercelでも動作しますが、通常のNext.jsデプロイの方が推奨されます

## 💡 Vercelの利点

- **自動デプロイ**: GitHubへのプッシュで自動デプロイ
- **プレビュー**: プルリクエストごとにプレビューURL生成
- **高速**: Next.jsに最適化されたCDN
- **簡単**: 設定が最小限
- **無料プラン**: 個人プロジェクトには十分



