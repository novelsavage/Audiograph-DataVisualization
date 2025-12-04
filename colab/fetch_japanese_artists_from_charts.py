"""
日本のアーティストをチャートから取得し、
フィーチャリングネットワークデータを生成するスクリプト

優先順位:
1. 週間チャート（Japan Top 50）
2. バイラルチャート（Japan Viral 50）
3. ジャンル検索 + popularity順

使用方法:
1. Spotify Developer Dashboardでアプリを作成
2. Client IDとClient Secretを取得
3. 環境変数に設定するか、.envファイルに記述
4. python scripts/fetch_japanese_artists_from_charts.py を実行
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

# APIレートリミット対策
# レート制限を避けるため、リクエスト間に最小限の待機時間を設定
# 注意: IPアドレスベースのレート制限がある場合、さらに長くする必要があります
REQUEST_DELAY = 0.2  # 0.2秒/リクエスト（1秒あたり約5リクエスト、より安全な値）
# もしレート制限に達した場合は、0.5秒以上に増やすことを推奨します

# 日本のチャートプレイリストID
# 注意: プレイリストIDは地域や時間によって変わる可能性があります
# 404エラーが出る場合は、Spotifyで直接プレイリストを検索してIDを確認してください
JAPAN_TOP_50_PLAYLIST_ID = "37i9dQZEVXbKXQ4mDTEBXq"  # Japan Top 50
JAPAN_VIRAL_50_PLAYLIST_ID = "37i9dQZEVXbINTEnbFeb8d"  # Japan Viral 50

# 代替プレイリストID（404エラー時のフォールバック）
ALTERNATIVE_PLAYLISTS = [
    "37i9dQZF1DXdbkmlag3hbc",  # Tokyo Super Hits
    "37i9dQZF1DX0XUsuxWHRQd",  # RapCaviar (日本版がある場合)
]


def get_artists_from_playlist(playlist_id: str, playlist_name: str, target_count: int, existing_artists: Set[str]) -> List[Dict]:
    """
    プレイリストからアーティストを取得
    
    Args:
        playlist_id: SpotifyプレイリストID
        playlist_name: プレイリスト名（ログ用）
        target_count: 目標アーティスト数（既存のアーティストを含む）
        existing_artists: 既に取得済みのアーティストIDのセット
    
    Returns:
        アーティスト情報のリスト
    """
    print(f"\n{playlist_name}からアーティストを取得中...")
    
    # まずプレイリストの存在確認
    try:
        # marketパラメータなしで試す（Client Credentials Flowでは不要な場合がある）
        playlist_info = sp.playlist(playlist_id)
        print(f"  プレイリスト名: {playlist_info.get('name', 'Unknown')}")
        print(f"  トラック数: {playlist_info.get('tracks', {}).get('total', 0)}")
    except SpotifyException as e:
        if e.http_status == 404:
            print(f"  警告: プレイリストが見つかりません（404エラー）")
            print(f"  プレイリストID: {playlist_id} が無効か、非公開の可能性があります")
            print(f"  注意: Client Credentials Flowでは公開プレイリストのみアクセス可能です")
            return []
        elif e.http_status == 403:
            print(f"  警告: プレイリストへのアクセスが拒否されました（403エラー）")
            print(f"  プレイリストが非公開または制限されている可能性があります")
            return []
        else:
            print(f"  エラー: {e}")
            return []
    except Exception as e:
        print(f"  予期しないエラー: {e}")
        return []
    
    artists = []
    seen_ids = existing_artists.copy()
    offset = 0
    limit = 100  # プレイリスト取得の最大値
    
    try:
        while len(artists) + len(existing_artists) < target_count:
            # プレイリストのトラックを取得
            # marketパラメータを削除して試す（地域制限がある場合）
            try:
                # まずmarketパラメータなしで試す
                results = sp.playlist_tracks(playlist_id, limit=limit, offset=offset)
            except SpotifyException as e:
                if e.http_status == 429:
                    retry_after = int(e.headers.get('Retry-After', 60))
                    print(f"  レート制限: {retry_after}秒待機...")
                    time.sleep(retry_after)
                    continue
                elif e.http_status == 404:
                    print(f"  警告: トラックが見つかりません（404エラー）")
                    break
                elif e.http_status == 403:
                    print(f"  警告: アクセスが拒否されました（403エラー）")
                    break
                print(f"  エラー: {e}")
                break
            except Exception as e:
                print(f"  予期しないエラー: {e}")
                break
            
            if not results['items']:
                break  # これ以上取得できない
            
            # トラックからアーティストを抽出
            for item in results['items']:
                if not item or not item.get('track'):
                    continue
                
                track = item['track']
                if not track or not track.get('artists'):
                    continue
                
                for artist in track['artists']:
                    if not artist or not artist.get('id'):
                        continue
                    
                    artist_id = artist['id']
                    
                    if artist_id not in seen_ids:
                        try:
                            # アーティストの詳細情報を取得
                            artist_info = sp.artist(artist_id)
                            seen_ids.add(artist_id)
                            artists.append(artist_info)
                            
                            # 目標数に達したら停止
                            if len(artists) + len(existing_artists) >= target_count:
                                break
                            
                            time.sleep(REQUEST_DELAY)  # レート制限対策
                        
                        except SpotifyException as e:
                            if e.http_status == 429:
                                retry_after = int(e.headers.get('Retry-After', 60))
                                print(f"    レート制限: {retry_after}秒待機...")
                                time.sleep(retry_after)
                                continue
                            elif e.http_status == 404:
                                # アーティストが見つからない場合はスキップ
                                continue
                            continue
                        except Exception as e:
                            continue
                
                if len(artists) + len(existing_artists) >= target_count:
                    break
            
            offset += len(results['items'])
            
            # 次のページがあるかチェック
            if len(results['items']) < limit:
                break
            
            time.sleep(REQUEST_DELAY)  # レート制限対策
        
        print(f"  ✓ {len(artists)} アーティストを取得しました")
        return artists
    
    except Exception as e:
        print(f"  エラー ({playlist_name}): {e}")
        return artists


def get_artists_from_new_releases(target_count: int, existing_artists: Set[str], market: str = 'JP', max_pages: int = 10) -> List[Dict]:
    """
    最新リリースからアーティストを取得（最新の人気音楽を反映）
    
    Args:
        target_count: 目標アーティスト数（既存のアーティストを含む）
        existing_artists: 既に取得済みのアーティストIDのセット
        market: マーケット（デフォルト: JP）
        max_pages: 取得する最大ページ数（デフォルト: 10）
    
    Returns:
        アーティスト情報のリスト（popularity順）
    """
    print(f"\n最新リリースからアーティストを取得中... (market: {market})")
    
    artists = []
    seen_ids = existing_artists.copy()
    limit = 50  # 新規リリース取得の最大値
    offset = 0
    page_count = 0
    
    try:
        while len(artists) + len(existing_artists) < target_count and page_count < max_pages:
            try:
                # 最新リリースを取得
                results = sp.new_releases(limit=limit, offset=offset, country=market)
            except SpotifyException as e:
                if e.http_status == 429:
                    retry_after = int(e.headers.get('Retry-After', 60))
                    print(f"  レート制限: {retry_after}秒待機...")
                    time.sleep(retry_after)
                    continue
                print(f"  エラー: {e}")
                break
            
            if not results.get('albums') or not results['albums'].get('items'):
                break
            
            for album in results['albums']['items']:
                if not album or not album.get('artists'):
                    continue
                
                for artist in album['artists']:
                    if not artist or not artist.get('id'):
                        continue
                    
                    artist_id = artist['id']
                    
                    if artist_id not in seen_ids:
                        try:
                            # アーティストの詳細情報を取得
                            artist_info = sp.artist(artist_id)
                            seen_ids.add(artist_id)
                            artists.append(artist_info)
                            
                            if len(artists) + len(existing_artists) >= target_count:
                                break
                            
                            if REQUEST_DELAY > 0:
                                time.sleep(REQUEST_DELAY)
                            elif REQUEST_DELAY == 0:
                                time.sleep(REQUEST_DELAY)  # レート制限対策
                        
                        except SpotifyException as e:
                            if e.http_status == 429:
                                retry_after = int(e.headers.get('Retry-After', 60))
                                print(f"    レート制限: {retry_after}秒待機...")
                                time.sleep(retry_after)
                                continue
                            continue
                        except Exception as e:
                            continue
                
                if len(artists) + len(existing_artists) >= target_count:
                    break
            
            offset += len(results['albums']['items'])
            
            if len(results['albums']['items']) < limit:
                break
            
            time.sleep(REQUEST_DELAY)  # レート制限対策
        
        # popularity順にソート
        artists.sort(key=lambda x: x.get('popularity', 0), reverse=True)
        print(f"  ✓ {len(artists)} アーティストを取得しました（最新リリース、popularity順）")
        return artists
    
    except Exception as e:
        print(f"  エラー: {e}")
        return artists


def search_japanese_artists_by_popularity(target_count: int, existing_artists: Set[str], genres: List[str] = None, max_pages_per_genre: int = 5) -> List[Dict]:
    """
    ジャンル検索でアーティストを取得し、popularity順にソート
    
    Args:
        genres: 検索するジャンルのリスト
        target_count: 目標アーティスト数（既存のアーティストを含む）
        existing_artists: 既に取得済みのアーティストIDのセット
    
    Returns:
        アーティスト情報のリスト（popularity順）
    """
    if genres is None:
        genres = [
            "j-pop", "j-rock", "j-idol", "anime",
            "japanese", "japanese pop", "japanese rock",
            "j-rap", "japanese hip hop", "japanese indie",
            "japanese alternative", "japanese electronic",
            "japanese r&b", "japanese metal", "japanese punk"
        ]
    
    print(f"\nジャンル検索でアーティストを取得中... (popularity順)")
    
    all_artists = []
    seen_ids = existing_artists.copy()
    max_limit = 50  # APIの制限
    
    for genre in genres:
        if len(all_artists) + len(existing_artists) >= target_count:
            break
        
        try:
            offset = 0
            page_count = 0
            
            while len(all_artists) + len(existing_artists) < target_count and page_count < max_pages_per_genre:
                try:
                    results = sp.search(
                        q=f'genre:"{genre}"',
                        type='artist',
                        limit=max_limit,
                        offset=offset,
                        market='JP'
                    )
                except SpotifyException as e:
                    if e.http_status == 429:
                        retry_after = int(e.headers.get('Retry-After', 60))
                        print(f"  レート制限 ({genre}): {retry_after}秒待機...")
                        time.sleep(retry_after)
                        continue
                    print(f"  エラー ({genre}): {e}")
                    break
                
                artists_in_page = results['artists']['items']
                if not artists_in_page:
                    break
                
                for artist in artists_in_page:
                    if artist['id'] not in seen_ids:
                        all_artists.append(artist)
                        seen_ids.add(artist['id'])
                        
                        if len(all_artists) + len(existing_artists) >= target_count:
                            break
                
                if len(all_artists) + len(existing_artists) >= target_count:
                    break
                
                offset += len(artists_in_page)
                page_count += 1
                
                time.sleep(REQUEST_DELAY)  # レート制限対策
            
            if len(all_artists) + len(existing_artists) >= target_count:
                break
        
        except Exception as e:
            print(f"  エラー ({genre}): {e}")
            continue
    
    # popularity順にソート
    all_artists.sort(key=lambda x: x.get('popularity', 0), reverse=True)
    
    print(f"  ✓ {len(all_artists)} アーティストを取得しました（popularity順）")
    return all_artists


def get_artist_tracks(artist_id: str, limit: int = 50) -> List[Dict]:
    """
    アーティストの楽曲を取得（既存の関数を再利用）
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
                time.sleep(REQUEST_DELAY * 0.5)  # レート制限対策
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
        batch_size = 50
        for i in range(0, len(track_ids), batch_size):
            batch = track_ids[i:i + batch_size]
            try:
                batch_tracks = sp.tracks(batch)
                tracks.extend(batch_tracks['tracks'])
                time.sleep(REQUEST_DELAY)  # レート制限対策
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


def build_network_data(
    artists: List[Dict], 
    max_artists: int = 1000,
    include_featured_artists: bool = True,
    min_tracks_per_artist: int = 100
) -> Dict:
    """
    ネットワークデータを構築（既存の関数を再利用）
    """
    print(f"\nネットワークデータを構築中... (最大 {max_artists} アーティスト)")
    print(f"  フィーチャリングアーティストも含める: {include_featured_artists}")
    
    nodes_dict: Dict[str, Dict] = {}
    edges_dict: Dict[tuple, Dict] = {}
    
    # アーティスト名からIDへのマッピングを作成
    for artist in artists[:max_artists]:
        artist_name = artist['name']
        artist_id = artist['id']
        
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
            time.sleep(REQUEST_DELAY)  # レート制限対策
            total_tracks_processed += len(tracks)
            
            for track in tracks:
                track_name = track['name']
                track_id = track['id']
                
                track_artists = [a['name'] for a in track['artists']]
                
                for featured_artist in track_artists:
                    if featured_artist == artist_name:
                        continue
                    
                    if featured_artist not in nodes_dict:
                        if include_featured_artists:
                            nodes_dict[featured_artist] = {
                                'id': featured_artist,
                                'name': featured_artist,
                                'degree': 0
                            }
                    
                    edge_key = tuple(sorted([artist_name, featured_artist]))
                    
                    if edge_key not in edges_dict:
                        edges_dict[edge_key] = {
                            'source': artist_name,
                            'target': featured_artist,
                            'weight': 0,
                            'tracks': []
                        }
                    
                    edges_dict[edge_key]['weight'] += 1
                    total_collaborations_found += 1
                    
                    track_info = {
                        'track_name': track_name,
                        'track_id': track_id,
                        'popularity': track.get('popularity', 0),
                        'genre': 'J-Pop'
                    }
                    edges_dict[edge_key]['tracks'].append(track_info)
        
        except Exception as e:
            print(f"    エラー ({artist_name}): {e}")
            continue
    
    print(f"\n  処理完了:")
    print(f"    処理した楽曲数: {total_tracks_processed}")
    print(f"    見つかったコラボレーション: {total_collaborations_found}")
    
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
            'description': 'Japanese Music Featuring Network - Generated from Spotify Charts and API'
        }
    }
    
    return network_data


def main():
    """メイン処理"""
    print("=" * 60)
    print("日本のアーティスト フィーチャリングネットワーク生成（チャート優先）")
    print("=" * 60)
    if REQUEST_DELAY > 0:
        print(f"APIレートリミット対策: {REQUEST_DELAY}秒/リクエスト")
    else:
        print("APIレートリミット対策: 429エラー発生時のみ待機（Retry-Afterヘッダーを使用）")
    
    # パラメータ設定
    TARGET_ARTIST_COUNT = 700  # 目標アーティスト数（ノード数を700に制限）
    MAX_ARTISTS_TO_PROCESS = 700  # 処理する最大アーティスト数
    MIN_TRACKS_PER_ARTIST = 100  # 各アーティストから取得する楽曲数
    
    # 最新リリースとpopularity順のアーティストを優先的に取得
    # 最新リリースから取得する目標数（全体の60%）
    NEW_RELEASES_TARGET = int(TARGET_ARTIST_COUNT * 0.6)  # 420アーティスト
    # popularity順検索から取得する目標数（全体の40%）
    POPULARITY_SEARCH_TARGET = TARGET_ARTIST_COUNT - NEW_RELEASES_TARGET  # 280アーティスト
    
    all_artists = []
    seen_ids = set()
    top50_artists = []
    viral_artists = []
    genre_artists = []
    
    # 優先順位1: 最新リリースから取得（最新の人気音楽を反映）- 目標60%
    print(f"\n[優先順位1] 最新リリースから取得を試みます... (目標: {NEW_RELEASES_TARGET}アーティスト)")
    new_releases_artists = get_artists_from_new_releases(
        NEW_RELEASES_TARGET,
        seen_ids,
        market='JP',
        max_pages=10  # より多くのページから取得
    )
    if new_releases_artists:
        all_artists.extend(new_releases_artists)
        seen_ids.update(a['id'] for a in new_releases_artists)
        print(f"  ✓ {len(new_releases_artists)} アーティスト取得")
    else:
        print(f"  ⚠ 最新リリースから取得できませんでした")
    print(f"  累計: {len(all_artists)} アーティスト")
    
    # 優先順位2: 週間チャート（Japan Top 50）
    if len(all_artists) < TARGET_ARTIST_COUNT:
        print(f"\n[優先順位2] 週間チャートから取得を試みます...")
        top50_artists = get_artists_from_playlist(
            JAPAN_TOP_50_PLAYLIST_ID,
            "週間チャート (Japan Top 50)",
            TARGET_ARTIST_COUNT,
            seen_ids
        )
        if top50_artists:
            all_artists.extend(top50_artists)
            seen_ids.update(a['id'] for a in top50_artists)
            print(f"  ✓ {len(top50_artists)} アーティスト取得")
        else:
            print(f"  ⚠ プレイリストから取得できませんでした（404エラーの可能性）")
        print(f"  累計: {len(all_artists)} アーティスト")
    
    # 優先順位3: バイラルチャート（Japan Viral 50）
    if len(all_artists) < TARGET_ARTIST_COUNT:
        print(f"\n[優先順位3] バイラルチャートから取得を試みます...")
        viral_artists = get_artists_from_playlist(
            JAPAN_VIRAL_50_PLAYLIST_ID,
            "バイラルチャート (Japan Viral 50)",
            TARGET_ARTIST_COUNT,
            seen_ids
        )
        if viral_artists:
            all_artists.extend(viral_artists)
            seen_ids.update(a['id'] for a in viral_artists)
            print(f"  ✓ {len(viral_artists)} アーティスト取得")
        else:
            print(f"  ⚠ プレイリストから取得できませんでした（404エラーの可能性）")
        print(f"  累計: {len(all_artists)} アーティスト")
    
    # 優先順位4: ジャンル検索 + popularity順（人気度で厳密にソート）- 目標40%
    genre_artists_selected = []
    if len(all_artists) < TARGET_ARTIST_COUNT:
        remaining = TARGET_ARTIST_COUNT - len(all_artists)
        # 最新リリースで目標に達していない場合、popularity順検索で補完
        popularity_target = max(remaining, POPULARITY_SEARCH_TARGET - len(all_artists) + NEW_RELEASES_TARGET)
        print(f"\n[優先順位4] ジャンル検索 (popularity順)から取得を試みます... (目標: {popularity_target}アーティスト)")
        genre_artists = search_japanese_artists_by_popularity(
            target_count=TARGET_ARTIST_COUNT,
            existing_artists=seen_ids,
            max_pages_per_genre=5  # 各ジャンルからより多くのページを取得
        )
        # 必要な分だけ追加
        genre_artists_selected = genre_artists[:remaining]
        all_artists.extend(genre_artists_selected)
        print(f"  ✓ {len(genre_artists_selected)} アーティスト取得")
        print(f"  累計: {len(all_artists)} アーティスト")
    
    if not all_artists:
        print("アーティストが見つかりませんでした。")
        return
    
    # 統計情報を計算
    genre_count = len(genre_artists_selected)
    
    # 最終的に人気度で再ソート（最新のデータを反映）
    all_artists.sort(key=lambda x: x.get('popularity', 0), reverse=True)
    
    print(f"\n{'=' * 60}")
    print(f"✓ 合計 {len(all_artists)} アーティストを取得しました（popularity順に再ソート済み）")
    print(f"{'=' * 60}")
    print(f"  最新リリース: {len(new_releases_artists)} アーティスト")
    print(f"  週間チャート: {len(top50_artists)} アーティスト")
    print(f"  バイラルチャート: {len(viral_artists)} アーティスト")
    print(f"  ジャンル検索: {genre_count} アーティスト")
    if all_artists:
        print(f"\n  最高人気度: {all_artists[0].get('popularity', 0)} ({all_artists[0].get('name', 'Unknown')})")
        print(f"  平均人気度: {sum(a.get('popularity', 0) for a in all_artists) / len(all_artists):.1f}")
    
    # ネットワークデータを構築
    network_data = build_network_data(
        all_artists,
        max_artists=MAX_ARTISTS_TO_PROCESS,
        include_featured_artists=True,
        min_tracks_per_artist=MIN_TRACKS_PER_ARTIST
    )
    
    # 結果を保存
    output_file = 'public/japanese_featuring_network.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(network_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n{'=' * 60}")
    print(f"✓ ネットワークデータを {output_file} に保存しました")
    print(f"{'=' * 60}")
    print(f"  ノード数: {network_data['metadata']['total_nodes']}")
    print(f"  エッジ数: {network_data['metadata']['total_edges']}")
    print(f"  コラボレーション数: {network_data['metadata']['total_collaborations']}")


if __name__ == '__main__':
    main()

