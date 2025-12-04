"""
日本のアーティストのSpotifyデータを取得し、
フィーチャリングネットワークデータを生成するスクリプト

使用方法:
1. Spotify Developer Dashboardでアプリを作成
2. Client IDとClient Secretを取得
3. 環境変数に設定するか、.envファイルに記述
4. python scripts/fetch_japanese_artists.py を実行
"""

import os
import json
import time
from collections import defaultdict
from typing import Dict, List, Set, Optional
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from spotipy.exceptions import SpotifyException
from dotenv import load_dotenv

# .envファイルから環境変数を読み込む
load_dotenv()

# Spotify API認証情報
CLIENT_ID = os.getenv('SPOTIFY_CLIENT_ID')
CLIENT_SECRET = os.getenv('SPOTIFY_CLIENT_SECRET')

if not CLIENT_ID or not CLIENT_SECRET:
    raise ValueError(
        "SPOTIFY_CLIENT_ID と SPOTIFY_CLIENT_SECRET を環境変数または.envファイルに設定してください"
    )

# Spotify APIクライアントの初期化
sp = spotipy.Spotify(client_credentials_manager=SpotifyClientCredentials(
    client_id=CLIENT_ID,
    client_secret=CLIENT_SECRET
))

# APIレートリミット対策: リクエスト間の待機時間（秒）
# 0に設定すると、429エラーが発生した場合にのみRetry-Afterヘッダーに従って待機します
# これにより、レート制限に達していない場合は高速に処理できます
REQUEST_DELAY = 0.0  # 429エラー発生時のみ待機（より効率的）


def search_japanese_artists(genres: List[str] = None, limit_per_genre: int = 50, max_pages: int = 3) -> List[Dict]:
    """
    日本のアーティストを検索する
    
    Args:
        genres: 検索するジャンルのリスト（デフォルト: j-pop, j-rock, j-idol, anime）
        limit_per_genre: 各ジャンルから取得するアーティスト数（最大50、APIの制限）
    
    Returns:
        アーティスト情報のリスト
    """
    if genres is None:
        # より多くのジャンルを追加して、より多くのアーティストを取得
        genres = [
            "j-pop", "j-rock", "j-idol", "anime",
            "japanese", "japanese pop", "japanese rock",
            "j-rap", "japanese hip hop", "japanese indie",
            "japanese alternative", "japanese electronic",
            "japanese r&b", "japanese metal", "japanese punk"
        ]
    
    # Spotify APIのsearchエンドポイントのlimit最大値は50
    max_limit = 50
    if limit_per_genre > max_limit:
        print(f"警告: limit_per_genreが{max_limit}を超えています。{max_limit}に制限します。")
        limit_per_genre = max_limit
    
    all_artists = []
    seen_ids = set()
    
    print(f"日本のアーティストを検索中... (ジャンル: {', '.join(genres)})")
    
    for genre in genres:
        try:
            # ページネーションで複数回取得（必要に応じて）
            offset = 0
            total_fetched = 0
            page_limit = min(limit_per_genre, max_limit)  # 1ページあたりの取得数
            page_count = 0
            
            while total_fetched < limit_per_genre and page_count < max_pages:
                # ジャンルで検索
                results = sp.search(
                    q=f'genre:"{genre}"',
                    type='artist',
                    limit=page_limit,
                    offset=offset,
                    market='JP'
                )
                
                artists_in_page = results['artists']['items']
                if not artists_in_page:
                    break  # これ以上取得できない
                
                for artist in artists_in_page:
                    if artist['id'] not in seen_ids:
                        all_artists.append(artist)
                        seen_ids.add(artist['id'])
                
                total_fetched += len(artists_in_page)
                offset += len(artists_in_page)
                page_count += 1
                
                # 次のページがあるかチェック
                if len(artists_in_page) < page_limit or total_fetched >= limit_per_genre:
                    break
                
                if REQUEST_DELAY > 0:
                    time.sleep(REQUEST_DELAY)
                elif REQUEST_DELAY == 0:
                    # 429エラーを避けるため、最小限の待機（0.05秒）
                    time.sleep(0.05)
            
            print(f"  {genre}: {total_fetched} アーティストを取得")
            if REQUEST_DELAY > 0:
                time.sleep(REQUEST_DELAY)
            
        except SpotifyException as e:
            if e.http_status == 429:  # Rate limit exceeded
                retry_after = int(e.headers.get('Retry-After', 60))
                print(f"  レート制限に達しました。{retry_after}秒待機します...")
                time.sleep(retry_after)
                continue
            print(f"  エラー ({genre}): {e}")
            continue
        except Exception as e:
            print(f"  エラー ({genre}): {e}")
            continue
    
    print(f"合計 {len(all_artists)} ユニークなアーティストを取得しました")
    return all_artists


def get_artist_tracks(artist_id: str, limit: int = 50) -> List[Dict]:
    """
    アーティストの楽曲を取得
    
    Args:
        artist_id: SpotifyアーティストID
        limit: 取得する楽曲数
    
    Returns:
        楽曲情報のリスト
    """
    try:
        albums = sp.artist_albums(artist_id, album_type='album,single', limit=50)
        track_ids = []
        
        for album in albums['items']:
            try:
                album_tracks = sp.album_tracks(album['id'])
                for track in album_tracks['items']:
                    if track['id']:
                        track_ids.append(track['id'])
                    if len(track_ids) >= limit:
                        break
                if len(track_ids) >= limit:
                    break
                if REQUEST_DELAY > 0:
                    time.sleep(REQUEST_DELAY * 0.5)  # アルバム取得時の待機（オプション）
            except SpotifyException as e:
                if e.http_status == 429:
                    retry_after = int(e.headers.get('Retry-After', 60))
                    print(f"    レート制限: {retry_after}秒待機...")
                    time.sleep(retry_after)
                    continue
                continue
        
        if not track_ids:
            return []
        
        # 楽曲の詳細情報を取得（バッチ処理）
        tracks = []
        batch_size = 50  # Spotify APIの最大バッチサイズ
        for i in range(0, len(track_ids), batch_size):
            batch = track_ids[i:i + batch_size]
            try:
                batch_tracks = sp.tracks(batch)
                tracks.extend(batch_tracks['tracks'])
                if REQUEST_DELAY > 0:
                    time.sleep(REQUEST_DELAY)
            except SpotifyException as e:
                if e.http_status == 429:
                    retry_after = int(e.headers.get('Retry-After', 60))
                    print(f"    レート制限: {retry_after}秒待機...")
                    time.sleep(retry_after)
                    continue
                continue
        
        return tracks[:limit]
        
    except SpotifyException as e:
        if e.http_status == 429:
            retry_after = int(e.headers.get('Retry-After', 60))
            print(f"  レート制限 (アーティスト {artist_id}): {retry_after}秒待機...")
            time.sleep(retry_after)
            return []
        print(f"  エラー (アーティスト {artist_id}): {e}")
        return []
    except Exception as e:
        print(f"  エラー (アーティスト {artist_id}): {e}")
        return []


def find_artists_with_featurings(artists: List[Dict], min_tracks: int = 5, max_artists: int = 300) -> List[Dict]:
    """
    フィーチャリングがあるアーティストを特定する
    
    Args:
        artists: アーティスト情報のリスト
        min_tracks: 最低限必要な楽曲数
        max_artists: 処理する最大アーティスト数
    
    Returns:
        フィーチャリングがあるアーティストのリスト
    """
    print(f"\nフィーチャリングがあるアーティストを探索中... (最大 {max_artists} アーティスト)")
    
    artists_with_featurings = []
    processed = 0
    
    for artist in artists[:max_artists]:
        artist_id = artist['id']
        artist_name = artist['name']
        processed += 1
        
        if processed % 20 == 0:
            print(f"  探索中: {processed}/{min(len(artists), max_artists)}")
        
        try:
            tracks = get_artist_tracks(artist_id, limit=30)
            if REQUEST_DELAY > 0:
                time.sleep(REQUEST_DELAY)
            
            # フィーチャリングがある楽曲をカウント
            featuring_count = 0
            for track in tracks:
                track_artists = [a['name'] for a in track['artists']]
                if len(track_artists) > 1:  # 複数のアーティストが参加している
                    featuring_count += 1
            
            # フィーチャリングがあるアーティストを追加
            if featuring_count >= min_tracks:
                artists_with_featurings.append(artist)
                print(f"    ✓ {artist_name}: {featuring_count}曲にフィーチャリングあり")
            
        except Exception as e:
            print(f"    エラー ({artist_name}): {e}")
            continue
    
    print(f"\n✓ {len(artists_with_featurings)} アーティストにフィーチャリングが見つかりました")
    return artists_with_featurings


def build_network_data(
    artists: List[Dict], 
    max_artists: int = 200,
    include_featured_artists: bool = True,
    min_tracks_per_artist: int = 30
) -> Dict:
    """
    ネットワークデータを構築
    
    Args:
        artists: アーティスト情報のリスト
        max_artists: 処理する最大アーティスト数
        include_featured_artists: フィーチャリングアーティストもノードに追加するか
        min_tracks_per_artist: 各アーティストから取得する最小楽曲数
    
    Returns:
        ネットワークデータ（JSON形式）
    """
    print(f"\nネットワークデータを構築中... (最大 {max_artists} アーティスト)")
    print(f"  フィーチャリングアーティストも含める: {include_featured_artists}")
    
    # ノードとエッジの準備
    nodes_dict: Dict[str, Dict] = {}
    edges_dict: Dict[tuple, Dict] = {}
    artist_name_to_id: Dict[str, str] = {}
    featured_artists_to_fetch: Set[str] = set()  # 後で検索するフィーチャリングアーティスト
    
    # アーティスト名からIDへのマッピングを作成
    for artist in artists[:max_artists]:
        artist_name = artist['name']
        artist_id = artist['id']
        artist_name_to_id[artist_name] = artist_id
        
        # ノードを追加
        if artist_name not in nodes_dict:
            nodes_dict[artist_name] = {
                'id': artist_name,
                'name': artist_name,
                'degree': 0
            }
    
    # 各アーティストの楽曲を処理
    processed = 0
    total_tracks_processed = 0
    total_collaborations_found = 0
    
    for artist in artists[:max_artists]:
        artist_name = artist['name']
        artist_id = artist['id']
        processed += 1
        
        if processed % 10 == 0:
            print(f"  処理中: {processed}/{min(len(artists), max_artists)} "
                  f"(エッジ: {len(edges_dict)}, ノード: {len(nodes_dict)})")
        
        try:
            tracks = get_artist_tracks(artist_id, limit=min_tracks_per_artist)
            if REQUEST_DELAY > 0:
                time.sleep(REQUEST_DELAY)
            total_tracks_processed += len(tracks)
            
            for track in tracks:
                track_name = track['name']
                track_id = track['id']
                
                # 楽曲のアーティスト情報を取得
                track_artists = [a['name'] for a in track['artists']]
                
                # メインアーティスト以外をフィーチャリングアーティストとして扱う
                for featured_artist in track_artists:
                    if featured_artist == artist_name:
                        continue
                    
                    # フィーチャリングアーティストがノードに存在しない場合
                    if featured_artist not in nodes_dict:
                        if include_featured_artists:
                            # ノードに追加
                            nodes_dict[featured_artist] = {
                                'id': featured_artist,
                                'name': featured_artist,
                                'degree': 0
                            }
                            # 後でアーティスト情報を取得するために記録
                            featured_artists_to_fetch.add(featured_artist)
                    
                    # エッジのキー（順序を正規化）
                    edge_key = tuple(sorted([artist_name, featured_artist]))
                    
                    if edge_key not in edges_dict:
                        edges_dict[edge_key] = {
                            'source': artist_name,
                            'target': featured_artist,
                            'weight': 0,
                            'tracks': []
                        }
                    
                    # エッジの重みを増加
                    edges_dict[edge_key]['weight'] += 1
                    total_collaborations_found += 1
                    
                    # 楽曲情報を追加
                    track_info = {
                        'track_name': track_name,
                        'track_id': track_id,
                        'popularity': track.get('popularity', 0),
                        'genre': 'J-Pop'  # デフォルト値、後で改善可能
                    }
                    edges_dict[edge_key]['tracks'].append(track_info)
        
        except Exception as e:
            print(f"    エラー ({artist_name}): {e}")
            continue
    
    print(f"\n  処理完了:")
    print(f"    処理した楽曲数: {total_tracks_processed}")
    print(f"    見つかったコラボレーション: {total_collaborations_found}")
    print(f"    追加されたフィーチャリングアーティスト: {len(featured_artists_to_fetch)}")
    
    # ノードの次数を計算
    for edge in edges_dict.values():
        source = edge['source']
        target = edge['target']
        if source in nodes_dict:
            nodes_dict[source]['degree'] += edge['weight']
        if target in nodes_dict:
            nodes_dict[target]['degree'] += edge['weight']
    
    # エッジをリストに変換（重みでソート）
    edges = list(edges_dict.values())
    edges.sort(key=lambda x: x['weight'], reverse=True)
    
    # ノードをリストに変換（次数でソート）
    nodes = list(nodes_dict.values())
    nodes.sort(key=lambda x: x['degree'], reverse=True)
    
    # メタデータを計算
    total_collaborations = sum(edge['weight'] for edge in edges)
    
    network_data = {
        'nodes': nodes,
        'edges': edges,
        'metadata': {
            'total_nodes': len(nodes),
            'total_edges': len(edges),
            'total_collaborations': total_collaborations,
            'description': 'Japanese Music Featuring Network - Generated from Spotify API'
        }
    }
    
    return network_data


def main():
    """メイン処理"""
    print("=" * 60)
    print("日本のアーティスト フィーチャリングネットワーク生成")
    print("=" * 60)
    if REQUEST_DELAY > 0:
        print(f"APIレートリミット対策: {REQUEST_DELAY}秒/リクエスト")
    else:
        print("APIレートリミット対策: 429エラー発生時のみ待機（Retry-Afterヘッダーを使用）")
    
    # パラメータ設定（チャート上位1000人を目指す）
    # 目標: ノード1000以上、エッジ500以上、コラボレーション3000以上
    # 注意: Spotify APIのsearchエンドポイントのlimit最大値は50
    # ページネーションで各ジャンルから最大50×複数ページ取得
    SEARCH_LIMIT_PER_GENRE = 50  # 各ジャンルから取得するアーティスト数（APIの最大値、ページネーションで増やす）
    MAX_ARTISTS_TO_PROCESS = 1000  # 処理する最大アーティスト数（チャート上位1000人を目指す）
    MIN_TRACKS_PER_ARTIST = 100  # 各アーティストから取得する楽曲数（より多くのコラボレーションを発見）
    FILTER_BY_FEATURINGS = False  # フィルタリングを無効化して、より多くのアーティストを処理
    
    # 1. 日本のアーティストを検索（より多くのジャンルから取得）
    artists = search_japanese_artists(limit_per_genre=SEARCH_LIMIT_PER_GENRE)
    
    # 人気度でソートして、上位アーティストを優先
    artists.sort(key=lambda x: x.get('popularity', 0), reverse=True)
    print(f"人気度順にソートしました（最高: {artists[0].get('popularity', 0) if artists else 0}）")
    
    if not artists:
        print("アーティストが見つかりませんでした。")
        return
    
    # 2. フィーチャリングがあるアーティストでフィルタリング（オプション）
    if FILTER_BY_FEATURINGS:
        # より多くのアーティストを探索
        artists = find_artists_with_featurings(artists, min_tracks=5, max_artists=MAX_ARTISTS_TO_PROCESS * 2)
        if not artists:
            print("フィーチャリングがあるアーティストが見つかりませんでした。")
            return
    else:
        # フィルタリングしない場合、上位1000人をそのまま使用
        artists = artists[:MAX_ARTISTS_TO_PROCESS]
        print(f"上位{len(artists)}アーティストを処理対象に設定しました")
    
    # 3. ネットワークデータを構築
    network_data = build_network_data(
        artists, 
        max_artists=MAX_ARTISTS_TO_PROCESS,
        include_featured_artists=True,  # フィーチャリングアーティストもノードに追加
        min_tracks_per_artist=MIN_TRACKS_PER_ARTIST
    )
    
    # 4. 結果を保存
    output_file = 'public/japanese_featuring_network.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(network_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'=' * 60}")
    print(f"✓ ネットワークデータを {output_file} に保存しました")
    print(f"{'=' * 60}")
    print(f"  ノード数: {network_data['metadata']['total_nodes']}")
    print(f"  エッジ数: {network_data['metadata']['total_edges']}")
    print(f"  コラボレーション数: {network_data['metadata']['total_collaborations']}")
    # 処理時間の見積もり
    # デフォルトのジャンル数を計算
    default_genres_count = 15  # j-pop, j-rock, j-idol, anime, japanese, japanese pop, japanese rock, j-rap, japanese hip hop, japanese indie, japanese alternative, japanese electronic, japanese r&b, japanese metal, japanese punk
    search_requests = default_genres_count * 2  # 各ジャンルから複数ページ取得
    if FILTER_BY_FEATURINGS:
        estimated_requests = (
            search_requests +  # 検索
            (MAX_ARTISTS_TO_PROCESS * 2 * 6) +  # フィルタリング（各アーティスト6リクエスト）
            (MAX_ARTISTS_TO_PROCESS * 6)  # ネットワーク構築（各アーティスト6リクエスト）
        )
    else:
        estimated_requests = (
            search_requests +  # 検索
            (MAX_ARTISTS_TO_PROCESS * 6)  # ネットワーク構築（各アーティスト6リクエスト）
        )
    if REQUEST_DELAY > 0:
        estimated_time_minutes = (estimated_requests * REQUEST_DELAY) / 60
        print(f"\n  処理時間の目安: 約 {estimated_time_minutes:.1f} 分（REQUEST_DELAY考慮）")
    else:
        print(f"\n  処理時間の目安: 429エラーが発生しない場合、数分〜十数分程度")
    print(f"  見積もりリクエスト数: 約 {estimated_requests:,} リクエスト")


if __name__ == '__main__':
    main()
