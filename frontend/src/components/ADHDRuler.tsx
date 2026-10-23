import React, { useState, useEffect } from 'react';
import { useAccessibility } from '../context/AccessibilityContext';
import { X, Eye } from 'lucide-react';

export const ADHDRuler: React.FC = () => {
  const { settings, toggleAdhdMode } = useAccessibility();
  const [mouseY, setMouseY] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      return window.innerHeight / 2;
    }
    return 300;
  });

  useEffect(() => {
    if (!settings.adhdMode) return;

    const handleMouseMove = (e: MouseEvent) => {
      setMouseY(e.clientY);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        setMouseY(e.touches[0].clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
    };
  }, [settings.adhdMode]);

  if (!settings.adhdMode) return null;

  const RULER_HEIGHT = 90;
  const topMaskHeight = Math.max(0, mouseY - RULER_HEIGHT / 2);
  const bottomMaskTop = mouseY + RULER_HEIGHT / 2;

  return (
    <div
      className="fixed inset-0 z-40 pointer-events-none select-none a11y-exempt overflow-hidden"
      aria-hidden="true"
    >
      {/* Dimmed Curtain Above Current Reading Line */}
      <div
        style={{ height: `${topMaskHeight}px` }}
        className="w-full bg-slate-950/40 backdrop-blur-[0.5px] transition-[height] duration-75"
      />

      {/* Illuminated Reading Focus Window */}
      <div
        style={{
          top: `${topMaskHeight}px`,
          height: `${RULER_HEIGHT}px`,
        }}
        className="w-full absolute left-0 right-0 border-y-2 border-amber-400/90 bg-amber-400/[0.04] shadow-[0_0_15px_rgba(251,191,36,0.25)] flex items-center justify-between px-6 transition-[top] duration-75"
      >
        <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-amber-600/80 bg-amber-100/90 px-2 py-0.5 rounded shadow-2xs">
          Focus Line
        </span>
        <span className="text-[10px] uppercase tracking-widest font-mono font-bold text-amber-600/80 bg-amber-100/90 px-2 py-0.5 rounded shadow-2xs">
          ADHD Guide
        </span>
      </div>

      {/* Dimmed Curtain Below Current Reading Line */}
      <div
        style={{
          top: `${bottomMaskTop}px`,
          height: `calc(100vh - ${bottomMaskTop}px)`,
        }}
        className="w-full absolute left-0 bottom-0 bg-slate-950/40 backdrop-blur-[0.5px] transition-[top,height] duration-75"
      />

      {/* Floating Status Pill (Clickable) */}
      <div className="fixed bottom-4 left-4 pointer-events-auto z-50">
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-500 text-slate-900 shadow-lg text-xs font-bold border border-amber-300">
          <Eye className="w-3.5 h-3.5 text-slate-900" />
          <span>ADHD Reading Guide Active</span>
          <button
            type="button"
            onClick={toggleAdhdMode}
            className="ml-1 p-0.5 rounded-full hover:bg-amber-600 text-slate-900 transition-colors"
            title="Turn Off ADHD Guide"
            aria-label="Turn Off ADHD Guide"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
