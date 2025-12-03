'use client'

import { useState, useMemo, useRef, useEffect } from 'react'

interface NavigationProps {
  networkData: {
    nodes: any[]
    edges: any[]
    metadata: any
  } | null
  onSearchChange?: (searchQuery: string, searchResults: string[]) => void
}

export default function Navigation({ networkData, onSearchChange }: NavigationProps) {
  const nodeCount = networkData?.metadata?.total_nodes ?? '--'
  const edgeCount = networkData?.metadata?.total_edges ?? '--'
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const searchResultsRef = useRef<HTMLDivElement>(null)

  // 検索結果を計算（アーティスト名で検索）
  const searchResults = useMemo(() => {
    if (!searchQuery.trim() || !networkData?.nodes) {
      return []
    }

    const query = searchQuery.toLowerCase().trim()
    const matches = networkData.nodes
      .filter((node) => node.name?.toLowerCase().includes(query))
      .map((node) => node.name)
      .slice(0, 10) // 最大10件まで表示

    return matches
  }, [searchQuery, networkData])

  // 検索クエリが変更されたときに親コンポーネントに通知
  useEffect(() => {
    if (onSearchChange) {
      onSearchChange(searchQuery, searchResults)
    }
  }, [searchQuery, searchResults, onSearchChange])

  // 検索結果のクリック処理
  const handleResultClick = (artistName: string) => {
    setSearchQuery(artistName)
    setIsSearchFocused(false)
    if (searchInputRef.current) {
      searchInputRef.current.blur()
    }
  }

  // 外部クリックでドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchResultsRef.current &&
        !searchResultsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setIsSearchFocused(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  return (
    <nav className="fixed w-full z-40 top-0 left-0 border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
          <span className="text-lg font-bold tracking-tight font-mono">
            AUDIOGRAPH
          </span>
        </div>
        <div className="flex-1 overflow-hidden ml-8">
          <div className="flex whitespace-nowrap animate-marquee gap-8 items-center text-xs font-mono text-gray-400">
            {/* First set */}
            <span className="flex items-center gap-2">
              <span className="text-green-500">●</span> LIVE_NETWORK
            </span>
            <span>///</span>
            <span>DATASET: SpotifyFeatures.csv</span>
            <span>///</span>
            <span>
              NODES: <span className="dynamic-node-count">{nodeCount}</span>
            </span>
            <span>///</span>
            <span>
              EDGES: <span className="dynamic-edge-count">{edgeCount}</span>
            </span>
            <span>///</span>
            <span>ALGORITHM: FORCE_DIRECTED</span>
            <span>///</span>
            <span className="flex items-center gap-2">
              <span className="text-green-500">●</span> INTERACTIVE_MODE
            </span>
            <span>///</span>
            <span>DATASET: SpotifyFeatures.csv</span>
            <span>///</span>
            <span>
              NODES: <span className="dynamic-node-count">{nodeCount}</span>
            </span>
            <span>///</span>
            <span>
              EDGES: <span className="dynamic-edge-count">{edgeCount}</span>
            </span>
            {/* Duplicate for seamless loop */}
            <span className="flex items-center gap-2">
              <span className="text-green-500">●</span> LIVE_NETWORK
            </span>
            <span>///</span>
            <span>DATASET: SpotifyFeatures.csv</span>
            <span>///</span>
            <span>
              NODES: <span className="dynamic-node-count">{nodeCount}</span>
            </span>
            <span>///</span>
            <span>
              EDGES: <span className="dynamic-edge-count">{edgeCount}</span>
            </span>
            <span>///</span>
            <span>ALGORITHM: FORCE_DIRECTED</span>
            <span>///</span>
            <span className="flex items-center gap-2">
              <span className="text-green-500">●</span> INTERACTIVE_MODE
            </span>
            <span>///</span>
            <span>DATASET: SpotifyFeatures.csv</span>
            <span>///</span>
            <span>
              NODES: <span className="dynamic-node-count">{nodeCount}</span>
            </span>
            <span>///</span>
            <span>
              EDGES: <span className="dynamic-edge-count">{edgeCount}</span>
            </span>
          </div>
        </div>
        {/* 検索バー */}
        <div className="relative ml-4">
          <div className="relative">
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              placeholder="SEARCH ARTIST..."
              className="w-64 px-4 py-2 bg-black/60 border border-white/20 rounded font-mono text-xs text-white placeholder-gray-500 focus:outline-none focus:border-green-500 focus:ring-1 focus:ring-green-500 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('')
                  setIsSearchFocused(false)
                  if (searchInputRef.current) {
                    searchInputRef.current.focus()
                  }
                }}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
              >
                ✕
              </button>
            )}
          </div>
          {/* 検索結果ドロップダウン */}
          {isSearchFocused && searchQuery.trim() && (
            <div
              ref={searchResultsRef}
              className="absolute top-full right-0 mt-2 w-64 max-h-80 overflow-y-auto bg-black/95 border border-white/20 rounded font-mono text-xs backdrop-blur-md z-50"
            >
              {searchResults.length > 0 ? (
                <div className="py-2">
                  {searchResults.map((artistName, index) => (
                    <button
                      key={index}
                      onClick={() => handleResultClick(artistName)}
                      className="w-full text-left px-4 py-2 hover:bg-white/10 hover:text-green-500 transition-colors text-gray-300"
                    >
                      {artistName}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="px-4 py-2 text-gray-500">
                  No results found
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}

