import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';

export interface AccessibilitySettings {
  textSize: number; // 80, 90, 100, 110, 120, 130, 140 (%)
  textSpacing: boolean;
  lineHeight: boolean;
  dyslexiaFriendly: boolean;
  adhdMode: boolean;
  saturation: 'normal' | 'high' | 'grayscale';
  invertColors: boolean;
  highlightLinks: boolean;
  bigCursor: boolean;
  pauseAnimation: boolean;
  hideImages: boolean;
}

export const DEFAULT_A11Y_SETTINGS: AccessibilitySettings = {
  textSize: 100,
  textSpacing: false,
  lineHeight: false,
  dyslexiaFriendly: false,
  adhdMode: false,
  saturation: 'normal',
  invertColors: false,
  highlightLinks: false,
  bigCursor: false,
  pauseAnimation: false,
  hideImages: false,
};

interface AccessibilityContextType {
  settings: AccessibilitySettings;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleOpen: () => void;
  increaseTextSize: () => void;
  decreaseTextSize: () => void;
  toggleTextSpacing: () => void;
  toggleLineHeight: () => void;
  toggleDyslexia: () => void;
  toggleAdhdMode: () => void;
  cycleSaturation: () => void;
  toggleInvertColors: () => void;
  toggleHighlightLinks: () => void;
  toggleBigCursor: () => void;
  togglePauseAnimation: () => void;
  toggleHideImages: () => void;
  resetAllSettings: () => void;
  activeCount: number;
}

const STORAGE_KEY = 'SEVAIQ_A11Y_SETTINGS';

const AccessibilityContext = createContext<AccessibilityContextType | undefined>(undefined);

export const AccessibilityProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [settings, setSettings] = useState<AccessibilitySettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return { ...DEFAULT_A11Y_SETTINGS, ...JSON.parse(saved), pauseAnimation: false };
      }
    } catch {
      // ignore
    }
    return DEFAULT_A11Y_SETTINGS;
  });

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      // ignore
    }
  }, [settings]);

  // Apply settings to DOM elements (document.documentElement and document.body)
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    // 1. Text Size
    if (settings.textSize === 100) {
      root.style.fontSize = '';
    } else {
      root.style.fontSize = `${settings.textSize}%`;
    }

    // 2. Text Spacing
    if (settings.textSpacing) {
      body.classList.add('a11y-text-spacing');
    } else {
      body.classList.remove('a11y-text-spacing');
    }

    // 3. Line Height
    if (settings.lineHeight) {
      body.classList.add('a11y-line-height');
    } else {
      body.classList.remove('a11y-line-height');
    }

    // 4. Dyslexia Friendly
    if (settings.dyslexiaFriendly) {
      body.classList.add('a11y-dyslexia');
    } else {
      body.classList.remove('a11y-dyslexia');
    }

    // 5. Saturation
    body.classList.remove('a11y-saturation-high', 'a11y-saturation-gray');
    if (settings.saturation === 'high') {
      body.classList.add('a11y-saturation-high');
    } else if (settings.saturation === 'grayscale') {
      body.classList.add('a11y-saturation-gray');
    }

    // 6. Invert Colors (High Contrast Dark Mode)
    if (settings.invertColors) {
      root.classList.add('a11y-invert');
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('a11y-invert');
      root.classList.remove('dark');
      root.removeAttribute('data-theme');
    }

    // 7. Highlight Links
    if (settings.highlightLinks) {
      body.classList.add('a11y-highlight-links');
    } else {
      body.classList.remove('a11y-highlight-links');
    }

    // 8. Big Cursor
    if (settings.bigCursor) {
      body.classList.add('a11y-big-cursor');
    } else {
      body.classList.remove('a11y-big-cursor');
    }

    // 9. Pause Animation
    if (settings.pauseAnimation) {
      body.classList.add('a11y-pause-animations');
    } else {
      body.classList.remove('a11y-pause-animations');
    }

    // 10. Hide Images
    if (settings.hideImages) {
      body.classList.add('a11y-hide-images');
    } else {
      body.classList.remove('a11y-hide-images');
    }
  }, [settings]);

  // Global Keyboard Shortcut: Ctrl+F2 (or Cmd+F2) toggles the Accessibility panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Ctrl+F2 or Cmd+F2 (code: F2, with ctrlKey or metaKey)
      if (e.key === 'F2' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  const toggleOpen = useCallback(() => {
    setIsOpen((prev) => !prev);
  }, []);

  const increaseTextSize = useCallback(() => {
    setSettings((prev) => {
      const nextSize = Math.min(prev.textSize + 10, 140);
      return { ...prev, textSize: nextSize };
    });
  }, []);

  const decreaseTextSize = useCallback(() => {
    setSettings((prev) => {
      const nextSize = Math.max(prev.textSize - 10, 80);
      return { ...prev, textSize: nextSize };
    });
  }, []);

  const toggleTextSpacing = useCallback(() => {
    setSettings((prev) => ({ ...prev, textSpacing: !prev.textSpacing }));
  }, []);

  const toggleLineHeight = useCallback(() => {
    setSettings((prev) => ({ ...prev, lineHeight: !prev.lineHeight }));
  }, []);

  const toggleDyslexia = useCallback(() => {
    setSettings((prev) => ({ ...prev, dyslexiaFriendly: !prev.dyslexiaFriendly }));
  }, []);

  const toggleAdhdMode = useCallback(() => {
    setSettings((prev) => ({ ...prev, adhdMode: !prev.adhdMode }));
  }, []);

  const cycleSaturation = useCallback(() => {
    setSettings((prev) => {
      if (prev.saturation === 'normal') return { ...prev, saturation: 'high' };
      if (prev.saturation === 'high') return { ...prev, saturation: 'grayscale' };
      return { ...prev, saturation: 'normal' };
    });
  }, []);

  const toggleInvertColors = useCallback(() => {
    setSettings((prev) => ({ ...prev, invertColors: !prev.invertColors }));
  }, []);

  const toggleHighlightLinks = useCallback(() => {
    setSettings((prev) => ({ ...prev, highlightLinks: !prev.highlightLinks }));
  }, []);

  const toggleBigCursor = useCallback(() => {
    setSettings((prev) => ({ ...prev, bigCursor: !prev.bigCursor }));
  }, []);

  const togglePauseAnimation = useCallback(() => {
    setSettings((prev) => ({ ...prev, pauseAnimation: !prev.pauseAnimation }));
  }, []);

  const toggleHideImages = useCallback(() => {
    setSettings((prev) => ({ ...prev, hideImages: !prev.hideImages }));
  }, []);

  const resetAllSettings = useCallback(() => {
    setSettings(DEFAULT_A11Y_SETTINGS);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }, []);

  // Compute number of active accessibility features
  const activeCount = useMemo(() => {
    let count = 0;
    if (settings.textSize !== 100) count++;
    if (settings.textSpacing) count++;
    if (settings.lineHeight) count++;
    if (settings.dyslexiaFriendly) count++;
    if (settings.adhdMode) count++;
    if (settings.saturation !== 'normal') count++;
    if (settings.invertColors) count++;
    if (settings.highlightLinks) count++;
    if (settings.bigCursor) count++;
    if (settings.pauseAnimation) count++;
    if (settings.hideImages) count++;
    return count;
  }, [settings]);

  const value = useMemo(
    () => ({
      settings,
      isOpen,
      setIsOpen,
      toggleOpen,
      increaseTextSize,
      decreaseTextSize,
      toggleTextSpacing,
      toggleLineHeight,
      toggleDyslexia,
      toggleAdhdMode,
      cycleSaturation,
      toggleInvertColors,
      toggleHighlightLinks,
      toggleBigCursor,
      togglePauseAnimation,
      toggleHideImages,
      resetAllSettings,
      activeCount,
    }),
    [
      settings,
      isOpen,
      toggleOpen,
      increaseTextSize,
      decreaseTextSize,
      toggleTextSpacing,
      toggleLineHeight,
      toggleDyslexia,
      toggleAdhdMode,
      cycleSaturation,
      toggleInvertColors,
      toggleHighlightLinks,
      toggleBigCursor,
      togglePauseAnimation,
      toggleHideImages,
      resetAllSettings,
      activeCount,
    ]
  );

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
};

export function useAccessibility(): AccessibilityContextType {
  const context = useContext(AccessibilityContext);
  if (!context) {
    return {
      settings: DEFAULT_A11Y_SETTINGS,
      isOpen: false,
      setIsOpen: () => {},
      toggleOpen: () => {},
      increaseTextSize: () => {},
      decreaseTextSize: () => {},
      toggleTextSpacing: () => {},
      toggleLineHeight: () => {},
      toggleDyslexia: () => {},
      toggleAdhdMode: () => {},
      cycleSaturation: () => {},
      toggleInvertColors: () => {},
      toggleHighlightLinks: () => {},
      toggleBigCursor: () => {},
      togglePauseAnimation: () => {},
      toggleHideImages: () => {},
      resetAllSettings: () => {},
      activeCount: 0,
    };
  }
  return context;
}
