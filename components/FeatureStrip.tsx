interface FeatureStripProps {
  networkData: {
    nodes: any[]
    edges: any[]
    metadata: any
  } | null
}

export default function FeatureStrip({ networkData }: FeatureStripProps) {
  const nodeCount = networkData?.metadata?.total_nodes ?? '--'
  const edgeCount = networkData?.metadata?.total_edges ?? '--'

  return (
    <section className="border-b border-white/10 bg-white/5 backdrop-blur-sm overflow-hidden py-2 flex-none z-30">
      <div className="flex whitespace-nowrap animate-marquee gap-8 items-center text-xs font-mono text-gray-400">
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
    </section>
  )
}

