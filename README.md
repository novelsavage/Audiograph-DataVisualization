# AUDIOGRAPH - Spotify Featuring Network Visualization

モダンなNext.jsアプリケーションで実装された、Spotifyアーティスト間のフィーチャリングネットワーク可視化ツールです。

## 特徴

- 🎨 **モダンなUI**: ターミナル風のダークテーマデザイン
- 🎯 **インタラクティブ**: D3.jsによるフォース指向グラフ可視化
- 📊 **リアルタイム**: ノードのドラッグ&ドロップ、ホバー効果
- 🚀 **高速**: Next.js 14 App Routerによる最適化
- 📱 **レスポンシブ**: モバイル・デスクトップ対応

## 技術スタック

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Visualization**: D3.js v7
- **Fonts**: Inter, JetBrains Mono

## セットアップ

### 必要な環境

- Node.js 18以上
- npm または yarn

### インストール

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いて確認できます。

### ビルド

```bash
# プロダクションビルド
npm run build

# ビルド結果の確認
npm start
```

## デプロイ

### Vercel

1. GitHubにリポジトリをプッシュ
2. [Vercel](https://vercel.com)にログイン
3. "New Project"をクリック
4. リポジトリを選択
5. デプロイ設定は自動検出されます

### GitHub Pages

1. `next.config.js`で`output: 'export'`が設定されていることを確認
2. ビルドを実行: `npm run build`
3. `out`フォルダの内容をGitHub Pagesにデプロイ

```bash
# GitHub Pages用の設定
npm run build
# outフォルダをGitHub Pagesのルートに配置
```

## プロジェクト構造

```
audiograph-network/
├── app/
│   ├── layout.tsx          # ルートレイアウト
│   ├── page.tsx             # メインページ
│   └── globals.css          # グローバルスタイル
├── components/
│   ├── LoadingScreen.tsx     # ローディング画面（ASCIIアート）
│   ├── Navigation.tsx       # ナビゲーションバー
│   ├── NetworkVisualization.tsx  # D3.jsネットワーク可視化
│   ├── FeatureStrip.tsx     # 上部情報バー
│   ├── StatsBox.tsx         # 統計情報ボックス
│   └── TerminalOutput.tsx  # ターミナル出力
├── public/
│   └── spotify_featuring_network.json  # ネットワークデータ
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── next.config.js
```

## データ形式

`public/spotify_featuring_network.json`は以下の構造を持ちます:

```json
{
  "nodes": [
    {
      "id": "Artist Name",
      "name": "Artist Name",
      "degree": 10
    }
  ],
  "edges": [
    {
      "source": "Main Artist",
      "target": "Featured Artist",
      "weight": 5,
      "tracks": [
        {
          "track_name": "Song Title",
          "track_id": "spotify_id",
          "popularity": 75,
          "genre": "Pop"
        }
      ]
    }
  ],
  "metadata": {
    "total_nodes": 525,
    "total_edges": 500,
    "total_collaborations": 3119
  }
}
```

詳細は `README_spotify_featuring_network.md` を参照してください。

## 機能

### インタラクション

- **ノードのドラッグ**: ノードをクリック&ドラッグしてネットワークの形状を変更
- **ホバー効果**: ノードにマウスオーバーすると、関連するエッジがハイライト表示
- **楽曲情報表示**: ホバー時にコラボレーション楽曲名を表示

### ビジュアル要素

- **ローディング画面**: ASCIIアートによるアニメーション
- **スキャンライン効果**: CRTモニター風の視覚効果
- **グリッチエフェクト**: ホバー時のテキストアニメーション
- **ターミナル出力**: リアルタイムログ表示

## カスタマイズ

### 色の変更

`tailwind.config.ts`でカラーパレットを変更できます:

```typescript
colors: {
  bg: '#050505',
  'terminal-green': '#00ff41',
  // ...
}
```

### フォースパラメータの調整

`components/NetworkVisualization.tsx`でD3.jsのフォースパラメータを調整:

```typescript
.force('charge', d3.forceManyBody().strength(-400)) // 反発力
.force('link', d3.forceLink().distance(120))        // エッジの距離
```

## ライセンス

このプロジェクトは教育・研究目的で使用することを想定しています。

## 関連ファイル

- `README_spotify_featuring_network.md`: データセットの詳細説明
- `spotify_featuring_network.json`: ネットワークデータ
- `spotify_featuring_network.ipynb`: データ生成ノートブック

