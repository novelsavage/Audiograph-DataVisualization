interface StatsBoxProps {
  networkData: {
    nodes: any[]
    edges: any[]
    metadata: any
  } | null
}

export default function StatsBox({ networkData }: StatsBoxProps) {
  const nodeCount = networkData?.metadata?.total_nodes ?? 0
  const edgeCount = networkData?.metadata?.total_edges ?? 0

  return (
    <div className="absolute top-6 right-6 hidden md:block pointer-events-none z-10">
      <div className="border border-white/20 bg-black/50 px-4 py-3 rounded font-mono text-xs backdrop-blur space-y-1">
        <div className="flex justify-between gap-8 text-gray-400">
          <span>TARGET:</span>
          <span className="text-white">TOP_COLLABORATIONS</span>
        </div>
        <div className="flex justify-between gap-8 text-gray-400">
          <span>STATUS:</span>
          <span className="text-green-500">ACTIVE</span>
        </div>
        <div className="flex justify-between gap-8 text-gray-400">
          <span>NODES:</span>
          <span className="text-white">{nodeCount}</span>
        </div>
        <div className="flex justify-between gap-8 text-gray-400">
          <span>EDGES:</span>
          <span className="text-white">{edgeCount}</span>
        </div>
      </div>
    </div>
  )
}

