export default function Navigation() {
  return (
    <nav className="fixed w-full z-40 top-0 left-0 border-b border-white/10 bg-black/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-white rounded-full animate-pulse" />
          <span className="text-lg font-bold tracking-tight font-mono">
            AUDIOGRAPH
          </span>
        </div>
        <div className="hidden md:flex items-center gap-6 font-mono text-xs text-gray-400">
          <a href="#" className="text-white">
            VISUALIZER
          </a>
          <a href="#" className="hover:text-white transition-colors">
            SEARCH
          </a>
          <a href="#" className="hover:text-white transition-colors">
            ABOUT
          </a>
        </div>
        <button className="hidden md:block px-4 py-1.5 border border-white/20 rounded-full text-xs font-mono hover:bg-white hover:text-black transition-all duration-300">
          ACCESS DB
        </button>
      </div>
    </nav>
  )
}

