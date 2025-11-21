'use client'

import { useState } from 'react'

interface ArtistHighlightProps {
  selectedArtist: string | null
  onSelectArtist: (artist: string | null) => void
}

const featuredArtists = [
  { name: 'Wiz Khalifa', description: 'フィーチャリング文化が強いヒップホップアーティスト' },
  { name: 'Lil Wayne', description: 'フィーチャリング文化が強いヒップホップアーティスト' },
  { name: 'Ty Dolla $ign', description: '特にフィーチャリングが多いアーティスト\n"Featuring Ty Dolla $ign"というアルバムも出している！' },
  { name: 'DJ Khaled', description: 'プロデューサーとしてフィーチャリングが多い' },
  { name: 'Gorillaz', description: '架空バンドとしてユニークな例' },
]

export default function ArtistHighlight({
  selectedArtist,
  onSelectArtist,
}: ArtistHighlightProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed left-6 top-1/2 transform -translate-y-1/2 z-50 px-4 py-2 bg-black/80 border border-white/20 rounded font-mono text-xs hover:bg-white hover:text-black transition-all duration-300 backdrop-blur-md"
      >
        {isOpen ? '◄' : '► NARRATIVE'}
      </button>

      {/* Narrative Panel */}
      {isOpen && (
        <div className="absolute left-6 top-1/2 transform -translate-y-1/2 z-10 pointer-events-auto ml-12">
          <div className="bg-black/90 border border-white/20 rounded p-4 font-mono text-xs backdrop-blur-md max-w-xs">
        <h3 className="text-sm font-bold text-white mb-3">ARTIST HIGHLIGHT</h3>
        <p className="text-gray-400 text-[10px] mb-4 leading-relaxed">
          フィーチャリングの文化が強いヒップホップアーティストや、プロデューサーは特にフィーチャリングが多い傾向があります。
        </p>
        <div className="space-y-2">
          {featuredArtists.map((artist) => (
            <button
              key={artist.name}
              onClick={() => {
                if (selectedArtist === artist.name) {
                  onSelectArtist(null)
                } else {
                  onSelectArtist(artist.name)
                }
              }}
              className={`w-full text-left px-3 py-2 rounded border transition-all duration-200 ${
                selectedArtist === artist.name
                  ? 'bg-green-500/20 border-green-500 text-green-500'
                  : 'bg-white/5 border-white/20 text-gray-300 hover:bg-white/10 hover:border-white/30'
              }`}
            >
              <div className="font-bold text-xs">{artist.name}</div>
              <div className="text-[10px] text-gray-400 mt-0.5 whitespace-pre-line">
                {artist.description}
              </div>
            </button>
          ))}
        </div>
        {selectedArtist && (
          <button
            onClick={() => onSelectArtist(null)}
            className="mt-3 w-full px-3 py-1.5 border border-white/20 rounded text-xs hover:bg-white/10 hover:text-white transition-colors text-gray-400"
          >
            CLEAR SELECTION
          </button>
        )}
          </div>
        </div>
      )}
    </>
  )
}

