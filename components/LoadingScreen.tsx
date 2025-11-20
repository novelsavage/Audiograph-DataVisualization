'use client'

import { useEffect, useRef, useState } from 'react'

interface LoadingScreenProps {
  onComplete: () => void
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationFrameRef = useRef<number>()
  const [progress, setProgress] = useState(0)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const chars = ' .:-=+*#%@'
    let width = 0
    let height = 0

    const resize = () => {
      const parent = canvas.parentElement
      if (!parent) return
      width = parent.offsetWidth
      height = parent.offsetHeight
      const dpr = window.devicePixelRatio || 1
      canvas.width = width * dpr
      canvas.height = height * dpr
      ctx.scale(dpr, dpr)
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
    }

    window.addEventListener('resize', resize)
    resize()

    const getChar = (brightness: number) => {
      const index = Math.floor(brightness * (chars.length - 1))
      return chars[Math.max(0, Math.min(index, chars.length - 1))]
    }

    const draw = () => {
      ctx.fillStyle = '#050505'
      ctx.fillRect(0, 0, width, height)
      const fontSize = 12
      const cols = Math.floor(width / (fontSize * 0.6))
      const rows = Math.floor(height / fontSize)

      ctx.font = `${fontSize}px 'JetBrains Mono', monospace`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'

      const centerX = width / 2
      const centerY = height / 2
      const maxRadius = Math.min(width, height) * 0.45
      const rotation = timeRef.current * 0.5

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const px = x * (fontSize * 0.6) + fontSize * 0.3
          const py = y * fontSize + fontSize * 0.5
          const dx = px - centerX
          const dy = py - centerY
          const dist = Math.sqrt(dx * dx + dy * dy)
          const angle = Math.atan2(dy, dx)
          const normalizedDist = dist / maxRadius
          let brightness = 0

          if (normalizedDist < 1.0 && normalizedDist > 0.15) {
            const groove = Math.sin(normalizedDist * 100 - rotation * 0.0)
            const reflectionAngle = angle + rotation
            const reflection = Math.cos(reflectionAngle * 2)
            brightness = 0.3 + groove * 0.1 + reflection * 0.4
            if (normalizedDist < 0.35)
              brightness = 0.8 + Math.sin(px * 0.1 + py * 0.1) * 0.1
          } else if (normalizedDist <= 0.15) {
            brightness = 0
          } else {
            const noise = Math.random()
            if (noise > 0.995) brightness = 0.2
          }

          if (brightness > 0.1) {
            const char = getChar(brightness)
            ctx.fillStyle = brightness > 0.8 ? '#ffffff' : '#555555'
            ctx.fillText(char, px, py)
          }
        }
      }
      timeRef.current += 0.03
      animationFrameRef.current = requestAnimationFrame(draw)
    }

    draw()

    // Loading progress
    const loadInterval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = Math.min(prev + Math.floor(Math.random() * 5) + 1, 100)
        if (newProgress === 100) {
          clearInterval(loadInterval)
          setTimeout(() => {
            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current)
            }
            onComplete()
          }, 500)
        }
        return newProgress
      })
    }, 50)

    return () => {
      window.removeEventListener('resize', resize)
      clearInterval(loadInterval)
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [onComplete])

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#050505] flex flex-col items-center justify-center transition-opacity duration-800 ease-in-out ${
        progress === 100 ? 'opacity-0 pointer-events-none scale-110' : ''
      }`}
    >
      <div className="relative w-[300px] h-[300px] md:w-[500px] md:h-[500px] flex items-center justify-center mb-8">
        <canvas ref={canvasRef} className="opacity-80" />
      </div>
      <div className="font-mono text-center space-y-2">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tighter">
          AUDIOGRAPH
        </h1>
        <div className="text-xs text-gray-500 flex flex-col gap-1">
          <p>&gt; INITIALIZING_DATABASE_V2.0...</p>
          <p>&gt; LOADING_ASSETS [{progress}%]</p>
        </div>
      </div>
    </div>
  )
}

