# GitHub Pages デプロイ - 次のステップ

## ✅ 完了した作業

- コードをGitHubにプッシュ済み
- GitHub Actionsワークフロー（`.github/workflows/deploy.yml`）を作成済み

## 📋 残りの手順

### 1. GitHub Pagesを有効化

1. GitHubリポジトリにアクセス：
   https://github.com/novelsavage/Audiograph-DataVisualization

2. **Settings** タブをクリック

3. 左サイドバーから **Pages** を選択

4. **Source** セクションで：
   - **Source** を **GitHub Actions** に変更
   - **Save** をクリック

### 2. デプロイの確認

1. **Actions** タブをクリック
2. "Deploy to GitHub Pages" ワークフローが実行されていることを確認
3. デプロイが完了すると（通常2-3分）、以下のURLでアクセス可能：
   ```
   https://novelsavage.github.io/Audiograph-DataVisualization/
   ```

### 3. デプロイが失敗する場合

- **Actions** タブでエラーログを確認
- よくある原因：
  - `public/spotify_featuring_network.json`が見つからない
  - ビルドエラー
  - 権限の問題

## 🔧 ローカル開発について

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

3. ブラウザのキャッシュをクリア（Ctrl+Shift+R または Ctrl+F5）

## 📝 注意事項

- 初回デプロイには数分かかる場合があります
- デプロイ後、URLが反映されるまで数分かかる場合があります
- ブランチ名が`main`でない場合、`.github/workflows/deploy.yml`の`branches`を修正してください



