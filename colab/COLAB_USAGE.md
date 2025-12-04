# Google Colabでの使用方法

## スクリプトファイルについて

**スクリプトファイル**: `fetch_japanese_artists_from_charts.py`

このファイルは以下の場所にあります：
- `colab/fetch_japanese_artists_from_charts.py` （このリポジトリ内）
- `scripts/fetch_japanese_artists_from_charts.py` （元のスクリプト）

## Colabでのアップロード方法

### 方法1: 手動でアップロード（推奨）

1. **ファイルを準備**
   - ローカルマシンで `colab/fetch_japanese_artists_from_charts.py` を開く
   - または、GitHubから直接ダウンロード

2. **Colabでアップロード**
   - Google Colabでノートブックを開く
   - 左側のファイルブラウザ（📁アイコン）を開く
   - 「ファイルをアップロード」ボタンをクリック
   - `fetch_japanese_artists_from_charts.py` を選択してアップロード
   - **アップロード先**: Colabの作業ディレクトリ（`/content/`）に自動的に配置されます

3. **ノートブックで実行**
   - ノートブックの「方法2: アップロードしたファイルを実行する場合」のセルを実行

### 方法2: GitHubから直接取得

1. **GitHubのraw URLを取得**
   - GitHubで `colab/fetch_japanese_artists_from_charts.py` を開く
   - 「Raw」ボタンをクリック
   - URLをコピー（例: `https://raw.githubusercontent.com/your-username/your-repo/main/colab/fetch_japanese_artists_from_charts.py`）

2. **ノートブックで実行**
   - ノートブックの「方法1: GitHubからスクリプトを取得して実行」のセルでURLを設定
   - セルを実行

### 方法3: ノートブック内で直接アップロード

ノートブックの「方法1: 手動でファイルをアップロードする場合」のセルを実行すると、ファイルアップロードダイアログが表示されます。

## ファイルの配置場所

Colabでは、アップロードしたファイルは自動的に `/content/` ディレクトリに配置されます。

- アップロードしたファイル: `/content/fetch_japanese_artists_from_charts.py`
- 生成される結果ファイル: `/content/japanese_featuring_network.json`

## トラブルシューティング

### ファイルが見つからないエラー

- ファイルが正しくアップロードされているか確認
- ファイル名が `fetch_japanese_artists_from_charts.py` であることを確認
- Colabのファイルブラウザでファイルの存在を確認

### GitHubからの取得に失敗する場合

- URLが正しいか確認（raw URLである必要があります）
- リポジトリが公開されているか確認
- ファイルパスが正しいか確認（`colab/fetch_japanese_artists_from_charts.py`）

