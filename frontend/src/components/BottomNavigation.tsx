import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  Compass,
  Files,
  ListChecks,
} from 'lucide-react';
import { NavigationTab } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface BottomNavigationProps {
  activeTab: NavigationTab;
  onSelectTab: (tab: NavigationTab) => void;
  eligibleCount?: number;
}

interface BottomNavItem {
  id: NavigationTab;
  label: string;
  icon: React.FC<{ className?: string }>;
  isActive: boolean;
  badge?: number;
  ariaLabel: string;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onSelectTab,
  eligibleCount = 0,
}) => {
  const { language, t } = useLanguage();

  // Localized compact labels for the 5 primary mobile destinations
  const homeLabel =
    language === 'ta' ? 'முகப்பு' : language === 'hi' ? 'होम' : 'Home';
  const chatLabel =
    language === 'ta' ? 'அரட்டை' : language === 'hi' ? 'चैट' : 'Chat';
  const schemesLabel =
    language === 'ta' ? 'திட்டங்கள்' : language === 'hi' ? 'योजनाएं' : 'Schemes';
  const docsLabel =
    language === 'ta' ? 'ஆவணங்கள்' : language === 'hi' ? 'दस्तावेज़' : 'Documents';
  const trackLabel =
    language === 'ta' ? 'கண்காணிப்பு' : language === 'hi' ? 'ट्रैक' : 'Track';

  const navItems: BottomNavItem[] = [
    {
      id: 'dashboard',
      label: homeLabel,
      icon: LayoutDashboard,
      isActive: activeTab === 'dashboard',
      ariaLabel: `${homeLabel} - ${t.header.dashboard || 'Dashboard'}`,
    },
    {
      id: 'chat',
      label: chatLabel,
      icon: MessageSquare,
      isActive: activeTab === 'chat' || activeTab === 'voice-assistant',
      ariaLabel: `${chatLabel} - ${t.header.chat || 'AI Assistant'}`,
    },
    {
      id: 'discover',
      label: schemesLabel,
      icon: Compass,
      isActive: activeTab === 'discover' || activeTab === 'demographic-profile',
      badge: eligibleCount > 0 ? eligibleCount : undefined,
      ariaLabel: `${schemesLabel} - ${t.header.findSchemes || 'Find Schemes'}`,
    },
    {
      id: 'document-mapper',
      label: docsLabel,
      icon: Files,
      isActive: activeTab === 'document-mapper',
      ariaLabel: `${docsLabel} - ${t.header.prepareDocs || 'Prepare Documents'}`,
    },
    {
      id: 'application-tracker',
      label: trackLabel,
      icon: ListChecks,
      isActive: activeTab === 'application-tracker',
      ariaLabel: `${trackLabel} - ${t.header.trackApp || 'Track Application'}`,
    },
  ];

  return (
    <nav
      aria-label="Mobile Bottom Navigation"
      role="navigation"
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0f2133]/95 backdrop-blur-md border-t border-[#D7DEE5] dark:border-[#223b56] shadow-lg print:hidden transition-colors duration-150"
    >
      <div className="flex items-center justify-between max-w-lg mx-auto px-1 pt-1 pb-[max(0.375rem,env(safe-area-inset-bottom))]">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = item.isActive;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-label={item.ariaLabel}
              aria-current={isActive ? 'page' : undefined}
              className={`flex-1 min-w-0 h-14 flex flex-col items-center justify-center relative touch-manipulation focus:outline-none focus:ring-2 focus:ring-[#16733B] transition-all rounded-xl select-none cursor-pointer ${
                isActive
                  ? 'bg-emerald-50/70 dark:bg-emerald-950/40 text-[#16733B] dark:text-emerald-300 font-bold'
                  : 'text-[#596775] dark:text-slate-400 hover:text-[#17324D] dark:hover:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/40 font-medium'
              }`}
            >
              {/* Active top indicator bar */}
              {isActive && (
                <span className="absolute top-0 w-8 h-0.5 bg-[#16733B] dark:bg-emerald-400 rounded-full animate-in fade-in duration-150" />
              )}

              {/* Icon with optional badge */}
              <div className="relative flex items-center justify-center">
                <Icon
                  className={`w-5 h-5 shrink-0 transition-transform ${
                    isActive
                      ? 'text-[#16733B] dark:text-emerald-400 stroke-[2.3] scale-105'
                      : 'text-[#596775] dark:text-slate-400 stroke-[1.8]'
                  }`}
                />
                {item.badge !== undefined && (
                  <span className="absolute -top-1.5 -right-3 min-w-[16px] h-4 px-1 rounded-full text-[9px] font-extrabold flex items-center justify-center bg-[#16733B] text-white dark:bg-emerald-400 dark:text-[#0b162f] shadow-2xs">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Label */}
              <span className="text-[10px] sm:text-[11px] leading-tight truncate max-w-full px-0.5 mt-0.5">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
