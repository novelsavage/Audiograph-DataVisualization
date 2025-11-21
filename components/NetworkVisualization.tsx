'use client'

import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface NetworkData {
  nodes: Array<{
    id: string
    name: string
    degree: number
  }>
  edges: Array<{
    source: string
    target: string
    weight: number
    tracks: Array<{
      track_name: string
      track_id: string
      popularity: number
      genre: string
    }>
  }>
  metadata: {
    total_nodes: number
    total_edges: number
    total_collaborations: number
    description: string
  }
}

interface NetworkVisualizationProps {
  networkData: NetworkData | null
  params?: {
    linkDistance: number
    chargeStrength: number
    centerStrength: number
    collisionRadius: number
    nodeSizeMultiplier: number
    maxNodes: number
    maxEdges: number
  }
  highlightedArtist?: string | null
  onNodeHover?: (artistId: string | null) => void
}

interface ProcessedNode {
  id: string
  val: number
  original: any
  x?: number
  y?: number
  fx?: number | null
  fy?: number | null
}

interface ProcessedLink {
  source: ProcessedNode | string
  target: ProcessedNode | string
  value: number
  tracks: Array<{
    track_name: string
    track_id: string
    popularity: number
    genre: string
  }>
}

export default function NetworkVisualization({
  networkData,
  params = {
    linkDistance: 50,
    chargeStrength: 1,
    centerStrength: 1,
    collisionRadius: 1.5,
    nodeSizeMultiplier: 2.0,
    maxNodes: 700,
    maxEdges: 500,
  },
  highlightedArtist = null,
  onNodeHover,
}: NetworkVisualizationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const simulationRef = useRef<d3.Simulation<ProcessedNode, ProcessedLink> | null>(null)
  const hoveredNodeRef = useRef<ProcessedNode | null>(null)
  const nodeStatesRef = useRef<Record<string, { hoverProgress: number; glitchSeed: number }>>({})
  const dimensionsRef = useRef<{ width: number; height: number }>({ width: 800, height: 600 })
  const isDraggingRef = useRef<boolean>(false)
  const processedNodesRef = useRef<ProcessedNode[]>([])
  const centerStrengthIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const eventHandlersRef = useRef<{
    handleMouseMove?: (e: MouseEvent) => void
    handleMouseLeave?: () => void
    handleMouseDown?: () => void
    handleMouseUp?: () => void
  }>({})
  const highlightedArtistRef = useRef<string | null>(null)

  // Update highlightedArtist ref when it changes (without reinitializing simulation)
  useEffect(() => {
    highlightedArtistRef.current = highlightedArtist || null
    // Force a re-render by restarting simulation slightly
    if (simulationRef.current) {
      simulationRef.current.alphaTarget(0.05).restart()
    }
  }, [highlightedArtist])

  useEffect(() => {
    if (!networkData || !canvasRef.current) {
      console.log('NetworkVisualization: Missing data or canvas', { networkData, canvas: canvasRef.current })
      return
    }

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      console.error('NetworkVisualization: Failed to get canvas context')
      return
    }

    console.log('NetworkVisualization: Initializing with data', {
      nodeCount: networkData.nodes.length,
      edgeCount: networkData.edges.length,
    })

    // Process data for D3 (limit nodes and edges based on params)
    const limitedNodes = networkData.nodes.slice(0, params.maxNodes)
    const limitedEdges = networkData.edges
      .filter(
        (e) =>
          limitedNodes.some((n) => n.id === e.source) &&
          limitedNodes.some((n) => n.id === e.target)
      )
      .slice(0, params.maxEdges)

    const processedNodes: ProcessedNode[] = limitedNodes.map((n) => ({
      id: n.id,
      val: n.degree,
      original: n,
    }))

    const processedLinks: ProcessedLink[] = limitedEdges.map((e) => ({
      source: e.source,
      target: e.target,
      value: e.weight,
      tracks: e.tracks,
    }))

    console.log('NetworkVisualization: Processed data', {
      nodes: processedNodes.length,
      links: processedLinks.length,
    })

    // Get canvas dimensions reliably
    const getCanvasDimensions = () => {
      const rect = canvas.getBoundingClientRect()
      return {
        width: rect.width || canvas.clientWidth || window.innerWidth,
        height: rect.height || canvas.clientHeight || window.innerHeight - 200,
      }
    }

    let { width, height } = getCanvasDimensions()
    dimensionsRef.current = { width, height }

    // Resize handler
    const resize = () => {
      const dims = getCanvasDimensions()
      width = dims.width
      height = dims.height
      dimensionsRef.current = { width, height }
      
      const dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`

      if (simulationRef.current) {
        const centerX = width / 2
        const centerY = height / 2
        console.log('Resize: Setting center to', { centerX, centerY, width, height })
        simulationRef.current
          .force('center', d3.forceCenter(centerX, centerY).strength(params.centerStrength))
          .force('link', d3.forceLink().distance(params.linkDistance))
          .force('charge', d3.forceManyBody().strength(params.chargeStrength))
        .force(
          'collide',
          d3
            .forceCollide<ProcessedNode>()
            .radius(
              (d) =>
                Math.sqrt((d as ProcessedNode).val) *
                params.nodeSizeMultiplier *
                params.collisionRadius +
                10
            )
        )
          .alpha(0.3)
          .restart()
      }
    }

    // Stop any existing simulation first
    if (simulationRef.current) {
      console.log('Stopping existing simulation')
      simulationRef.current.stop()
      simulationRef.current = null
    }

    // Initial resize immediately to get correct dimensions
    resize()
    
    // Wait a bit for DOM to settle, then initialize simulation
    const initTimeout = setTimeout(() => {
      // Get fresh dimensions after resize
      const dims = getCanvasDimensions()
      width = dims.width
      height = dims.height
      dimensionsRef.current = { width, height }
      
      // Store processedNodes in ref for mouse interaction
      processedNodesRef.current = processedNodes
      
      // Initialize nodes with positions centered in viewport
      const centerX = width / 2
      const centerY = height / 2
      processedNodes.forEach((node, i) => {
        // Distribute initial positions in a circle around center
        const angle = (i / processedNodes.length) * Math.PI * 2
        const radius = Math.min(width, height) * 0.2
        node.x = centerX + Math.cos(angle) * radius
        node.y = centerY + Math.sin(angle) * radius
      })

      // Initialize simulation with configurable parameters
      const simulation = d3
        .forceSimulation<ProcessedNode>(processedNodes)
        .force(
          'link',
          d3
            .forceLink<ProcessedNode, ProcessedLink>(processedLinks)
            .id((d) => {
              if (typeof d === 'string') return d
              if (typeof d === 'object' && 'id' in d) return d.id
              return String(d)
            })
            .distance(params.linkDistance)
        )
        .force('charge', d3.forceManyBody().strength(params.chargeStrength))
        .force('center', d3.forceCenter(centerX, centerY).strength(params.centerStrength))
          .force(
            'collide',
            d3
              .forceCollide<ProcessedNode>()
              .radius(
                (d) => Math.sqrt((d as ProcessedNode).val) * params.nodeSizeMultiplier * params.collisionRadius + 10
              )
          )

      simulationRef.current = simulation

      // Create subtle oscillation in center strength to keep simulation active
      // This ensures continuous updates even when graph appears stable
      let centerStrengthPhase = 0
      centerStrengthIntervalRef.current = setInterval(() => {
        if (simulationRef.current) {
          centerStrengthPhase += 0.1
          // Oscillate center strength between 0.9 and 1.1 times the base value
          const oscillation = Math.sin(centerStrengthPhase) * 0.1
          const baseStrength = params.centerStrength
          const newStrength = baseStrength * (1.0 + oscillation)
          
          const centerForce = simulationRef.current.force('center') as d3.ForceCenter<ProcessedNode>
          if (centerForce) {
            centerForce.strength(newStrength)
            // Gently restart simulation to apply the change
            simulationRef.current.alphaTarget(0.05).restart()
          }
        }
      }, 100) // Update every 100ms for smooth oscillation

      console.log('NetworkVisualization: Simulation initialized', {
        width,
        height,
        centerX,
        centerY,
        nodeCount: processedNodes.length,
        linkCount: processedLinks.length,
      })

      // Glitch text effect
      const glyphs = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789@#$%&'
      const glitchText = (text: string, progress: number) => {
        if (progress >= 1) return text
        return text
          .split('')
          .map((char, index) => {
            if (index < progress * text.length) {
              return text[index]
            }
            return glyphs[Math.floor(Math.random() * glyphs.length)]
          })
          .join('')
      }

      // Mouse interaction
      const handleMouseMove = (e: MouseEvent) => {
        // Don't update hover state while dragging
        if (isDraggingRef.current) return

        const rect = canvas.getBoundingClientRect()
        // Use display coordinates (same as rendering loop)
        // canvas.width is already scaled by DPR, so we use rect.width/height for display coordinates
        const dpr = window.devicePixelRatio || 1
        const displayWidth = canvas.width / dpr
        const displayHeight = canvas.height / dpr
        const x = (e.clientX - rect.left) * (displayWidth / rect.width)
        const y = (e.clientY - rect.top) * (displayHeight / rect.height)

        // Check if mouse is within canvas bounds
        const isWithinBounds =
          e.clientX >= rect.left &&
          e.clientX <= rect.right &&
          e.clientY >= rect.top &&
          e.clientY <= rect.bottom

        if (!isWithinBounds) {
          if (hoveredNodeRef.current !== null) {
            hoveredNodeRef.current = null
          }
          return
        }

        // Use the current processedNodes from ref
        const currentNodes = processedNodesRef.current
        let minDist = 40
        let nearestNode: ProcessedNode | null = null

        currentNodes.forEach((node) => {
          if (!node.x || !node.y) return
          const dx = x - node.x
          const dy = y - node.y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < minDist) {
            minDist = dist
            nearestNode = node
          }
        })

        // Always update hover state, even if no node found (to clear previous hover)
        if (nearestNode !== hoveredNodeRef.current) {
          hoveredNodeRef.current = nearestNode
          // Clear highlighted artist when hovering over a node
          if (nearestNode && highlightedArtistRef.current && onNodeHover) {
            onNodeHover(null)
          }
        } else if (nearestNode === null && hoveredNodeRef.current !== null) {
          // Explicitly clear hover when no node is found
          hoveredNodeRef.current = null
        }
      }

      const handleMouseLeave = () => {
        // Clear hover state and reset dragging
        hoveredNodeRef.current = null
        isDraggingRef.current = false
        // Reset hover progress for all nodes
        Object.keys(nodeStatesRef.current).forEach((nodeId) => {
          if (nodeStatesRef.current[nodeId]) {
            nodeStatesRef.current[nodeId].hoverProgress = 0
          }
        })
      }

      const handleMouseDown = () => {
        // Will be set to true when drag actually starts
        isDraggingRef.current = false
      }

      const handleMouseUp = () => {
        isDraggingRef.current = false
        // Don't clear hover on mouse up - let handleMouseMove handle it
        // This prevents clearing hover when clicking
      }

      // Store event handlers in ref for cleanup
      eventHandlersRef.current = {
        handleMouseMove,
        handleMouseLeave,
        handleMouseDown,
        handleMouseUp,
      }

      canvas.addEventListener('mousemove', handleMouseMove)
      canvas.addEventListener('mouseleave', handleMouseLeave)
      canvas.addEventListener('mousedown', handleMouseDown)
      canvas.addEventListener('mouseup', handleMouseUp)

      // Drag behavior
      const drag = d3
        .drag<HTMLCanvasElement, ProcessedNode>()
        .subject((event) => {
          const [x, y] = d3.pointer(event, canvas)
          let subject: ProcessedNode | null = null
          let minDist = 30

          // Use current nodes from ref
          processedNodesRef.current.forEach((node) => {
            if (!node.x || !node.y) return
            const dist = Math.hypot(x - node.x, y - node.y)
            if (dist < minDist) {
              minDist = dist
              subject = node
            }
          })
          return subject || { x, y } // Return position if no node found
        })
        .on('start', (event) => {
          if (!event.subject || !simulationRef.current) return
          isDraggingRef.current = true
          hoveredNodeRef.current = null // Clear hover when dragging starts
          if (!event.active) simulationRef.current.alphaTarget(0.3).restart()
          event.subject.fx = event.subject.x
          event.subject.fy = event.subject.y
        })
        .on('drag', (event) => {
          if (!event.subject) return
          event.subject.fx = event.x
          event.subject.fy = event.y
        })
        .on('end', (event) => {
          if (!event.subject || !simulationRef.current) return
          isDraggingRef.current = false
          hoveredNodeRef.current = null // Clear hover when drag ends
          if (!event.active) simulationRef.current.alphaTarget(0)
          event.subject.fx = null
          event.subject.fy = null
        })

      d3.select(canvas).call(drag as any)

      // Render loop with boundary constraints
      let tickCount = 0
      const margin = 50 // Margin from edges
      
      simulation.on('tick', () => {
      tickCount++
      
      // Get current dimensions
      const { width: currentWidth, height: currentHeight } = dimensionsRef.current
      const dpr = window.devicePixelRatio || 1
      const displayWidth = canvas.width / dpr
      const displayHeight = canvas.height / dpr

      // Constrain nodes to viewport bounds
      processedNodes.forEach((node) => {
        if (node.x === undefined || node.y === undefined) return
        
        // Keep nodes within bounds with margin
        const radius = Math.sqrt(node.val) * params.nodeSizeMultiplier + 5
        node.x = Math.max(margin + radius, Math.min(displayWidth - margin - radius, node.x))
        node.y = Math.max(margin + radius, Math.min(displayHeight - margin - radius, node.y))
      })

      if (tickCount === 1) {
        console.log('NetworkVisualization: First tick - nodes positioned', {
          nodesWithPosition: processedNodes.filter(n => n.x && n.y).length,
          displayWidth,
          displayHeight,
        })
      }

      // Clear
      ctx.fillStyle = '#000000'
      ctx.fillRect(0, 0, displayWidth, displayHeight)

      // Draw links
      ctx.lineWidth = 1
      let drawnLinks = 0
      processedLinks.forEach((link) => {
        // D3.jsのforceLinkは、リンクのsource/targetをノードオブジェクトに変換する
        const source = link.source as ProcessedNode
        const target = link.target as ProcessedNode

        if (!source || !target || !source.x || !source.y || !target.x || !target.y) return
        drawnLinks++

        const isConnected =
          hoveredNodeRef.current &&
          (source.id === hoveredNodeRef.current.id ||
            target.id === hoveredNodeRef.current.id)
        
        const isHighlighted =
          highlightedArtistRef.current &&
          (source.id === highlightedArtistRef.current || target.id === highlightedArtistRef.current)
        
        const isHighlightedConnection =
          highlightedArtist &&
          source.id === highlightedArtist &&
          target.id === highlightedArtist

        ctx.beginPath()
        if (isConnected) {
          ctx.strokeStyle = 'rgba(0, 255, 65, 0.6)'
          ctx.lineWidth = Math.sqrt(link.value) * 0.8
          ctx.setLineDash([2, 2])
        } else if (isHighlighted) {
          ctx.strokeStyle = 'rgba(0, 255, 65, 0.4)'
          ctx.lineWidth = Math.sqrt(link.value) * 0.6
          ctx.setLineDash([])
        } else if (hoveredNodeRef.current) {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)'
          ctx.lineWidth = 1
          ctx.setLineDash([])
        } else {
          ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)'
          ctx.lineWidth = Math.sqrt(link.value) * 0.5
          ctx.setLineDash([])
        }

        ctx.moveTo(source.x, source.y)
        ctx.lineTo(target.x, target.y)
        ctx.stroke()
      })
      
      if (tickCount === 1) {
        console.log('NetworkVisualization: Links drawn', { drawnLinks, totalLinks: processedLinks.length })
      }

      // Draw nodes
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.font = "10px 'JetBrains Mono'"

      processedNodes.forEach((node) => {
        if (!node.x || !node.y) return

        // Initialize state
        if (!nodeStatesRef.current[node.id]) {
          nodeStatesRef.current[node.id] = {
            hoverProgress: 0,
            glitchSeed: Math.random(),
          }
        }
        const state = nodeStatesRef.current[node.id]

        const isHovered = hoveredNodeRef.current === node
        const isHighlighted = highlightedArtistRef.current === node.id
        const isNeighbor =
          hoveredNodeRef.current &&
          processedLinks.some(
            (l) => {
              const src = typeof l.source === 'string' ? l.source : l.source.id
              const tgt = typeof l.target === 'string' ? l.target : l.target.id
              return (
                (src === hoveredNodeRef.current!.id && tgt === node.id) ||
                (tgt === hoveredNodeRef.current!.id && src === node.id)
              )
            }
          )
        const isHighlightedNeighbor =
          highlightedArtistRef.current &&
          processedLinks.some(
            (l) => {
              const src = typeof l.source === 'string' ? l.source : l.source.id
              const tgt = typeof l.target === 'string' ? l.target : l.target.id
              return (
                (src === highlightedArtistRef.current && tgt === node.id) ||
                (tgt === highlightedArtistRef.current && src === node.id)
              )
            }
          )

        if (isHovered || isNeighbor) {
          state.hoverProgress = Math.min(state.hoverProgress + 0.1, 1)
        } else {
          // Reset progress when not hovered
          state.hoverProgress = Math.max(state.hoverProgress - 0.05, 0)
          // If hover was cleared, reset progress completely
          if (hoveredNodeRef.current === null && state.hoverProgress < 0.01) {
            state.hoverProgress = 0
          }
        }

        const x = node.x
        const y = node.y
        const radius =
          Math.sqrt(node.val) * params.nodeSizeMultiplier + 2

        if (isHovered) {
          ctx.fillStyle = '#00ff41'
          const label = glitchText(
            `[ ${node.id.toUpperCase()} ]`,
            state.hoverProgress
          )
          ctx.font = "bold 12px 'JetBrains Mono'"
          ctx.fillText(label, x, y - radius - 10)

          // Draw node circle
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fill()
        } else if (isHighlighted) {
          ctx.fillStyle = '#00ff41'
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fill()
          ctx.font = "bold 11px 'JetBrains Mono'"
          ctx.fillText(node.id, x, y - radius - 8)
        } else if (isNeighbor || isHighlightedNeighbor) {
          ctx.fillStyle = '#ffffff'
          ctx.beginPath()
          ctx.arc(x, y, radius, 0, Math.PI * 2)
          ctx.fill()

          ctx.font = "10px 'JetBrains Mono'"
          ctx.fillText(node.id, x, y - radius - 5)
        } else {
          ctx.fillStyle = hoveredNodeRef.current ? '#222222' : '#888888'

          if (node.val > 50) {
            ctx.beginPath()
            ctx.arc(x, y, radius, 0, Math.PI * 2)
            ctx.fill()
            if (!hoveredNodeRef.current) {
              ctx.fillStyle = '#555'
              ctx.fillText(node.id, x, y)
            }
          } else {
            ctx.fillText('+', x, y)
          }
        }
      })

      // Draw tracks info for connected neighbors
      if (hoveredNodeRef.current) {
        const connectedLinks = processedLinks.filter((l) => {
          const src = typeof l.source === 'string' ? l.source : l.source.id
          const tgt = typeof l.target === 'string' ? l.target : l.target.id
          return (
            src === hoveredNodeRef.current!.id ||
            tgt === hoveredNodeRef.current!.id
          )
        })

        connectedLinks
          .sort((a, b) => b.value - a.value)
          .slice(0, 3)
          .forEach((link, i) => {
            if (link.tracks && link.tracks.length > 0) {
              const source = typeof link.source === 'string' 
                ? processedNodes.find(n => n.id === link.source) 
                : link.source
              const target = typeof link.target === 'string'
                ? processedNodes.find(n => n.id === link.target)
                : link.target

              if (!source || !target || !source.x || !source.y || !target.x || !target.y) return

              const otherNode =
                source.id === hoveredNodeRef.current!.id ? target : source
              const midX = (hoveredNodeRef.current!.x! + otherNode.x!) / 2
              const midY = (hoveredNodeRef.current!.y! + otherNode.y!) / 2

              ctx.fillStyle = '#00ff41'
              ctx.font = "8px 'JetBrains Mono'"
              const trackName = link.tracks[0].track_name.length > 30
                ? link.tracks[0].track_name.substring(0, 30) + '...'
                : link.tracks[0].track_name
              ctx.fillText(`feat. ${trackName}`, midX, midY + i * 10)
            }
          })
      }
      })
    }, 150)
    
    window.addEventListener('resize', resize)

    return () => {
      clearTimeout(initTimeout)
      // Clear center strength oscillation interval
      if (centerStrengthIntervalRef.current) {
        clearInterval(centerStrengthIntervalRef.current)
        centerStrengthIntervalRef.current = null
      }
      window.removeEventListener('resize', resize)
      // Remove event listeners using stored references
      const handlers = eventHandlersRef.current
      if (handlers.handleMouseMove) {
        canvas.removeEventListener('mousemove', handlers.handleMouseMove)
      }
      if (handlers.handleMouseLeave) {
        canvas.removeEventListener('mouseleave', handlers.handleMouseLeave)
      }
      if (handlers.handleMouseDown) {
        canvas.removeEventListener('mousedown', handlers.handleMouseDown)
      }
      if (handlers.handleMouseUp) {
        canvas.removeEventListener('mouseup', handlers.handleMouseUp)
      }
      // Stop simulation if it exists
      if (simulationRef.current) {
        simulationRef.current.stop()
        simulationRef.current = null
      }
    }
  }, [networkData, params])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-crosshair"
      style={{ display: 'block' }}
    />
  )
}
