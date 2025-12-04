'use client'

import { useState, useEffect } from 'react'
import LoadingScreen from '@/components/LoadingScreen'
import Navigation from '@/components/Navigation'
import NetworkVisualization from '@/components/NetworkVisualization'
import TerminalOutput from '@/components/TerminalOutput'
import StatsBox from '@/components/StatsBox'
import ControlPanel, {
  NetworkParams,
} from '@/components/ControlPanel'
import ArtistHighlight from '@/components/ArtistHighlight'
import Link from 'next/link'

const DEFAULT_PARAMS: NetworkParams = {
  linkDistance: 50,
  chargeStrength: 1,
  centerStrength: 1,
  collisionRadius: 1.5,
  nodeSizeMultiplier: 2.0,
  maxNodes: 700,
  maxEdges: 500,
}

type DatasetType = 'international' | 'japanese'

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [datasetType, setDatasetType] = useState<DatasetType>('international')
  const [networkData, setNetworkData] = useState<{
    nodes: any[]
    edges: any[]
    metadata: any
  } | null>(null)
  const [networkParams, setNetworkParams] =
    useState<NetworkParams>(DEFAULT_PARAMS)
  const [highlightedArtist, setHighlightedArtist] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [isManualSelection, setIsManualSelection] = useState(false)

  useEffect(() => {
    // Load network data based on dataset type
    const dataFile = datasetType === 'japanese' 
      ? '/japanese_featuring_network.json'
      : '/spotify_featuring_network.json'
    
    // Japaneseネットワークのノイズノードを除外するリスト
    // 実際のデータに存在するバリエーションを含める
    const noiseNodes = new Set([
      '塊魂 シリーズ SOUND TEAM',
      '塊魂',
      'Schola Gregoriana Pragensis & Buddhist Tendai Monks From Japan',
      'Schola Gregoriana Pragensis',
      'Atsutada Otaka',
      // 大文字小文字のバリエーションも考慮
      '塊魂シリーズ SOUND TEAM',
      'bandainamco game music',
      'Schola gregoriana pragensis and duddhist tendai monks from japan',
      'atsutada otaka',
      'Bandai Namco Game Music',
      'Bandai Namco Games',
      'BANDAI NAMCO Game Music',
    ])
    
    fetch(dataFile)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        // Japaneseネットワークの場合、ノイズノードをフィルタリング
        if (datasetType === 'japanese') {
          const originalNodeCount = data.nodes?.length || 0
          const originalEdgeCount = data.edges?.length || 0
          
          // ノイズノードを除外
          const filteredNodes = data.nodes.filter(
            (node: any) => !noiseNodes.has(node.id) && !noiseNodes.has(node.name)
          )
          
          // ノイズノードに関連するエッジも除外
          const filteredEdges = data.edges.filter(
            (edge: any) => 
              !noiseNodes.has(edge.source) && !noiseNodes.has(edge.target)
          )
          
          // メタデータを更新
          const filteredData = {
            ...data,
            nodes: filteredNodes,
            edges: filteredEdges,
            metadata: {
              ...data.metadata,
              total_nodes: filteredNodes.length,
              total_edges: filteredEdges.length,
            }
          }
          
          console.log('Network data loaded (filtered):', {
            dataset: datasetType,
            originalNodes: originalNodeCount,
            filteredNodes: filteredNodes.length,
            originalEdges: originalEdgeCount,
            filteredEdges: filteredEdges.length,
            removedNodes: originalNodeCount - filteredNodes.length,
            removedEdges: originalEdgeCount - filteredEdges.length,
            metadata: filteredData.metadata,
          })
          
          setNetworkData(filteredData)
        } else {
          console.log('Network data loaded:', {
            dataset: datasetType,
            nodes: data.nodes?.length || 0,
            edges: data.edges?.length || 0,
            metadata: data.metadata,
          })
          setNetworkData(data)
        }
        
        // データセット切り替え時に状態をリセット
        setHighlightedArtist(null)
        setSearchQuery('')
        setSearchResults([])
        setIsManualSelection(false)
      })
      .catch((err) => {
        console.error('Failed to load network data:', err)
        const filePath = datasetType === 'japanese'
          ? 'public/japanese_featuring_network.json'
          : 'public/spotify_featuring_network.json'
        alert(`データの読み込みに失敗しました: ${err.message}\n\n${filePath}が存在するか確認してください。`)
      })
  }, [datasetType])

  const handleLoadingComplete = () => {
    setIsLoaded(true)
  }

  return (
    <>
      <div className="scanline" />
      <LoadingScreen onComplete={handleLoadingComplete} />
      <div
        className={`w-full h-screen flex flex-col pt-16 transition-opacity duration-1000 delay-500 ${
          isLoaded ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.98]'
        }`}
      >
        <Navigation 
          networkData={networkData}
          datasetType={datasetType}
          onDatasetChange={setDatasetType}
          onSearchChange={(query, results) => {
            setSearchQuery(query)
            setSearchResults(results)
            // 検索結果が1件の場合は自動的にハイライト
            if (results.length === 1) {
              setHighlightedArtist(results[0])
              setIsManualSelection(false)
            } else if (query.trim() === '' && !isManualSelection) {
              // 検索クエリが空で、かつ手動選択でない場合のみクリア
              setHighlightedArtist(null)
            }
          }}
        />
        <div className="relative flex-grow bg-black overflow-hidden flex flex-col">
          <div className="absolute top-6 left-6 pointer-events-none z-10">
            <h2 className="text-4xl font-bold font-mono mb-2 text-white/90">
              FEATURING
              <br />
              NETWORK
            </h2>
            <p className="text-xs text-gray-500 font-mono max-w-xs mt-4 leading-relaxed">
              アーティスト間の共演関係（featuring）を可視化した
              <br />
              グラフ。ノードをドラッグしてネットワークの形状を操作
              <br />
              できます。
              <br />
              <span className="text-green-500">
                マウスオーバーで解析モードへ移行。
              </span>
            </p>
          </div>
          <StatsBox networkData={networkData} />
          <NetworkVisualization
            networkData={networkData}
            params={networkParams}
            highlightedArtist={highlightedArtist}
            searchQuery={searchQuery}
            searchResults={searchResults}
            onNodeHover={(artistId: string | null) => {
              // onNodeHover is kept for potential future use
              // Currently, we don't clear highlightedArtist on hover
              // to allow ArtistHighlight selections to persist
            }}
          />
          <ArtistHighlight
            selectedArtist={highlightedArtist}
            onSelectArtist={(artist) => {
              setHighlightedArtist(artist)
              setIsManualSelection(artist !== null)
              // 手動選択時は検索クエリをクリア
              if (artist !== null) {
                setSearchQuery('')
                setSearchResults([])
              }
            }}
          />
          <TerminalOutput />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 pointer-events-auto flex flex-col items-center gap-2">
            <a
              href="https://github.com/novelsavage/Audiograph-DataVisualization"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-gray-500 hover:text-gray-300 transition-colors"
            >
              github.com/novelsavage/Audiograph-DataVisualization
            </a>
            <Link
              href="/presentation"
              target="_blank"
              className="text-[10px] font-mono text-gray-600 hover:text-terminal-green transition-colors opacity-50 hover:opacity-100"
            >
              [VIEW_PRESENTATION_SLIDES]
            </Link>
          </div>
          <ControlPanel
            onParamsChange={setNetworkParams}
            initialParams={DEFAULT_PARAMS}
          />
        </div>
      </div>
    </>
  )
}
