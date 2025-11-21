interface NavigationProps {
  networkData: {
    nodes: any[]
    edges: any[]
    metadata: any
  } | null
}

export default function Navigation({ networkData }: NavigationProps) {
  const nodeCount = networkData?.metadata?.total_nodes ?? '--'
  const edgeCount = networkData?.metadata?.total_edges ?? '--'

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
      </div>
    </nav>
  )
}

