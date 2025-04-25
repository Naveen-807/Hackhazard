"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';

export default function Home() {
  // Animation state for fade-in
  const [show, setShow] = useState(false);
  const [hoveredMode, setHoveredMode] = useState<null | 'quick' | 'auction'>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    setTimeout(() => setShow(true), 100);
    
    // Create mouse-following particles
    if (particlesRef.current) {
      const container = particlesRef.current;
      const createParticle = (x: number, y: number) => {
        const particle = document.createElement('div');
        particle.className = 'absolute w-2 h-2 rounded-full bg-gradient-to-r from-blue-400 to-purple-500 opacity-70';
        particle.style.left = `${x}px`;
        particle.style.top = `${y}px`;
        container.appendChild(particle);
        
        // Random movement animation
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 3;
        const size = 2 + Math.random() * 6;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        
        let opacityValue = 0.7;
        let posX = x;
        let posY = y;
        
        const animate = () => {
          opacityValue -= 0.01;
          posX += Math.cos(angle) * speed;
          posY += Math.sin(angle) * speed;
          
          particle.style.opacity = String(opacityValue);
          particle.style.transform = `translate(${Math.cos(angle) * 10}px, ${Math.sin(angle) * 10}px)`;
          
          if (opacityValue > 0) {
            requestAnimationFrame(animate);
          } else {
            particle.remove();
          }
        };
        
        requestAnimationFrame(animate);
      };
      
      const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        if (Math.random() > 0.85) {
          createParticle(x, y);
        }
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      return () => document.removeEventListener('mousemove', handleMouseMove);
    }
  }, []);

  // Simple AI-vs-AI teaser (random player cards, animated stat highlight)
  const teaserPlayers = [
    {
      name: 'AI Team Alpha',
      team: 'Super Kings',
      photo: '/assets/players/player1.png',
      rarity: 'Epic',
      stats: { Batting: 42, Bowling: 30, Fitness: 80, Popularity: 90 }
    },
    {
      name: 'AI Team Beta',
      team: 'Knight Riders',
      photo: '/assets/players/player2.png',
      rarity: 'Rare',
      stats: { Batting: 38, Bowling: 44, Fitness: 75, Popularity: 85 }
    }
  ];
  const [teaserStat, setTeaserStat] = useState<'Batting'|'Bowling'|'Fitness'|'Popularity'>('Batting');
  
  useEffect(() => {
    const stats = ['Batting', 'Bowling', 'Fitness', 'Popularity'];
    let idx = 0;
    const interval = setInterval(() => {
      setTeaserStat(stats[idx % stats.length] as any);
      idx++;
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#05061B] overflow-hidden relative">
      {/* Dynamic particles */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none z-10" />
      
      {/* Animated noise background */}
      <div className="absolute inset-0 bg-[#05061B] z-0 opacity-70">
        <div className="absolute inset-0 opacity-20 mix-blend-overlay">
          <svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%">
            <filter id="noise">
              <feTurbulence type="fractalNoise" baseFrequency="0.80" numOctaves="4" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noise)" />
          </svg>
        </div>
      </div>
      
      {/* Animated glow effects */}
      <div className="absolute inset-0 overflow-hidden z-0">
        <div className="absolute -left-[10%] -top-[10%] w-[40%] h-[40%] bg-purple-700/20 rounded-full blur-[120px] animate-pulse-slow" />
        <div className="absolute -right-[10%] -bottom-[10%] w-[40%] h-[40%] bg-blue-700/20 rounded-full blur-[120px] animate-pulse-slower" />
        <div className="absolute left-[30%] bottom-[5%] w-[20%] h-[20%] bg-pink-700/20 rounded-full blur-[100px] animate-float-slow" />
      </div>

      {/* Content container with z-index to appear above effects */}
      <div className="relative z-20 max-w-7xl mx-auto px-4 py-12">
        {/* Header with animated logo */}
        <div className="flex flex-col items-center mb-12 animate-fade-in">
          {/* 3D animated logo */}
          <div className="perspective-1000 mb-3">
            <div className="relative w-32 h-32 animate-slow-spin">
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-600 via-blue-500 to-emerald-400 animate-pulse-slow shadow-[0_0_40px_#6617cb]" style={{ transform: 'translateZ(20px)' }}></div>
              <img 
                src="/assets/players/player1.png" 
                alt="IPL Player" 
                className="absolute inset-0 w-full h-full object-cover rounded-full border-4 border-indigo-500/70 shadow-xl" 
                style={{ transform: 'translateZ(30px)' }}
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-indigo-500/30 rounded-full" style={{ transform: 'translateZ(40px)' }}></div>
              <div className="absolute -inset-3 border-4 border-dashed border-indigo-500/30 rounded-full animate-reverse-spin"></div>
            </div>
          </div>
          
          {/* Animated title with text effects */}
          <h1 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-300 via-blue-400 to-purple-400 text-center tracking-tight drop-shadow-[0_0_8px_rgba(123,97,255,0.4)] animate-text-shimmer">
            IPL TRUMP CARD
          </h1>
          <p className="text-lg md:text-xl bg-gradient-to-r from-emerald-300 via-blue-300 to-purple-300 bg-clip-text text-transparent font-medium mt-2 tracking-wide animate-pulse">
            BATTLE • DRAFT • DOMINATE
          </p>
        </div>

        {/* Pre-auction teaser: 3D Card Battle */}
        <div className="w-full max-w-3xl mx-auto flex flex-col items-center mb-16 animate-fade-in-slow">
          <div className="relative text-center w-full">
            <div className="absolute left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-500 to-transparent"></div>
            <span className="relative bg-[#05061B] text-indigo-300 text-lg font-semibold tracking-wider px-6 uppercase">LIVE BATTLE PREVIEW</span>
          </div>
          
          <div className="flex gap-8 items-center justify-center w-full mt-8 perspective">
            {/* AI Card 1 - 3D effect */}
            <div 
              className="relative w-44 h-64 card-3d rounded-xl transform transition-all duration-500 hover:rotate-y-5 hover:scale-110"
              style={{ 
                transformStyle: 'preserve-3d',
                boxShadow: '0 0 20px rgba(93, 63, 211, 0.3), 0 0 40px rgba(93, 63, 211, 0.2)' 
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 rounded-xl border-2 border-blue-500/30" style={{ transform: 'translateZ(0)' }}></div>
              <img src={teaserPlayers[0].photo} alt={teaserPlayers[0].name} className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full object-cover border-2 border-white/70 z-10" style={{ transform: 'translateZ(10px)' }} />
              <div className="absolute top-[5.5rem] inset-x-0 text-center" style={{ transform: 'translateZ(5px)' }}>
                <div className="text-white text-lg font-bold truncate px-2">{teaserPlayers[0].name}</div>
                <div className="text-blue-200 text-xs">{teaserPlayers[0].team}</div>
              </div>
              <div className="absolute bottom-4 inset-x-4" style={{ transform: 'translateZ(5px)' }}>
                {Object.entries(teaserPlayers[0].stats).map(([key, value]) => (
                  <div key={key} className={`flex justify-between py-0.5 rounded text-sm ${key === teaserStat ? 'bg-blue-500/80 text-white font-bold animate-pulse px-2' : 'text-blue-200'}`}>
                    <span>{key}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
              <div className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded bg-gradient-to-r from-pink-600 to-purple-600 text-white font-bold z-10">{teaserPlayers[0].rarity}</div>
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-blue-500/10 rounded-xl" style={{ transform: 'translateZ(2px)' }}></div>
            </div>
            
            {/* VS - glowing effect */}
            <div className="text-3xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.7)] animate-pulse-glow transform animate-float-y">VS</div>
            
            {/* AI Card 2 - 3D effect */}
            <div 
              className="relative w-44 h-64 card-3d rounded-xl transform transition-all duration-500 hover:rotate-y-[-5deg] hover:scale-110"
              style={{ 
                transformStyle: 'preserve-3d',
                boxShadow: '0 0 20px rgba(165, 61, 145, 0.3), 0 0 40px rgba(165, 61, 145, 0.2)' 
              }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-purple-800 to-pink-900 rounded-xl border-2 border-purple-500/30" style={{ transform: 'translateZ(0)' }}></div>
              <img src={teaserPlayers[1].photo} alt={teaserPlayers[1].name} className="absolute top-4 left-1/2 transform -translate-x-1/2 w-16 h-16 rounded-full object-cover border-2 border-white/70 z-10" style={{ transform: 'translateZ(10px)' }} />
              <div className="absolute top-[5.5rem] inset-x-0 text-center" style={{ transform: 'translateZ(5px)' }}>
                <div className="text-white text-lg font-bold truncate px-2">{teaserPlayers[1].name}</div>
                <div className="text-purple-200 text-xs">{teaserPlayers[1].team}</div>
              </div>
              <div className="absolute bottom-4 inset-x-4" style={{ transform: 'translateZ(5px)' }}>
                {Object.entries(teaserPlayers[1].stats).map(([key, value]) => (
                  <div key={key} className={`flex justify-between py-0.5 rounded text-sm ${key === teaserStat ? 'bg-purple-500/80 text-white font-bold animate-pulse px-2' : 'text-purple-200'}`}>
                    <span>{key}</span>
                    <span>{value}</span>
                  </div>
                ))}
              </div>
              <div className="absolute top-2 right-2 text-xs px-2 py-0.5 rounded bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold z-10">{teaserPlayers[1].rarity}</div>
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-purple-500/10 rounded-xl" style={{ transform: 'translateZ(2px)' }}></div>
            </div>
          </div>
          
          <div className="mt-8 text-center">
            <p className="text-lg text-cyan-300 font-medium animate-pulse">Who will win the auction? Be part of the action!</p>
          </div>
        </div>

        {/* Game mode selection - Premium interactive cards */}
        <div className={`w-full max-w-3xl mx-auto flex flex-col items-center gap-8 transition-opacity duration-1000 ${show ? 'opacity-100' : 'opacity-0'}`}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full perspective">
            {/* Quick Match - 3D Interactive Card */}
            <div 
              className={`group relative rounded-2xl bg-gradient-to-br from-emerald-900/80 to-blue-900/90 p-1.5 transition-transform duration-300 ${hoveredMode === 'quick' ? 'scale-105 rotate-1' : ''}`}
              onMouseEnter={() => setHoveredMode('quick')}
              onMouseLeave={() => setHoveredMode(null)}
            >
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute inset-0 rounded-2xl bg-[url('/assets/cricket-stadium-blur.jpg')] bg-cover bg-center opacity-20 mix-blend-luminosity"></div>
              </div>
              
              <div className="relative flex flex-col h-full bg-[#05061B]/40 backdrop-blur-sm rounded-xl p-6 border border-emerald-500/20">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-blue-500 rounded-t-xl"></div>
                
                <div className="mb-4 flex justify-between items-start">
                  <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-blue-400">Quick Match</h2>
                  <span className="px-3 py-1 rounded-full bg-emerald-600/30 text-emerald-400 text-xs font-semibold">INSTANT PLAY</span>
                </div>
                
                <p className="text-emerald-100/90 mb-6">Battle instantly with randomly assigned players. Full trump card experience with no setup required!</p>
                
                <div className="mt-auto">
                  <Link href="/quick-match" className="block overflow-hidden relative group/btn">
                    <div className="absolute inset-0 bg-gradient-to-r from-emerald-500 to-blue-500 group-hover/btn:animate-hue-rotate"></div>
                    <button className="relative py-3 px-8 w-full rounded-lg bg-[#0d1230] text-lg font-bold text-emerald-100 group-hover/btn:bg-opacity-80 transition-all border border-emerald-500/40 group-hover/btn:border-emerald-400/80">
                      Start Quick Match
                      <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-20 bg-ripple"></div>
                    </button>
                  </Link>
                </div>
              </div>
            </div>

            {/* Auction Mode - 3D Interactive Card */}
            <div 
              className={`group relative rounded-2xl bg-gradient-to-br from-yellow-900/80 to-pink-900/90 p-1.5 transition-transform duration-300 ${hoveredMode === 'auction' ? 'scale-105 -rotate-1' : ''}`}
              onMouseEnter={() => setHoveredMode('auction')}
              onMouseLeave={() => setHoveredMode(null)}
            >
              <div className="absolute inset-0 rounded-2xl overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="absolute inset-0 rounded-2xl bg-[url('/assets/cricket-stadium-blur.jpg')] bg-cover bg-center opacity-20 mix-blend-luminosity"></div>
              </div>
              
              <div className="relative flex flex-col h-full bg-[#05061B]/40 backdrop-blur-sm rounded-xl p-6 border border-pink-500/20">
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-500 to-pink-500 rounded-t-xl"></div>
                
                <div className="mb-4 flex justify-between items-start">
                  <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-yellow-400 to-pink-400">Auction Mode</h2>
                  <span className="px-3 py-1 rounded-full bg-pink-600/30 text-pink-400 text-xs font-semibold">PREMIUM</span>
                </div>
                
                <p className="text-pink-100/90 mb-6">Join a live player auction against AI bots, draft your team, then battle in trump card style!</p>
                
                <div className="mt-auto">
                  <Link href="/auction" className="block overflow-hidden relative group/btn">
                    <div className="absolute inset-0 bg-gradient-to-r from-yellow-500 to-pink-500 group-hover/btn:animate-hue-rotate"></div>
                    <button className="relative py-3 px-8 w-full rounded-lg bg-[#0d1230] text-lg font-bold text-pink-100 group-hover/btn:bg-opacity-80 transition-all border border-pink-500/40 group-hover/btn:border-pink-400/80">
                      Enter Auction Mode
                      <div className="absolute inset-0 opacity-0 group-hover/btn:opacity-20 bg-ripple"></div>
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Footer with network status */}
          <div className="mt-12 w-full flex flex-col items-center">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-green-400 text-sm font-medium">Monad Testnet Connected</span>
            </div>
            <p className="text-center text-indigo-300 text-xs opacity-80">
              All visuals and logic are Web3-inspired, but run on pure Web2. No wallet required for Quick Match.
            </p>
            <p className="mt-3 text-center text-xs text-indigo-400/60 tracking-widest font-light">
              MADE WITH <span className="text-pink-500">♥</span> FOR IPL FANS
            </p>
          </div>
        </div>
      </div>

      {/* Advanced animated style definitions */}
      <style jsx global>{`
        .perspective-1000 { perspective: 1000px; }
        .perspective { perspective: 2000px; }
        .card-3d { transition: transform 0.6s cubic-bezier(0.23, 1, 0.32, 1); }
        .rotate-y-5 { transform: rotateY(5deg); }
        .rotate-y-\\[-5deg\\] { transform: rotateY(-5deg); }
        
        @keyframes spin-slow { 0% { transform: rotate(0deg);} 100% { transform: rotate(360deg);} }
        .animate-slow-spin { animation: spin-slow 15s linear infinite; }
        .animate-reverse-spin { animation: spin-slow 20s linear infinite reverse; }
        
        @keyframes pulse-slow { 0%, 100% { opacity: 0.6; } 50% { opacity: 0.9; } }
        .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
        .animate-pulse-slower { animation: pulse-slow 7s ease-in-out infinite; }
        
        @keyframes fade-in { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fade-in 1.2s ease; }
        .animate-fade-in-slow { animation: fade-in 2.2s ease; }
        
        @keyframes float-y { 0%, 100% { transform: translateY(0px); } 50% { transform: translateY(-8px); } }
        .animate-float-y { animation: float-y 2s ease-in-out infinite; }
        
        @keyframes pulse-glow { 
          0%, 100% { text-shadow: 0 0 10px rgba(255,255,255,0.7); } 
          50% { text-shadow: 0 0 20px rgba(255,255,255,0.9), 0 0 30px rgba(99,102,241,0.8); } 
        }
        .animate-pulse-glow { animation: pulse-glow 2s ease-in-out infinite; }
        
        @keyframes hue-rotate {
          0% { filter: hue-rotate(0deg); }
          100% { filter: hue-rotate(360deg); }
        }
        .animate-hue-rotate { animation: hue-rotate 10s linear infinite; }
        
        @keyframes text-shimmer {
          0% { background-position: -500px 0; }
          100% { background-position: 500px 0; }
        }
        .animate-text-shimmer {
          background-size: 500px 100%;
          animation: text-shimmer 8s infinite linear;
        }
        
        @keyframes ripple {
          0% { transform: scale(0); opacity: 1; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        .bg-ripple:after {
          content: "";
          display: block;
          position: absolute;
          width: 100%;
          height: 100%;
          top: 0;
          left: 0;
          background: radial-gradient(circle, white 10%, transparent 10.01%) center/15000% no-repeat;
          animation: ripple 0.65s ease-out;
        }
        .bg-ripple:active:after {
          background-size: 0% 0%;
          transition: 0s;
        }

        /* Custom scrollbar for webkit browsers */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #0d1133;
        }
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #6366f1, #8b5cf6);
          border-radius: 4px;
        }
      `}</style>
    </main>
  );
}
