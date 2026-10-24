import React, { useState, useEffect, useRef, useCallback } from 'react';
import { SkipForward } from 'lucide-react';

export const SEVAIQ_INTRO_SEEN_KEY = 'sevaiq_intro_seen';

function getSessionStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) {
      return window.sessionStorage;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).sessionStorage) {
      return (globalThis as any).sessionStorage;
    }
  } catch {
    // Restricted environment fallback
  }
  return null;
}

/**
 * Check whether the visitor has already seen the SevAIQ cinematic intro in the current browser session.
 */
export function hasSeenIntro(): boolean {
  try {
    const storage = getSessionStorage();
    if (!storage) return false;
    return storage.getItem(SEVAIQ_INTRO_SEEN_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Mark the intro as completed in sessionStorage.
 */
export function markIntroSeen(): void {
  try {
    const storage = getSessionStorage();
    if (storage) {
      storage.setItem(SEVAIQ_INTRO_SEEN_KEY, 'true');
    }
  } catch {
    // Ignore storage errors in restricted iframe/private mode
  }
}

/**
 * Reset intro status so it can be replayed.
 */
export function resetIntroSeen(): void {
  try {
    const storage = getSessionStorage();
    if (storage) {
      storage.removeItem(SEVAIQ_INTRO_SEEN_KEY);
    }
  } catch {
    // Ignore
  }
}

export type IntroPhase = 'signal' | 'emblem' | 'reveal' | 'exit';

export interface SevAIQIntroProps {
  /**
   * Callback fired when the intro finishes its animation sequence or is dismissed via Skip.
   */
  onComplete: () => void;
  /**
   * Force play regardless of reduced-motion or prior status (used when user clicks "Replay Intro").
   */
  forcePlay?: boolean;
}

// Subtle ambient micro-particles with fixed deterministic coordinates
const PARTICLES = [
  { id: 1, top: '18%', left: '22%', px: '-18px', py: '-35px', delay: '0.2s', size: 'w-1 h-1' },
  { id: 2, top: '28%', left: '78%', px: '22px', py: '-45px', delay: '0.8s', size: 'w-1.5 h-1.5' },
  { id: 3, top: '42%', left: '14%', px: '-12px', py: '-28px', delay: '1.2s', size: 'w-1 h-1' },
  { id: 4, top: '38%', left: '86%', px: '16px', py: '-36px', delay: '0.5s', size: 'w-1 h-1' },
  { id: 5, top: '65%', left: '18%', px: '-20px', py: '-40px', delay: '1.5s', size: 'w-1.5 h-1.5' },
  { id: 6, top: '72%', left: '80%', px: '15px', py: '-30px', delay: '0.4s', size: 'w-1 h-1' },
  { id: 7, top: '82%', left: '28%', px: '-14px', py: '-35px', delay: '1.0s', size: 'w-1 h-1' },
  { id: 8, top: '80%', left: '68%', px: '20px', py: '-42px', delay: '1.7s', size: 'w-1.5 h-1.5' },
  { id: 9, top: '22%', left: '48%', px: '8px', py: '-50px', delay: '0.9s', size: 'w-1 h-1' },
  { id: 10, top: '75%', left: '46%', px: '-8px', py: '-32px', delay: '1.3s', size: 'w-1 h-1' },
];

export const SevAIQIntro: React.FC<SevAIQIntroProps> = ({
  onComplete,
  forcePlay = false,
}) => {
  const [phase, setPhase] = useState<IntroPhase>('signal');
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [isReducedMotion, setIsReducedMotion] = useState<boolean>(false);
  const timerIdsRef = useRef<number[]>([]);
  const hasFinishedRef = useRef<boolean>(false);

  const clearAllTimers = useCallback(() => {
    timerIdsRef.current.forEach((id) => clearTimeout(id));
    timerIdsRef.current = [];
  }, []);

  const handleFinish = useCallback(() => {
    if (hasFinishedRef.current) return;
    hasFinishedRef.current = true;
    clearAllTimers();
    markIntroSeen();
    onComplete();
  }, [clearAllTimers, onComplete]);

  const handleSkip = useCallback(() => {
    if (hasFinishedRef.current) return;
    setIsFadingOut(true);
    clearAllTimers();
    const skipTimer = window.setTimeout(() => {
      handleFinish();
    }, 280);
    timerIdsRef.current.push(skipTimer);
  }, [clearAllTimers, handleFinish]);

  useEffect(() => {
    // Detect prefers-reduced-motion
    let motionReduced = false;
    if (typeof window !== 'undefined' && window.matchMedia) {
      motionReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      setIsReducedMotion(motionReduced);
    }

    if (motionReduced && !forcePlay) {
      // For reduced motion: brief 500ms static logo display then smooth fade out
      setPhase('reveal');
      const reducedTimer = window.setTimeout(() => {
        setIsFadingOut(true);
        const exitTimer = window.setTimeout(() => {
          handleFinish();
        }, 300);
        timerIdsRef.current.push(exitTimer);
      }, 550);
      timerIdsRef.current.push(reducedTimer);
      return () => clearAllTimers();
    }

    // Standard 4-Scene Cinematic Timeline:
    // Scene 1: 0.0s – 1.0s (The Signal)
    // Scene 2: 1.0s – 2.3s (The Emblem Reveal)
    const tEmblem = window.setTimeout(() => {
      setPhase('emblem');
    }, 1000);

    // Scene 3: 2.3s – 3.5s (The SevAIQ Reveal)
    const tReveal = window.setTimeout(() => {
      setPhase('reveal');
    }, 2300);

    // Scene 4: 3.5s – 4.8s (Enter the Website)
    const tExit = window.setTimeout(() => {
      setPhase('exit');
    }, 3500);

    // Start overlay fade-out at 4.2s
    const tFade = window.setTimeout(() => {
      setIsFadingOut(true);
    }, 4200);

    // Complete at 4.8s
    const tDone = window.setTimeout(() => {
      handleFinish();
    }, 4800);

    timerIdsRef.current.push(tEmblem, tReveal, tExit, tFade, tDone);

    return () => clearAllTimers();
  }, [clearAllTimers, forcePlay, handleFinish]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="SevAIQ Website Introduction"
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#071225] select-none overflow-hidden transition-opacity duration-500 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100 pointer-events-auto'
      }`}
      style={{
        background: 'radial-gradient(ellipse 90% 80% at 50% 45%, #0e223f 0%, #071225 65%, #030713 100%)',
      }}
    >
      {/* Background Ambient Star Micro-Particles */}
      {!isReducedMotion && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-75" aria-hidden="true">
          {PARTICLES.map((p) => (
            <span
              key={p.id}
              className={`absolute rounded-full bg-teal-300/40 animate-sevaiq-particle ${p.size}`}
              style={
                {
                  top: p.top,
                  left: p.left,
                  animationDelay: p.delay,
                  '--px': p.px,
                  '--py': p.py,
                } as React.CSSProperties
              }
            />
          ))}
        </div>
      )}

      {/* Subtle Circuit Grid Overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-20"
        aria-hidden="true"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, rgba(32, 201, 183, 0.25) 1px, transparent 0)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Cinematic Horizontal Anamorphic Light Beam */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[340px] sm:w-[580px] md:w-[720px] h-[1.5px] bg-gradient-to-r from-transparent via-[#20C9B7]/50 to-transparent pointer-events-none transition-all duration-1000 ${
          phase === 'signal'
            ? 'scale-x-75 opacity-40'
            : phase === 'emblem'
            ? 'scale-x-100 opacity-60'
            : phase === 'reveal'
            ? 'scale-x-110 opacity-70'
            : 'scale-x-125 opacity-20'
        }`}
        aria-hidden="true"
      />

      {/* Radial Energy Bloom (Scene 4 Expansion) */}
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 sm:w-96 sm:h-96 rounded-full pointer-events-none transition-all duration-700 ${
          phase === 'exit'
            ? 'animate-sevaiq-bloom bg-radial from-teal-400/25 via-blue-500/15 to-transparent'
            : 'opacity-0 scale-50'
        }`}
        aria-hidden="true"
      />

      {/* Top Right: Skip Intro Button */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-50">
        <button
          type="button"
          onClick={handleSkip}
          className="group flex items-center gap-2 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-full bg-slate-900/80 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700/80 hover:border-teal-400/60 backdrop-blur-md text-xs sm:text-sm font-medium tracking-wide shadow-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-teal-400 focus:ring-offset-2 focus:ring-offset-slate-950 cursor-pointer select-none"
          aria-label="Skip Introduction"
        >
          <span>Skip Intro</span>
          <SkipForward className="w-3.5 h-3.5 text-teal-400 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Central Cinematic Canvas */}
      <div className="relative z-10 flex flex-col items-center justify-center max-w-lg mx-auto px-4 text-center">
        {/* ========================================================
            SCENE 1: Central Saffron Ignition Spark (0.0s - 1.0s)
           ======================================================== */}
        <div
          className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 transition-opacity duration-500 pointer-events-none ${
            phase === 'signal' ? 'opacity-100 scale-100' : 'opacity-0 scale-150'
          }`}
          aria-hidden="true"
        >
          <div className="relative flex items-center justify-center w-12 h-12">
            <span className="animate-ping absolute inline-flex h-8 w-8 rounded-full bg-[#FF9F2F] opacity-75" />
            <div className="w-4 h-4 rounded-full bg-gradient-to-tr from-[#FF9F2F] to-[#FFD166] animate-sevaiq-spark shadow-[0_0_24px_rgba(255,159,47,0.9)]" />
          </div>
        </div>

        {/* ========================================================
            SCENE 2: The SevAIQ AI & Citizen Emblem Reveal
           ======================================================== */}
        <div className="relative flex items-center justify-center mb-4 sm:mb-6">
          <svg
            viewBox="0 0 240 240"
            className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 drop-shadow-[0_0_25px_rgba(32,201,183,0.35)]"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="SevAIQ AI and Citizen Service Emblem"
          >
            <defs>
              {/* Soft Drop Glow Filter */}
              <filter id="sevaiq-soft-glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>

              {/* Teal-to-Blue Linear Gradient for Orbit Track 1 */}
              <linearGradient id="sevaiq-grad-teal" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#20C9B7" />
                <stop offset="100%" stopColor="#155EEF" />
              </linearGradient>

              {/* Blue-to-Sky Linear Gradient for Orbit Track 2 */}
              <linearGradient id="sevaiq-grad-blue" x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#155EEF" />
                <stop offset="100%" stopColor="#38BDF8" />
              </linearGradient>

              {/* Saffron Beacon Linear Gradient */}
              <linearGradient id="sevaiq-grad-saffron" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFC837" />
                <stop offset="100%" stopColor="#FF8008" />
              </linearGradient>

              {/* Soundwave Gradient */}
              <linearGradient id="sevaiq-grad-wave" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" />
                <stop offset="50%" stopColor="#20C9B7" />
                <stop offset="100%" stopColor="#155EEF" />
              </linearGradient>
            </defs>

            {/* Lateral Circuit Lines (Connecting outward into society) */}
            <g className={phase === 'signal' ? 'animate-sevaiq-circuit' : 'opacity-60'} stroke="#20C9B7" strokeWidth="1.5" strokeLinecap="round">
              <path d="M 12 120 L 44 120" />
              <path d="M 22 108 L 36 120" />
              <path d="M 196 120 L 228 120" />
              <path d="M 218 108 L 204 120" />
              <circle cx="12" cy="120" r="2.5" fill="#20C9B7" />
              <circle cx="228" cy="120" r="2.5" fill="#20C9B7" />
            </g>

            {/* Inner Segmented Compass/Radar Orbit */}
            <circle
              cx="120"
              cy="120"
              r="60"
              stroke="rgba(255, 255, 255, 0.12)"
              strokeWidth="1.2"
              strokeDasharray="4 6"
            />

            {/* Outer Circular Shield Arcs (Drawn during Scene 1 & locked in Scene 2) */}
            <path
              d="M 44 120 A 76 76 0 0 1 196 120"
              stroke="url(#sevaiq-grad-teal)"
              strokeWidth="3.2"
              strokeLinecap="round"
              className={phase === 'signal' ? 'animate-sevaiq-orbit' : 'opacity-90'}
              filter="url(#sevaiq-soft-glow)"
            />
            <path
              d="M 196 120 A 76 76 0 0 1 44 120"
              stroke="url(#sevaiq-grad-blue)"
              strokeWidth="3.2"
              strokeLinecap="round"
              className={phase === 'signal' ? 'animate-sevaiq-orbit' : 'opacity-90'}
              filter="url(#sevaiq-soft-glow)"
            />

            {/* Protective Civic Base Cradle (Emblem Base) */}
            <path
              d="M 72 152 C 94 186 146 186 168 152"
              stroke="url(#sevaiq-grad-teal)"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity={phase === 'signal' ? 0.3 : 0.85}
              className="transition-opacity duration-700"
            />

            {/* Top Saffron Beacon Spark (Node of Public Service Flame) */}
            <g
              transform="translate(120, 44)"
              className="transition-transform duration-500"
              filter="url(#sevaiq-soft-glow)"
            >
              <circle cx="0" cy="0" r="4.5" fill="url(#sevaiq-grad-saffron)" />
              <circle cx="0" cy="0" r="8" stroke="#FF9F2F" strokeWidth="1" opacity="0.6" />
            </g>

            {/* Dynamic Voice AI Equalizer Waves (Representing Voice Accessibility & AI Listening) */}
            <g
              className={`transition-all duration-700 ${
                phase === 'signal' ? 'opacity-20 scale-y-50' : 'opacity-100 scale-y-100'
              }`}
              transform="translate(0, 0)"
            >
              {/* Wave Bar 1 */}
              <rect
                x="86"
                y="106"
                width="5"
                height="28"
                rx="2.5"
                fill="url(#sevaiq-grad-wave)"
                className={phase !== 'signal' && !isReducedMotion ? 'animate-sevaiq-wave-1' : ''}
              />
              {/* Wave Bar 2 */}
              <rect
                x="103"
                y="90"
                width="5"
                height="60"
                rx="2.5"
                fill="url(#sevaiq-grad-wave)"
                className={phase !== 'signal' && !isReducedMotion ? 'animate-sevaiq-wave-2' : ''}
              />
              {/* Wave Bar 3 (Center Anchor) */}
              <rect
                x="120"
                y="74"
                width="5"
                height="92"
                rx="2.5"
                fill="#F8FAFC"
                className={phase !== 'signal' && !isReducedMotion ? 'animate-sevaiq-wave-3' : ''}
              />
              {/* Wave Bar 4 */}
              <rect
                x="137"
                y="90"
                width="5"
                height="60"
                rx="2.5"
                fill="url(#sevaiq-grad-wave)"
                className={phase !== 'signal' && !isReducedMotion ? 'animate-sevaiq-wave-4' : ''}
              />
              {/* Wave Bar 5 */}
              <rect
                x="154"
                y="106"
                width="5"
                height="28"
                rx="2.5"
                fill="url(#sevaiq-grad-wave)"
                className={phase !== 'signal' && !isReducedMotion ? 'animate-sevaiq-wave-5' : ''}
              />

              {/* Central Neural Intelligence Rhombus Node */}
              <polygon
                points="122.5,108 134.5,120 122.5,132 110.5,120"
                fill="#071225"
                stroke="#20C9B7"
                strokeWidth="2"
                filter="url(#sevaiq-soft-glow)"
              />
              <circle cx="122.5" cy="120" r="3" fill="#FF9F2F" />
            </g>
          </svg>
        </div>

        {/* ========================================================
            SCENE 3: The SevAIQ Wordmark & Tagline Reveal
           ======================================================== */}
        <div
          className={`flex flex-col items-center transition-all duration-700 ${
            phase === 'reveal' || phase === 'exit'
              ? 'opacity-100 translate-y-0 animate-sevaiq-wordmark'
              : 'opacity-0 translate-y-4 pointer-events-none'
          }`}
        >
          {/* Wordmark: Exact typography 'SevAIQ' */}
          <div className="flex items-center justify-center tracking-tight leading-none">
            <span className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white font-sans drop-shadow-[0_2px_12px_rgba(255,255,255,0.2)]">
              Sev
            </span>
            <span className="text-4xl sm:text-5xl md:text-6xl font-black bg-gradient-to-r from-[#20C9B7] via-[#2DD4BF] to-[#38BDF8] bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(32,201,183,0.5)]">
              AI
            </span>
            <span className="relative text-4xl sm:text-5xl md:text-6xl font-extrabold text-white font-sans drop-shadow-[0_2px_12px_rgba(255,255,255,0.2)]">
              Q
              {/* Saffron accent dot positioned inside Q's inner aura */}
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[#FF9F2F] shadow-[0_0_8px_#FF9F2F]" />
            </span>
          </div>

          {/* Tagline: INTELLIGENCE THAT SERVES */}
          <div
            className={`mt-3 sm:mt-4 transition-all duration-700 ${
              phase === 'reveal' || phase === 'exit'
                ? 'opacity-100 animate-sevaiq-tagline'
                : 'opacity-0'
            }`}
          >
            <p className="text-[11px] sm:text-xs md:text-sm font-bold tracking-[0.32em] sm:tracking-[0.4em] uppercase text-slate-200 select-none drop-shadow-[0_1px_6px_rgba(0,0,0,0.8)]">
              INTELLIGENCE THAT SERVES
            </p>
          </div>

          {/* Bilingual Civic Descriptor */}
          <div
            className={`mt-2.5 flex items-center gap-2 text-[10px] sm:text-[11px] font-medium text-slate-400/90 transition-opacity duration-1000 delay-300 ${
              phase === 'reveal' || phase === 'exit' ? 'opacity-100' : 'opacity-0'
            }`}
          >
            <span>Citizen Welfare Discovery</span>
            <span className="text-teal-400/60">•</span>
            <span>அரசு நலத்திட்ட வழிகாட்டி</span>
          </div>
        </div>
      </div>
    </div>
  );
};
