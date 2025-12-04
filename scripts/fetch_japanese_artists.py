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
from typing import Dict, List, Set
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
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


def search_japanese_artists(genres: List[str] = None, limit: int = 50) -> List[Dict]:
    """
    日本のアーティストを検索する
    
    Args:
        genres: 検索するジャンルのリスト（デフォルト: j-pop, j-rock, j-idol, anime）
        limit: 各ジャンルから取得するアーティスト数
    
    Returns:
        アーティスト情報のリスト
    """
    if genres is None:
        genres = ["j-pop", "j-rock", "j-idol", "anime"]
    
    all_artists = []
    seen_ids = set()
    
    print(f"日本のアーティストを検索中... (ジャンル: {', '.join(genres)})")
    
    for genre in genres:
        try:
            # ジャンルで検索
            results = sp.search(
                q=f'genre:"{genre}"',
                type='artist',
                limit=limit,
                market='JP'
            )
            
            for artist in results['artists']['items']:
                if artist['id'] not in seen_ids:
                    all_artists.append(artist)
                    seen_ids.add(artist['id'])
            
            print(f"  {genre}: {len(results['artists']['items'])} アーティストを取得")
            time.sleep(0.5)  # レート制限対策
            
        except Exception as e:
            print(f"  エラー ({genre}): {e}")
            continue
    
    print(f"合計 {len(all_artists)} ユニークなアーティストを取得しました")
    return all_artists


def extract_featuring_info(track_name: str) -> List[str]:
    """
    楽曲名からフィーチャリングアーティストを抽出
    
    Args:
        track_name: 楽曲名
    
    Returns:
        フィーチャリングアーティスト名のリスト
    """
    featuring_artists = []
    
    # 一般的なフィーチャリング表記を検出
    patterns = [
        r'feat\.\s*([^)]+)',
        r'featuring\s+([^)]+)',
        r'ft\.\s*([^)]+)',
        r'×\s*([^×]+)',  # 日本の音楽でよく使われる
        r'w/\s*([^)]+)',  # with
    ]
    
    import re
    for pattern in patterns:
        matches = re.findall(pattern, track_name, re.IGNORECASE)
        for match in matches:
            # 複数のアーティストが含まれる場合を分割
            artists = [a.strip() for a in match.split(',')]
            artists = [a.strip() for artist in artists for a in artist.split('&')]
            featuring_artists.extend(artists)
    
    return featuring_artists


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
            album_tracks = sp.album_tracks(album['id'])
            for track in album_tracks['items']:
                if track['id']:
                    track_ids.append(track['id'])
                if len(track_ids) >= limit:
                    break
            if len(track_ids) >= limit:
                break
        
        if not track_ids:
            return []
        
        # 楽曲の詳細情報を取得
        tracks = sp.tracks(track_ids[:limit])
        return tracks['tracks']
        
    except Exception as e:
        print(f"  エラー (アーティスト {artist_id}): {e}")
        return []


def build_network_data(artists: List[Dict], max_artists: int = 200) -> Dict:
    """
    ネットワークデータを構築
    
    Args:
        artists: アーティスト情報のリスト
        max_artists: 処理する最大アーティスト数
    
    Returns:
        ネットワークデータ（JSON形式）
    """
    print(f"\nネットワークデータを構築中... (最大 {max_artists} アーティスト)")
    
    # ノードとエッジの準備
    nodes_dict: Dict[str, Dict] = {}
    edges_dict: Dict[tuple, Dict] = {}
    artist_name_to_id: Dict[str, str] = {}
    
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
    for artist in artists[:max_artists]:
        artist_name = artist['name']
        artist_id = artist['id']
        processed += 1
        
        if processed % 10 == 0:
            print(f"  処理中: {processed}/{min(len(artists), max_artists)}")
        
        tracks = get_artist_tracks(artist_id, limit=20)
        time.sleep(0.2)  # レート制限対策
        
        for track in tracks:
            track_name = track['name']
            track_id = track['id']
            
            # 楽曲のアーティスト情報を取得
            track_artists = [a['name'] for a in track['artists']]
            
            # メインアーティスト以外をフィーチャリングアーティストとして扱う
            for featured_artist in track_artists:
                if featured_artist == artist_name:
                    continue
                
                # フィーチャリングアーティストがノードに存在する場合のみエッジを追加
                if featured_artist in nodes_dict:
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
                    
                    # 楽曲情報を追加
                    track_info = {
                        'track_name': track_name,
                        'track_id': track_id,
                        'popularity': track.get('popularity', 0),
                        'genre': 'J-Pop'  # デフォルト値、後で改善可能
                    }
                    edges_dict[edge_key]['tracks'].append(track_info)
    
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
    
    # ノードをリストに変換
    nodes = list(nodes_dict.values())
    
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
    
    # 1. 日本のアーティストを検索
    artists = search_japanese_artists(limit=50)
    
    if not artists:
        print("アーティストが見つかりませんでした。")
        return
    
    # 2. ネットワークデータを構築
    network_data = build_network_data(artists, max_artists=100)
    
    # 3. 結果を保存
    output_file = 'public/japanese_featuring_network.json'
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(network_data, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ ネットワークデータを {output_file} に保存しました")
    print(f"  ノード数: {network_data['metadata']['total_nodes']}")
    print(f"  エッジ数: {network_data['metadata']['total_edges']}")
    print(f"  コラボレーション数: {network_data['metadata']['total_collaborations']}")


if __name__ == '__main__':
    main()

