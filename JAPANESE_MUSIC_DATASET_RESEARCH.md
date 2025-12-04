# 日本の音楽データセット リサーチ結果

このドキュメントは、audiograph-networkプロジェクトで使用可能な日本の音楽データセットのリサーチ結果をまとめたものです。

## プロジェクトの要件

現在のプロジェクトは、Spotifyのアーティスト間のフィーチャリングネットワークを可視化しています。データ形式は以下の通り：

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

## リサーチ結果

### 1. 直接利用可能なデータセット（コラボレーションネットワーク）

**現状**: 日本のアーティスト間のコラボレーションネットワークを直接提供するオープンデータセットは見つかりませんでした。

### 2. 推奨アプローチ

#### アプローチA: Spotify Web APIを使用したデータ取得（推奨）

**概要**: Spotify Web APIを使用して、日本のアーティストのフィーチャリング情報を直接取得する方法です。

**メリット**:
- 現在のプロジェクトと同じデータソース（Spotify）を使用
- リアルタイムのデータを取得可能
- データ形式が既存のプロジェクトと完全に互換性がある
- 人気度、ジャンルなどのメタデータも取得可能

**必要な情報**:
- Spotify Developer Account（無料）
- Client ID と Client Secret
- Python または Node.js でのスクリプト作成

**実装手順**:
1. Spotify Developer Dashboardでアプリを作成
2. `spotipy` (Python) または `spotify-web-api-node` (Node.js) を使用
3. 日本のアーティストを検索（例: "genre:j-pop", "genre:j-rock"）
4. 各アーティストの楽曲からフィーチャリング情報を抽出
5. ネットワークデータ形式に整形

**参考リソース**:
- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [Spotipy Python Library](https://spotipy.readthedocs.io/)
- [Spotify Web API Node.js Library](https://github.com/thelinmichael/spotify-web-api-node)

#### アプローチB: 既存データセットからの抽出

**利用可能なデータセット**:

1. **FMA (Free Music Archive) データセット**
   - 106,574曲を含む大規模データセット
   - Creative Commonsライセンス
   - 日本の楽曲も含まれる可能性あり
   - ただし、アーティスト情報の詳細度は低い
   - [論文](https://arxiv.org/abs/1612.01840)

2. **DALIデータセット**
   - 5,358曲の音声トラックと歌詞情報
   - 日本の楽曲も含まれる可能性あり
   - ただし、コラボレーション情報は含まれていない
   - [論文](https://arxiv.org/abs/1906.10606)

3. **Melon Playlist Dataset**
   - 韓国のストリーミングサービスMelonから収集
   - 649,091曲、148,826プレイリスト
   - 日本の楽曲も含まれる可能性あり
   - [論文](https://arxiv.org/abs/2102.00201)

**注意点**: これらのデータセットは主に音楽分析用であり、アーティスト間のコラボレーション情報は含まれていません。

#### アプローチC: 手動データ収集 + スクレイピング

**概要**: 日本の音楽チャートや音楽データベースから情報を収集する方法です。

**データソース候補**:
- Oricon Chart（オリコンチャート）
- Billboard Japan
- レコチョク
- Apple Music Japan Charts
- Spotify Japan Charts

**注意点**:
- 利用規約の確認が必要
- スクレイピングの法的問題に注意
- データ整形に時間がかかる

### 3. 日本の音楽データセット（参考）

以下のデータセットは、コラボレーションネットワークには直接使用できませんが、参考として記載します：

1. **Microtonal Music Dataset**
   - 駒澤大学の平井研究室が提供
   - 100曲の微分音楽
   - WAV、MIDI、CSVファイルを含む
   - [URL](https://www.komazawa-u.ac.jp/~thirai/MicrotonalMusicDataset/index-j.html)

2. **日本コロムビアの純邦楽100曲**
   - 伝統音楽（雅楽、能楽など）100曲
   - コラボレーションネットワークには不向き

3. **大村典子"日本のうた"ファミリー連弾集**
   - 童謡やポップスのヒット曲
   - 楽譜データ中心

## 推奨実装方法

### 最推奨: Spotify Web APIを使用したデータ取得

以下のPythonスクリプトの例を参考に、日本のアーティストのデータを取得できます：

```python
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import json

# Spotify API認証情報を設定
client_id = "YOUR_CLIENT_ID"
client_secret = "YOUR_CLIENT_SECRET"

sp = spotipy.Spotify(client_credentials_manager=SpotifyClientCredentials(
    client_id=client_id, 
    client_secret=client_secret
))

# 日本のアーティストを検索
japanese_artists = []
genres = ["j-pop", "j-rock", "j-idol", "anime"]

for genre in genres:
    results = sp.search(q=f'genre:"{genre}"', type='artist', limit=50)
    japanese_artists.extend(results['artists']['items'])

# 各アーティストの楽曲からフィーチャリング情報を抽出
# ... (詳細な実装が必要)
```

### データ整形スクリプト

既存のデータセットから取得した情報を、プロジェクトのデータ形式に整形するスクリプトも作成可能です。

## 実装済みスクリプト

このプロジェクトには、日本のアーティストデータを取得するスクリプトが含まれています：

- **`scripts/fetch_japanese_artists.py`**: Spotify APIを使用して日本のアーティストのフィーチャリングネットワークデータを取得
- **`scripts/requirements.txt`**: 必要なPythonパッケージ
- **`scripts/README.md`**: スクリプトの使用方法

詳細は`scripts/README.md`を参照してください。

## 次のステップ

1. **Spotify Developer Accountの作成**
   - [Spotify Developer Dashboard](https://developer.spotify.com/dashboard)にアクセス
   - アプリを作成してClient IDとSecretを取得

2. **環境変数の設定**
   - プロジェクトルートに`.env`ファイルを作成
   - `SPOTIFY_CLIENT_ID`と`SPOTIFY_CLIENT_SECRET`を設定

3. **スクリプトの実行**
   ```bash
   pip install -r scripts/requirements.txt
   python scripts/fetch_japanese_artists.py
   ```

4. **データの検証**
   - 取得したデータが正しい形式か確認
   - 既存の可視化コンポーネントでテスト

## 参考リンク

- [Spotify Web API Documentation](https://developer.spotify.com/documentation/web-api)
- [Spotipy Documentation](https://spotipy.readthedocs.io/)
- [Spotify Web API Console](https://developer.spotify.com/console/)

## 注意事項

- Spotify APIの利用には利用規約の遵守が必要です
- レート制限に注意してください（通常、1秒あたり数リクエスト）
- 取得したデータの利用目的を確認してください
- 個人情報や著作権に関する情報は適切に扱ってください

