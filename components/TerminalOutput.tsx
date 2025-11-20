'use client'

import { useEffect, useRef, useState } from 'react'

export default function TerminalOutput() {
  const [logs, setLogs] = useState<string[]>(['> CONNECTING_TO_CORE...', '> READY.'])
  const terminalRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // Keep only last 6 logs
    if (logs.length > 6) {
      setLogs((prev) => prev.slice(-6))
    }
  }, [logs])

  return (
    <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black via-black/90 to-transparent p-6 pointer-events-none font-mono text-xs z-10 flex flex-col justify-end">
      <div
        ref={terminalRef}
        className="text-green-500/80 space-y-1 h-full overflow-hidden flex flex-col justify-end opacity-70"
      >
        {logs.map((log, i) => (
          <p key={i}>{log}</p>
        ))}
      </div>
      <div className="flex items-center gap-2 mt-2 text-white/50">
        <span>root@audiograph:~/viz$</span>
        <span className="w-2 h-4 bg-white/50 animate-blink" />
      </div>
    </div>
  )
}

