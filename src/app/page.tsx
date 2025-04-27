"use client";

import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  const handleNavigate = (path: string) => {
    router.push(path);
  };

  return (
    <main className="relative min-h-screen bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Background grid effect */}
      <div className="absolute inset-0 cyber-grid-bg"></div>
      
      {/* Top navigation */}
      <header className="absolute top-0 left-0 w-full flex justify-between items-center p-4 z-20">
        <div className="flex items-center">
          <div className="text-3xl font-['VT323'] text-cyan-400 tracking-wider">
            CRICKETVERSE
          </div>
        </div>
        
        <nav className="flex gap-8">
          <Link href="/" className="text-white hover:text-cyan-400 font-['VT323'] text-xl transition-colors">
            HOME
          </Link>
          <Link href="/auction" className="text-white hover:text-cyan-400 font-['VT323'] text-xl transition-colors">
            GAMES
          </Link>
          <Link href="/about" className="text-white hover:text-cyan-400 font-['VT323'] text-xl transition-colors">
            ABOUT
          </Link>
        </nav>
        
        <div>
          <button 
            onClick={() => handleNavigate('/quick-match')}
            className="cyber-button-primary">
            CONNECT
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="relative z-10 text-center mt-16 mb-8 w-full px-4">
        <h1 className="text-6xl md:text-8xl font-['VT323'] tracking-wider mb-4 text-white">
          <span className="inline-block animate-pulse-glow text-cyan-400 glow">BID</span>
          <span className="inline-block text-white">-</span>
          <span className="inline-block text-pink-400 glow">ION</span>
        </h1>
        
        <div className="flex justify-center gap-8 mt-6 text-xl font-['VT323']">
          <div className="text-cyan-400">COLLECT</div>
          <div className="text-green-400">BATTLE</div>
          <div className="text-pink-400">AUCTION</div>
        </div>
        
        <p className="mt-8 mb-12 mx-auto text-gray-300 w-full">
          The ultimate cricket gaming platform where you can collect player NFTs, 
          battle in trump card matches, and participate in exciting auctions on the Monad chain.
        </p>

        <div className="flex flex-wrap justify-center gap-6 mt-8">
          <Link href="/quick-match" passHref>
            <button 
              className="cyber-button-primary text-lg">
              PLAY TRUMP CARDS
            </button>
          </Link>
          <Link href="/auction" passHref>
            <button 
              className="cyber-button-secondary text-lg">
              JOIN AUCTION
            </button>
          </Link>
        </div>
      </div>
      
      {/* 3D coin animation placeholder */}
      <div className="absolute z-0 opacity-60 animate-pulse" style={{top: '30%', right: '15%'}}>
        <div className="h-16 w-16 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-600 shadow-[0_0_20px_rgba(234,179,8,0.6)]"></div>
      </div>
      
      {/* Floating geometry elements for cyberpunk aesthetic */}
      <div className="absolute z-0 border border-cyan-500/30 h-20 w-20 rotate-45 opacity-70" 
           style={{top: '20%', left: '15%'}}></div>
      <div className="absolute z-0 border border-pink-500/30 h-32 w-32 rounded-full opacity-50" 
           style={{bottom: '15%', right: '20%'}}></div>
      <div className="absolute z-0 border-l-2 border-cyan-500/40 h-40 opacity-60 -rotate-45" 
           style={{bottom: '10%', left: '30%'}}></div>
    </main>
  );
}
