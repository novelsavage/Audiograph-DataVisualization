# 日本のアーティストデータ取得スクリプト

このディレクトリには、Spotify APIを使用して日本のアーティストのフィーチャリングネットワークデータを取得するスクリプトが含まれています。

## セットアップ

### 1. Spotify Developer Accountの作成

1. [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)にアクセス
2. Spotifyアカウントでログイン
3. "Create an app"をクリック
4. アプリ名と説明を入力して作成
5. Client IDとClient Secretをコピー

### 2. 環境変数の設定

プロジェクトルートに`.env`ファイルを作成し、以下の内容を記述：

```
SPOTIFY_CLIENT_ID=your_client_id_here
SPOTIFY_CLIENT_SECRET=your_client_secret_here
```

**注意**: `.env`ファイルは`.gitignore`に追加することを推奨します。

### 3. 依存パッケージのインストール

```bash
pip install -r scripts/requirements.txt
```

または、conda環境を使用する場合：

```bash
conda activate base  # または適切な環境
pip install -r scripts/requirements.txt
```

## 使用方法

### 基本的な使用方法

```bash
python scripts/fetch_japanese_artists.py
```

### カスタマイズ

スクリプト内の以下のパラメータを変更できます：

- `search_japanese_artists()`の`genres`パラメータ: 検索するジャンル
- `search_japanese_artists()`の`limit`パラメータ: 各ジャンルから取得するアーティスト数
- `build_network_data()`の`max_artists`パラメータ: 処理する最大アーティスト数

## 出力

スクリプトは`public/japanese_featuring_network.json`にネットワークデータを保存します。

このファイルは、既存の`spotify_featuring_network.json`と同じ形式で、プロジェクトの可視化コンポーネントでそのまま使用できます。

## 注意事項

- Spotify APIにはレート制限があります（通常、1秒あたり数リクエスト）
- スクリプトには適切な待機時間が設定されていますが、大量のデータを取得する場合は調整が必要な場合があります
- 取得したデータの利用は、Spotifyの利用規約に従ってください
- 個人情報や著作権に関する情報は適切に扱ってください

## トラブルシューティング

### 認証エラー

- Client IDとClient Secretが正しく設定されているか確認
- `.env`ファイルがプロジェクトルートにあるか確認

### レート制限エラー

- スクリプト内の`time.sleep()`の値を増やす
- 処理するアーティスト数を減らす（`max_artists`パラメータ）

### データが少ない

- `limit`パラメータを増やす
- 検索するジャンルを追加する
- より多くのアーティストを処理する（`max_artists`パラメータ）

