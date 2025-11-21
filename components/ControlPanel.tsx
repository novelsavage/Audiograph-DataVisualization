'use client'

import { useState } from 'react'

interface ControlPanelProps {
  onParamsChange: (params: NetworkParams) => void
  initialParams: NetworkParams
}

export interface NetworkParams {
  linkDistance: number
  chargeStrength: number
  centerStrength: number
  collisionRadius: number
  nodeSizeMultiplier: number
  maxNodes: number
  maxEdges: number
}

export default function ControlPanel({
  onParamsChange,
  initialParams,
}: ControlPanelProps) {
  const [params, setParams] = useState<NetworkParams>(initialParams)
  const [isOpen, setIsOpen] = useState(false)

  const handleChange = (key: keyof NetworkParams, value: number) => {
    const newParams = { ...params, [key]: value }
    setParams(newParams)
    onParamsChange(newParams)
  }

  const handleWheel = (
    e: React.WheelEvent<HTMLInputElement>,
    key: keyof NetworkParams,
    min: number,
    max: number,
    step: number
  ) => {
    // Only stop propagation to prevent panel scrolling, but don't prevent default
    // This allows the slider to still work while preventing panel scroll
    e.stopPropagation()
    
    const delta = e.deltaY > 0 ? -step : step
    const currentValue = params[key] as number
    const newValue = Math.max(min, Math.min(max, currentValue + delta))
    if (newValue !== currentValue) {
      handleChange(key, newValue)
    }
  }

  const reset = () => {
    setParams(initialParams)
    onParamsChange(initialParams)
  }

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 px-4 py-2 bg-black/80 border border-white/20 rounded font-mono text-xs hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-md"
      >
        {isOpen ? '▼ HIDE CONTROLS' : '▲ SHOW CONTROLS'}
      </button>

      {/* Control Panel */}
      {isOpen && (
        <div
          className="fixed bottom-20 right-6 z-50 w-80 bg-black/90 border border-white/20 rounded p-3 font-mono text-xs backdrop-blur-md overflow-y-auto"
          onWheel={(e) => {
            // Prevent panel scrolling when adjusting sliders
            const target = e.target as HTMLElement
            if (target.tagName === 'INPUT' && target.getAttribute('type') === 'range') {
              e.stopPropagation()
            }
          }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-bold text-white">NETWORK PARAMETERS</h3>
            <button
              onClick={reset}
              className="px-2 py-1 border border-white/20 rounded text-xs hover:bg-white hover:text-black transition-colors"
            >
              RESET
            </button>
          </div>

          <div className="space-y-3">
            {/* Link Distance */}
            <div>
              <label className="block text-gray-400 mb-1">
                Link Distance: {params.linkDistance}
              </label>
              <input
                type="range"
                min="-50"
                max="150"
                step="10"
                value={params.linkDistance}
                onChange={(e) =>
                  handleChange('linkDistance', Number(e.target.value))
                }
                onWheel={(e) =>
                  handleWheel(e, 'linkDistance', -50, 150, 10)
                }
                className="w-full"
              />
            </div>

            {/* Charge Strength */}
            <div>
              <label className="block text-gray-400 mb-1">
                Charge Strength: {params.chargeStrength}
              </label>
              <input
                type="range"
                min="-10"
                max="10"
                step="1"
                value={params.chargeStrength}
                onChange={(e) =>
                  handleChange('chargeStrength', Number(e.target.value))
                }
                onWheel={(e) =>
                  handleWheel(e, 'chargeStrength', -10, 10, 1)
                }
                className="w-full"
              />
            </div>

            {/* Center Strength */}
            <div>
              <label className="block text-gray-400 mb-1">
                Center Strength: {params.centerStrength.toFixed(1)}
              </label>
              <input
                type="range"
                min="-50"
                max="100"
                step="1"
                value={params.centerStrength}
                onChange={(e) =>
                  handleChange('centerStrength', Number(e.target.value))
                }
                onWheel={(e) =>
                  handleWheel(e, 'centerStrength', -50, 100, 1)
                }
                className="w-full"
              />
            </div>

            {/* Collision Radius */}
            <div>
              <label className="block text-gray-400 mb-1">
                Collision Radius: {params.collisionRadius.toFixed(1)}
              </label>
              <input
                type="range"
                min="-8.5"
                max="11.5"
                step="0.1"
                value={params.collisionRadius}
                onChange={(e) =>
                  handleChange('collisionRadius', Number(e.target.value))
                }
                onWheel={(e) =>
                  handleWheel(e, 'collisionRadius', -8.5, 11.5, 0.1)
                }
                className="w-full"
              />
            </div>

            {/* Node Size Multiplier */}
            <div>
              <label className="block text-gray-400 mb-1">
                Node Size: {params.nodeSizeMultiplier.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={params.nodeSizeMultiplier}
                onChange={(e) =>
                  handleChange('nodeSizeMultiplier', Number(e.target.value))
                }
                onWheel={(e) =>
                  handleWheel(e, 'nodeSizeMultiplier', 0.5, 3, 0.1)
                }
                className="w-full"
              />
            </div>

            {/* Max Nodes */}
            <div>
              <label className="block text-gray-400 mb-1">
                Max Nodes: {params.maxNodes}
              </label>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={params.maxNodes}
                onChange={(e) =>
                  handleChange('maxNodes', Number(e.target.value))
                }
                onWheel={(e) =>
                  handleWheel(e, 'maxNodes', 50, 1000, 50)
                }
                className="w-full"
              />
            </div>

            {/* Max Edges */}
            <div>
              <label className="block text-gray-400 mb-1">
                Max Edges: {params.maxEdges}
              </label>
              <input
                type="range"
                min="50"
                max="1000"
                step="50"
                value={params.maxEdges}
                onChange={(e) =>
                  handleChange('maxEdges', Number(e.target.value))
                }
                onWheel={(e) =>
                  handleWheel(e, 'maxEdges', 50, 1000, 50)
                }
                className="w-full"
              />
            </div>
          </div>

        </div>
      )}
    </>
  )
}

