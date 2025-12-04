'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import * as d3 from 'd3';

// NetworkPreview Component
const NetworkPreview = () => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    if (!svgRef.current) return;

    // Load data
    fetch('/spotify_featuring_network.json')
      .then(res => res.json())
      .then(data => {
        if (!data.nodes || !data.edges) return;

        // Fixed center node: Lil Wayne
        const targetArtistName = "Lil Wayne";
        const centerNode = data.nodes.find((n: any) => n.id === targetArtistName);
        
        if (!centerNode) {
            console.error("Artist not found:", targetArtistName);
            return;
        }

        // Get connected edges
        const connectedEdges = data.edges.filter((e: any) => 
          e.source === centerNode.id || e.target === centerNode.id
        ).slice(0, 20); // Limit connections for clearer view

        // Get connected nodes
        const connectedNodeIds = new Set<string>([centerNode.id]);
        connectedEdges.forEach((e: any) => {
          connectedNodeIds.add(e.source);
          connectedNodeIds.add(e.target);
        });

        const nodes = data.nodes.filter((n: any) => connectedNodeIds.has(n.id)).map((n: any) => ({...n}));
        const links = connectedEdges.map((e: any) => ({...e}));

        // D3 Setup
        const width = svgRef.current!.clientWidth;
        const height = svgRef.current!.clientHeight;
        const svg = d3.select(svgRef.current);
        
        svg.selectAll("*").remove(); // Clear previous

        const simulation = d3.forceSimulation(nodes)
          .force("link", d3.forceLink(links).id((d: any) => d.id).distance(60))
          .force("charge", d3.forceManyBody().strength(-120))
          .force("center", d3.forceCenter(width / 2, height / 2))
          .force("collide", d3.forceCollide().radius(12));

        const link = svg.append("g")
          .attr("stroke", "#333")
          .attr("stroke-opacity", 0.6)
          .selectAll("line")
          .data(links)
          .join("line")
          .attr("stroke-width", 1);

        const node = svg.append("g")
          .selectAll("circle")
          .data(nodes)
          .join("circle")
          .attr("r", (d: any) => d.id === centerNode.id ? 10 : 5)
          .attr("fill", (d: any) => d.id === centerNode.id ? "#00ff41" : "#666")
          .attr("stroke", "#000")
          .attr("stroke-width", 1.5);
          
        // Add labels
        const label = svg.append("g")
          .selectAll("text")
          .data(nodes)
          .join("text")
          .text((d: any) => d.id)
          .attr("font-size", (d: any) => d.id === centerNode.id ? "14px" : "10px")
          .attr("font-weight", (d: any) => d.id === centerNode.id ? "bold" : "normal")
          .attr("fill", (d: any) => d.id === centerNode.id ? "#fff" : "#aaa")
          .attr("dx", 12)
          .attr("dy", 4)
          .style("pointer-events", "none")
          .style("opacity", (d: any) => d.id === centerNode.id ? 1 : 0.7);

        simulation.on("tick", () => {
          link
            .attr("x1", (d: any) => d.source.x)
            .attr("y1", (d: any) => d.source.y)
            .attr("x2", (d: any) => d.target.x)
            .attr("y2", (d: any) => d.target.y);

          node
            .attr("cx", (d: any) => d.x)
            .attr("cy", (d: any) => d.y);
            
          label
            .attr("x", (d: any) => d.x)
            .attr("y", (d: any) => d.y);
        });

        setIsLoaded(true);
        
        // Cleanup
        return () => {
          simulation.stop();
        };
      });
  }, []);

  return (
    <div className="w-full h-full relative">
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-4 h-4 bg-terminal-green animate-ping rounded-full"></div>
        </div>
      )}
      <svg ref={svgRef} className="w-full h-full" />
    </div>
  );
};

// Slide definitions
const slides = [
  {
    id: 'title',
    render: () => (
      <div className="flex flex-col items-center justify-center h-full text-center space-y-8">
        <div className="relative">
          <div className="absolute -inset-1 bg-terminal-green blur opacity-20 animate-pulse"></div>
          <h1 className="relative text-6xl md:text-8xl font-bold font-mono tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-gray-500">
            AUDIOGRAPH
            <br />
            NETWORK
          </h1>
        </div>
        <p className="text-xl md:text-2xl text-terminal-green font-mono mt-8 animate-blink">
          &gt; LET'S_DISCOVER_THE_MUSIC_WORLD
        </p>
        <p className="text-gray-400 max-w-2xl mx-auto mt-12">
          音楽アーティストの「共演関係」を可視化し、
          <br />
          新たな文脈での音楽体験を提供するデータビジュアライゼーション
        </p>

        {/* Team Credits */}
        <div className="mt-16 text-sm md:text-base font-mono text-gray-500 border-t border-gray-800 pt-8">
            <p className="mb-4 text-terminal-green">[ Team Tukey ]</p>
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-left">
                <div>Katayama Takumi</div>
                <div>Kobayashi Hikaru</div>
                <div>Maeda Moriumi</div>
                <div>Okawa Wataru</div>
            </div>
        </div>
      </div>
    ),
  },
  {
    id: 'problem',
    render: () => (
      <div className="flex flex-col h-full justify-center max-w-4xl mx-auto px-6">
        <h2 className="text-4xl font-mono text-terminal-green mb-12 border-b border-gray-800 pb-4">
          01_BACKGROUND
        </h2>
        <div className="space-y-8 text-xl text-gray-300">
          <div className="flex items-start space-x-6">
            <span className="text-terminal-green font-bold text-2xl">!</span>
            <div>
              <h3 className="text-white font-bold text-2xl mb-2">音楽探索の「線形性」</h3>
              <p>
                従来のレコメンドやランキングは、人気順やジャンルごとの「リスト」形式が主流。
                アーティスト同士の有機的なつながりが見えにくい。
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-6">
            <span className="text-terminal-green font-bold text-2xl">?</span>
            <div>
              <h3 className="text-white font-bold text-2xl mb-2">「文脈」の喪失</h3>
              <p>
                「誰と誰が仲が良いのか」「どのプロデューサーが関わっているのか」といった
                文脈（Context）情報は、Wikipediaやソーシャルメディアを読み込まないと分からない。
              </p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'solution',
    render: () => (
      <div className="flex flex-col h-full justify-center max-w-4xl mx-auto px-6">
        <h2 className="text-4xl font-mono text-terminal-green mb-12 border-b border-gray-800 pb-4">
          02_SOLUTION
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <h3 className="text-3xl font-bold text-white">Featuring Network</h3>
            <p className="text-gray-400 text-lg leading-relaxed">
              楽曲の<span className="text-terminal-green">Featuring（客演）</span>情報に着目。
              アーティストを「ノード」、共演関係を「エッジ」として定義し、
              巨大なネットワーク図として描画します。
            </p>
            <ul className="space-y-3 text-gray-300 font-mono text-sm border border-gray-800 p-4 rounded bg-black/50">
              <li className="flex items-center">
                <span className="w-2 h-2 bg-terminal-green rounded-full mr-3"></span>
                Spotify API Data Source
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-terminal-green rounded-full mr-3"></span>
                D3.js Force Directed Graph
              </li>
              <li className="flex items-center">
                <span className="w-2 h-2 bg-terminal-green rounded-full mr-3"></span>
                Interactive WebGL Rendering
              </li>
            </ul>
          </div>
          <div className="relative aspect-square rounded-lg overflow-hidden border border-gray-800 bg-gray-900 flex items-center justify-center group">
            {/* Removed gradient overlay for clearer view */}
            <NetworkPreview />
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'tech-stack',
    render: () => (
      <div className="flex flex-col h-full justify-center max-w-5xl mx-auto px-6">
        <h2 className="text-4xl font-mono text-terminal-green mb-12 border-b border-gray-800 pb-4">
          03_SYSTEM_ARCHITECTURE
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="p-6 border border-gray-800 bg-gray-900/30 rounded hover:border-terminal-green transition-colors">
            <h3 className="text-xl font-mono text-gray-400 mb-4">データ構築</h3>
            <div className="text-4xl mb-4">🐍</div>
            <h4 className="text-white font-bold text-lg mb-2">Python</h4>
            <p className="text-sm text-gray-500">
              Spotify API (Spotipy)<br/>
              Pandas for CSV/JSON<br/>
              Recursive Artist Fetching
            </p>
          </div>
          <div className="p-6 border border-gray-800 bg-gray-900/30 rounded hover:border-terminal-green transition-colors">
            <h3 className="text-xl font-mono text-gray-400 mb-4">フロントエンド</h3>
            <div className="text-4xl mb-4">⚛️</div>
            <h4 className="text-white font-bold text-lg mb-2">Next.js (React)</h4>
            <p className="text-sm text-gray-500">
              App Router<br/>
              Tailwind CSS<br/>
              TypeScript
            </p>
          </div>
          <div className="p-6 border border-gray-800 bg-gray-900/30 rounded hover:border-terminal-green transition-colors">
            <h3 className="text-xl font-mono text-gray-400 mb-4">VISUALIZATION</h3>
            <div className="text-4xl mb-4">🕸️</div>
            <h4 className="text-white font-bold text-lg mb-2">D3.js</h4>
            <p className="text-sm text-gray-500">
              Force Simulation<br/>
              SVG / Canvas Rendering<br/>
              Zoom & Pan Behaviors
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'demo',
    render: () => (
      <div className="flex flex-col h-full justify-center items-center px-6 text-center">
        <h2 className="text-4xl font-mono text-terminal-green mb-8">
          04_DEMO
        </h2>
        <div className="w-full max-w-4xl border border-gray-700 rounded-lg overflow-hidden bg-gray-900 aspect-video relative group cursor-pointer hover:border-terminal-green transition-colors">
          <div className="absolute inset-0 flex flex-col items-center justify-center">
             <div className="w-20 h-20 rounded-full border-2 border-white flex items-center justify-center group-hover:scale-110 transition-transform">
                <div className="w-0 h-0 border-t-[15px] border-t-transparent border-l-[25px] border-l-white border-b-[15px] border-b-transparent ml-2"></div>
             </div>
             <p className="mt-6 font-mono text-gray-400">Click to Launch Application</p>
          </div>
          <Link href="/" target="_blank" className="absolute inset-0 z-10" aria-label="Launch Demo" />
        </div>
        <p className="mt-8 text-gray-400 max-w-2xl">
          実際のアプリケーションで、アーティストが織りなす<br/>複雑なネットワークを探索してください。
        </p>
      </div>
    ),
  },
  {
    id: 'future',
    render: () => (
      <div className="flex flex-col h-full justify-center max-w-4xl mx-auto px-6">
        <h2 className="text-4xl font-mono text-terminal-green mb-12 border-b border-gray-800 pb-4">
          05_FUTURE_WORK
        </h2>
        <ul className="space-y-6 text-xl text-gray-300 list-disc list-inside">
          <li className="marker:text-terminal-green">
            <span className="text-white font-bold">データ収集の最適化</span>
            <p className="text-base text-gray-500 ml-6 mt-1">
              Viralチャートやトッププレイリストを活用し、より現在のトレンドを反映した「生きた」アーティストネットワークの抽出を実現したいです。
            </p>
          </li>
          <li className="marker:text-terminal-green">
            <span className="text-white font-bold">楽曲プレビュー再生機能</span>
            <p className="text-base text-gray-500 ml-6 mt-1">
              エッジ（共演関係）をクリックした際に、そのフィーチャリング楽曲を即座に試聴できるプレーヤー機能をがあったら楽しそうです。
            </p>
          </li>
          <li className="marker:text-terminal-green">
            <span className="text-white font-bold">パーソナライズド・ネットワーク</span>
            <p className="text-base text-gray-500 ml-6 mt-1">
              ユーザー自身のSpotifyアカウントと連携し、よく聴くアーティストたちを中心とした独自のネットワーク図を生成したいです。
            </p>
          </li>
        </ul>
        <div className="mt-16 text-center font-mono text-sm text-gray-600">
          THANK YOU FOR WATCHING
        </div>
      </div>
    ),
  }
];

export default function PresentationPage() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isAutoPlay, setIsAutoPlay] = useState(false);

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  }, []);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        nextSlide();
      } else if (e.key === 'ArrowLeft') {
        prevSlide();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide]);

  return (
    <div className="min-h-screen bg-bg text-text-primary font-sans overflow-hidden relative selection:bg-terminal-green selection:text-black">
      {/* Scanline Effect */}
      <div className="scanline pointer-events-none absolute inset-0 z-50"></div>
      
      {/* Header / Meta */}
      <header className="fixed top-0 left-0 w-full p-4 flex justify-between items-center z-40 font-mono text-xs text-gray-500 pointer-events-none">
        <div>AUDIOGRAPH_NETWORK_V1.0</div>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isAutoPlay ? 'bg-red-500 animate-pulse' : 'bg-green-500'}`}></div>
          <span>LIVE</span>
        </div>
      </header>

      {/* Slide Content */}
      <main className="h-screen w-full relative">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-all duration-700 transform ${
              index === currentSlide
                ? 'opacity-100 translate-x-0 scale-100'
                : index < currentSlide
                ? 'opacity-0 -translate-x-full scale-95'
                : 'opacity-0 translate-x-full scale-95'
            }`}
          >
            {slide.render()}
          </div>
        ))}
      </main>

      {/* Controls / Footer */}
      <footer className="fixed bottom-0 left-0 w-full p-6 z-40 flex justify-between items-end">
        {/* Slide Counter */}
        <div className="font-mono text-4xl text-gray-800">
          <span className="text-terminal-green">{String(currentSlide + 1).padStart(2, '0')}</span>
          <span className="text-xl align-top opacity-50">/{String(slides.length).padStart(2, '0')}</span>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-900">
          <div 
            className="h-full bg-terminal-green transition-all duration-300 ease-out"
            style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
          ></div>
        </div>

        {/* Navigation Buttons */}
        <div className="flex space-x-4 font-mono text-sm">
          <button 
            onClick={prevSlide}
            className="px-4 py-2 border border-gray-800 hover:bg-terminal-green hover:text-black hover:border-terminal-green transition-colors disabled:opacity-50"
            disabled={currentSlide === 0}
          >
            [PREV]
          </button>
          <button 
            onClick={nextSlide}
            className="px-4 py-2 border border-gray-800 hover:bg-terminal-green hover:text-black hover:border-terminal-green transition-colors disabled:opacity-50"
            disabled={currentSlide === slides.length - 1}
          >
            [NEXT]
          </button>
        </div>
      </footer>
    </div>
  );
}
