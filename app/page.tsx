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

const DEFAULT_PARAMS: NetworkParams = {
  linkDistance: 50,
  chargeStrength: 1,
  centerStrength: 1,
  collisionRadius: 1.5,
  nodeSizeMultiplier: 2.0,
  maxNodes: 700,
  maxEdges: 500,
}

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false)
  const [networkData, setNetworkData] = useState<{
    nodes: any[]
    edges: any[]
    metadata: any
  } | null>(null)
  const [networkParams, setNetworkParams] =
    useState<NetworkParams>(DEFAULT_PARAMS)
  const [highlightedArtist, setHighlightedArtist] = useState<string | null>(null)

  useEffect(() => {
    // Load network data
    fetch('/spotify_featuring_network.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        console.log('Network data loaded:', {
          nodes: data.nodes?.length || 0,
          edges: data.edges?.length || 0,
          metadata: data.metadata,
        })
        setNetworkData(data)
      })
      .catch((err) => {
        console.error('Failed to load network data:', err)
        alert(`データの読み込みに失敗しました: ${err.message}\n\npublic/spotify_featuring_network.jsonが存在するか確認してください。`)
      })
  }, [])

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
        <Navigation networkData={networkData} />
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
            onNodeHover={(artistId: string | null) => {
              // When hovering over a node, clear the highlighted artist
              if (highlightedArtist) {
                setHighlightedArtist(null)
              }
            }}
          />
          <ArtistHighlight
            selectedArtist={highlightedArtist}
            onSelectArtist={setHighlightedArtist}
          />
          <TerminalOutput />
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10 pointer-events-auto">
            <a
              href="https://github.com/novelsavage/Audiograph-DataVisualization"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs font-mono text-gray-500 hover:text-gray-300 transition-colors"
            >
              github.com/novelsavage/Audiograph-DataVisualization
            </a>
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

