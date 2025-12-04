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
    id: 'story-dataset',
    render: () => (
      <div className="flex flex-col h-full justify-center max-w-4xl mx-auto px-6">
        <h2 className="text-4xl font-mono text-terminal-green mb-12 border-b border-gray-800 pb-4">
          STORY: Dataset
        </h2>
        <div className="space-y-6 text-lg text-gray-300">
          <div>
            <h3 className="text-white font-bold text-2xl mb-4">使用したデータセット</h3>
            <ul className="space-y-3 ml-4">
              <li className="flex items-start">
                <span className="text-terminal-green mr-3">●</span>
                <div>
                  <strong className="text-white">Kaggle: Ultimate Spotify Tracks DB</strong>
                  <p className="text-gray-400 text-sm mt-1">
                    https://www.kaggle.com/datasets/zaheenhamidani/ultimate-spotify-tracks-db
                  </p>
                </div>
              </li>
              <li className="flex items-start">
                <span className="text-terminal-green mr-3">●</span>
                <div>
                  <strong className="text-white">Spotify Web API</strong>
                  <p className="text-gray-400 text-sm mt-1">
                    Python (Spotipy) を使用した楽曲メタデータとフィーチャリング情報の取得
                  </p>
                </div>
              </li>
            </ul>
          </div>
          <div className="mt-8 p-4 bg-gray-900/50 rounded border border-gray-800">
            <p className="text-sm text-gray-400">
              <strong className="text-terminal-green">データ規模:</strong> 525ノード、500エッジ、3,119コラボレーション（国際版）<br/>
              <strong className="text-terminal-green">データ形式:</strong> ノード（アーティスト）、エッジ（共演関係）、トラック情報
            </p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'story-motivation',
    render: () => (
      <div className="flex flex-col h-full justify-center max-w-4xl mx-auto px-6">
        <h2 className="text-4xl font-mono text-terminal-green mb-12 border-b border-gray-800 pb-4">
          STORY: Motivation
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
    id: 'story-message',
    render: () => (
      <div className="flex flex-col h-full justify-center max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-mono text-terminal-green mb-12 border-b border-gray-800 pb-4">
          STORY: Message / Insight
        </h2>
        <div className="grid grid-cols-2 gap-8">
          {/* 左側: メッセージ */}
          <div className="space-y-6 text-lg text-gray-300">
            <div>
              <h3 className="text-white font-bold text-2xl mb-4">データから伝えたいこと</h3>
              <ul className="space-y-4">
                <li className="flex items-start">
                  <span className="text-terminal-green mr-3 text-2xl">→</span>
                  <div>
                    <strong className="text-white">アーティスト間の「隠れたつながり」</strong>
                    <p className="text-gray-400 text-base mt-1">
                      フィーチャリングという形式を通じて、異なるジャンルや世代のアーティストが
                      どのように結びついているかを可視化
                    </p>
                  </div>
                </li>
                <li className="flex items-start">
                  <span className="text-terminal-green mr-3 text-2xl">→</span>
                  <div>
                    <strong className="text-white">探索的な音楽発見</strong>
                    <p className="text-gray-400 text-base mt-1">
                      好きなアーティストから始めて、ネットワークを辿ることで
                      新しい音楽との出会いを提供
                    </p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          {/* 右側: 可視化の例 */}
          <div className="flex items-center justify-center">
            <div className="w-80 h-80 border border-gray-800 rounded overflow-hidden bg-gray-900">
              <NetworkPreview />
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'process',
    render: () => (
      <div className="flex flex-col h-full justify-center max-w-7xl mx-auto px-6">
        <h2 className="text-4xl font-mono text-terminal-green mb-12 border-b border-gray-800 pb-4">
          PROCESS
        </h2>
        <div className="grid grid-cols-2 gap-8">
          {/* 左側: スケッチ（2x2グリッド） */}
          <div>
            <h3 className="text-white font-bold text-xl font-mono text-terminal-green mb-4">Individual Outputs</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-white font-mono text-sm text-gray-400">Katayama Takumi</h4>
                <div className="border border-gray-800 rounded overflow-hidden bg-gray-900 aspect-square max-w-48">
                  <img src="/presentation/Takumi.png" alt="Takumi's output" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-white font-mono text-sm text-gray-400">Kobayashi Hikaru</h4>
                <div className="border border-gray-800 rounded overflow-hidden bg-gray-900 aspect-square max-w-48">
                  <img src="/presentation/Hikaru.png" alt="Hikaru's output" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-white font-mono text-sm text-gray-400">Maeda Moriumi</h4>
                <div className="border border-gray-800 rounded overflow-hidden bg-gray-900 aspect-square max-w-48">
                  <img src="/presentation/Moriumi.png" alt="Moriumi's output" className="w-full h-full object-contain" />
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-white font-mono text-sm text-gray-400">Okawa Wataru</h4>
                <div className="border border-gray-800 rounded overflow-hidden bg-gray-900 aspect-square max-w-48">
                  <img src="/presentation/Wataru.png" alt="Wataru's output" className="w-full h-full object-contain" />
                </div>
              </div>
            </div>
          </div>
          {/* 右側: 統合要素 */}
          <div className="flex items-center">
            <div className="p-6 bg-gray-900/50 rounded border border-gray-800 w-full">
              <h3 className="text-white font-bold text-2xl mb-6 font-mono">個人スケッチの統合</h3>
              <ul className="space-y-4 text-lg text-gray-300">
                <li className="flex items-start">
                  <span className="text-terminal-green mr-3 text-xl">1.</span>
                  <span>Spotifyのデータを使う</span>
                </li>
                <li className="flex items-start">
                  <span className="text-terminal-green mr-3 text-xl">2.</span>
                  <span>平面の散布図にする</span>
                </li>
                <li className="flex items-start">
                  <span className="text-terminal-green mr-3 text-xl">3.</span>
                  <span>アーティストはジャンルや人気度で抽出する</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'prototype-demo',
    render: () => (
      <div className="flex flex-col h-full justify-center items-center px-6 text-center">
        <h2 className="text-4xl font-mono text-terminal-green mb-8">
          PROTOTYPE: Demo
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
    id: 'prototype-design',
    render: () => (
      <div className="flex flex-col h-full justify-center max-w-4xl mx-auto px-6">
        <h2 className="text-4xl font-mono text-terminal-green mb-12 border-b border-gray-800 pb-4">
          PROTOTYPE: Design Choices
        </h2>
        <div className="space-y-6 text-lg text-gray-300">
          <div>
            <h3 className="text-white font-bold text-2xl mb-4">Visualization の構成と意図</h3>
            <ul className="space-y-3 ml-4">
              <li className="flex items-start">
                <span className="text-terminal-green mr-3">●</span>
                <span><strong>ノード:</strong> アーティスト（サイズは共演回数に比例）</span>
              </li>
              <li className="flex items-start">
                <span className="text-terminal-green mr-3">●</span>
                <span><strong>エッジ:</strong> フィーチャリング関係（太さは共演回数に比例）</span>
              </li>
              <li className="flex items-start">
                <span className="text-terminal-green mr-3">●</span>
                <span><strong>フォース指向グラフ:</strong> D3.jsによる物理シミュレーション</span>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-2xl mb-4">こだわった点</h3>
            <ul className="space-y-3 ml-4">
              <li className="flex items-start">
                <span className="text-terminal-green mr-3">→</span>
                <span><strong>ターミナル風UI:</strong> 近未来的なデザインで音楽データを表現</span>
              </li>
              <li className="flex items-start">
                <span className="text-terminal-green mr-3">→</span>
                <span><strong>リアルタイム検索:</strong> アーティスト名で即座にフィルタリング</span>
              </li>
              <li className="flex items-start">
                <span className="text-terminal-green mr-3">→</span>
                <span><strong>ラベル衝突検出:</strong> 可読性を向上させる自動配置</span>
              </li>
              <li className="flex items-start">
                <span className="text-terminal-green mr-3">→</span>
                <span><strong>インタラクティブ性:</strong> ドラッグ&ドロップ、ホバー効果</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'next-steps',
    render: () => (
      <div className="flex flex-col h-full justify-center max-w-4xl mx-auto px-6">
        <h2 className="text-4xl font-mono text-terminal-green mb-12 border-b border-gray-800 pb-4">
          Next Steps
        </h2>
        <ul className="space-y-6 text-xl text-gray-300 list-disc list-inside">
          <li className="marker:text-terminal-green">
            <span className="text-white font-bold">データ収集の最適化</span>
            <p className="text-base text-gray-500 ml-6 mt-1">
              Viralチャートやトッププレイリストを活用し、より現在のトレンドを反映したアーティストネットワークの抽出を実現したいです。
            </p>
          </li>
          <li className="marker:text-terminal-green">
            <span className="text-white font-bold">楽曲プレビュー再生機能</span>
            <p className="text-base text-gray-500 ml-6 mt-1">
              エッジ（共演関係）をクリックした際に、そのフィーチャリング楽曲を試聴できるプレーヤー機能をがあったら楽しそうです。
            </p>
          </li>
          <li className="marker:text-terminal-green">
            <span className="text-white font-bold">データから仮説を立て、それを検証</span>
            <p className="text-base text-gray-500 ml-6 mt-1">
              ネットワーク構造から見えるパターンやクラスタを分析し、音楽業界における共演の傾向やジャンル間の関係性について仮説を立て、データで検証していきたいです。
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
