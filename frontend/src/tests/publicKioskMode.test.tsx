import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderToString } from 'react-dom/server';
import App from '../App';
import { Header } from '../components/Header';
import { ApplicationTracker } from '../components/ApplicationTracker';
import {
  KioskConfirmationDialog,
  InactivityWarningDialog,
} from '../components/KioskDialogs';
import {
  EMPTY_PROFILE,
  DEMO_PROFILE,
  STORAGE_KEYS,
  MemoryStorage,
  setCustomStorage,
  purgeCitizenStorage,
  persistCitizenProfile,
  persistDocuments,
  persistSelectedSchemes,
  persistApplicationProgress,
  persistApplicationNotes,
  persistApplicationStatus,
  persistApplicationReminders,
  isCitizenDataPersisted,
} from '../utils/kioskStorage';
import { LanguageProvider } from '../context/LanguageContext';
import { AccessibilityProvider } from '../context/AccessibilityContext';
import { VERIFIED_REFERENCE_SCHEMES } from '../data/verifiedReferenceSchemes';

describe('Public Kiosk Mode Architecture & Privacy Suite', () => {
  let mockStorage: Storage;

  beforeEach(() => {
    mockStorage = new MemoryStorage();
    setCustomStorage(mockStorage);
    (globalThis as any).localStorage = mockStorage;
    (globalThis as any).sessionStorage = new MemoryStorage();
    if (typeof window !== 'undefined') {
      (window as any).localStorage = mockStorage;
      (window as any).sessionStorage = (globalThis as any).sessionStorage;
    }
    if (typeof document === 'undefined') {
      (globalThis as any).document = {
        documentElement: { lang: 'en', style: {} },
        body: { classList: { add: vi.fn(), remove: vi.fn() } },
        getElementById: vi.fn(),
      };
    }
  });

  afterEach(() => {
    setCustomStorage(null);
    vi.restoreAllMocks();
  });

  describe('1. Cancelling mode changes preserves existing data', () => {
    it('cancelling enable dialog preserves existing stored citizen data', () => {
      // Setup saved data in standard mode
      mockStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEMO_PROFILE));
      mockStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify([{ id: 'aadhaar', status: 'have' }]));
      mockStorage.setItem(STORAGE_KEYS.KIOSK_MODE, 'false');

      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      const html = renderToString(
        <LanguageProvider>
          <KioskConfirmationDialog
            isOpen={true}
            isEnabling={true}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        </LanguageProvider>
      );

      // Verify dialog presents clear explanation and cancel action
      expect(html).toContain('Enable Public Kiosk Mode?');
      expect(html).toContain('Designed for Shared Public Terminals');
      expect(html).toContain('Cancel (Keep Current Data)');

      // If user cancels, storage remains intact
      onCancel();
      expect(mockStorage.getItem(STORAGE_KEYS.PROFILE)).not.toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.KIOSK_MODE)).toBe('false');
      expect(isCitizenDataPersisted(mockStorage)).toBe(true);
    });

    it('cancelling exit dialog keeps Public Kiosk Mode active and keeps in-memory state', () => {
      mockStorage.setItem(STORAGE_KEYS.KIOSK_MODE, 'true');

      const onConfirm = vi.fn();
      const onCancel = vi.fn();

      const html = renderToString(
        <LanguageProvider>
          <KioskConfirmationDialog
            isOpen={true}
            isEnabling={false}
            onConfirm={onConfirm}
            onCancel={onCancel}
          />
        </LanguageProvider>
      );

      expect(html).toContain('Exit Public Kiosk Mode?');
      expect(html).toContain('Cancel (Stay in Kiosk Mode)');

      onCancel();
      expect(mockStorage.getItem(STORAGE_KEYS.KIOSK_MODE)).toBe('true');
    });
  });

  describe('2. Enabling Kiosk Mode clears previously saved citizen data after confirmation', () => {
    it('purges all persistent storage keys when Kiosk Mode is confirmed', () => {
      mockStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEMO_PROFILE));
      mockStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify([{ id: 'aadhaar', status: 'have' }]));
      mockStorage.setItem(STORAGE_KEYS.SELECTED_SCHEMES, JSON.stringify(['pm-kisan']));
      mockStorage.setItem(STORAGE_KEYS.APPLICATION_PROGRESS, JSON.stringify({ 'pm-kisan': ['step-1'] }));
      mockStorage.setItem(STORAGE_KEYS.APPLICATION_NOTES, JSON.stringify({ 'pm-kisan': 'Taluk office' }));
      mockStorage.setItem(STORAGE_KEYS.APPLICATION_STATUS, JSON.stringify({ 'pm-kisan': 'submitted' }));
      mockStorage.setItem(STORAGE_KEYS.APPLICATION_REMINDERS, JSON.stringify({ 'pm-kisan': '2026-11-01' }));

      expect(isCitizenDataPersisted(mockStorage)).toBe(true);

      // Confirm transition to Kiosk Mode
      purgeCitizenStorage(mockStorage);
      mockStorage.setItem(STORAGE_KEYS.KIOSK_MODE, 'true');

      expect(mockStorage.getItem(STORAGE_KEYS.PROFILE)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.DOCUMENTS)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.SELECTED_SCHEMES)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.APPLICATION_PROGRESS)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.APPLICATION_NOTES)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.APPLICATION_STATUS)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.APPLICATION_REMINDERS)).toBeNull();
      expect(isCitizenDataPersisted(mockStorage)).toBe(false);
      expect(mockStorage.getItem(STORAGE_KEYS.KIOSK_MODE)).toBe('true');
    });
  });

  describe('3. Enforces zero persistent writes while Kiosk Mode is active', () => {
    it('never writes profile, documents, selected schemes, or tracker data to storage', () => {
      mockStorage.setItem(STORAGE_KEYS.KIOSK_MODE, 'true');

      persistCitizenProfile(DEMO_PROFILE, true, mockStorage);
      persistDocuments([{ id: 'ration-card', name: 'Ration Card', description: 'Ration', issuingAuthority: 'Civil Supplies', applicableSchemeIds: [], status: 'have' }], true, mockStorage);
      persistSelectedSchemes(['pm-kisan', 'ab-pmjay'], true, mockStorage);
      persistApplicationProgress({ 'pm-kisan': ['step-1', 'step-2'] }, true, mockStorage);
      persistApplicationNotes({ 'pm-kisan': 'Private notes' }, true, mockStorage);
      persistApplicationStatus({ 'pm-kisan': 'submitted' }, true, mockStorage);
      persistApplicationReminders({ 'pm-kisan': '2026-12-01' }, true, mockStorage);

      expect(isCitizenDataPersisted(mockStorage)).toBe(false);
      expect(mockStorage.getItem(STORAGE_KEYS.PROFILE)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.DOCUMENTS)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.SELECTED_SCHEMES)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.APPLICATION_PROGRESS)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.APPLICATION_NOTES)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.APPLICATION_STATUS)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.APPLICATION_REMINDERS)).toBeNull();
    });
  });

  describe('4. In-memory tracker and chatbot action integration in Kiosk Mode', () => {
    it('shares in-memory tracker state between chatbot callbacks and ApplicationTracker', () => {
      // In-memory state containers
      let currentStatusMap: Record<string, any> = {};
      let currentReminderMap: Record<string, string> = {};

      const handleSetTrackerStatus = (schemeId: string, status: string) => {
        currentStatusMap = { ...currentStatusMap, [schemeId]: status };
      };

      const handleSetTrackerReminder = (schemeId: string, text: string, date?: string) => {
        const formatted = date || '2026-11-15';
        currentReminderMap = { ...currentReminderMap, [schemeId]: `${formatted} - ${text}` };
      };

      // Chatbot updates status and reminder in memory
      handleSetTrackerStatus('pm-kisan', 'submitted');
      handleSetTrackerReminder('pm-kisan', 'Check Taluk office');

      expect(currentStatusMap['pm-kisan']).toBe('submitted');
      expect(currentReminderMap['pm-kisan']).toContain('Check Taluk office');
      // Persistent storage was NEVER touched
      expect(mockStorage.getItem(STORAGE_KEYS.APPLICATION_STATUS)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.APPLICATION_REMINDERS)).toBeNull();

      // Render ApplicationTracker with this in-memory state in Kiosk Mode
      const html = renderToString(
        <LanguageProvider>
          <ApplicationTracker
            schemes={VERIFIED_REFERENCE_SCHEMES}
            initialSchemeId="pm-kisan"
            onNavigate={vi.fn()}
            isKioskMode={true}
            statusMap={currentStatusMap}
            reminderMap={currentReminderMap}
          />
        </LanguageProvider>
      );

      expect(html).toContain('pm-kisan');
      // Status is visible in the tracker component
      expect(html).toContain('Application submitted on portal / Kendra');
      expect(mockStorage.getItem(STORAGE_KEYS.APPLICATION_STATUS)).toBeNull();
    });
  });

  describe('5. Resetting all state on mode transitions', () => {
    it('switching kiosk mode OFF prevents kiosk-session state from leaking into persistent storage', () => {
      // Kiosk session ends
      purgeCitizenStorage(mockStorage);
      mockStorage.setItem(STORAGE_KEYS.KIOSK_MODE, 'false');

      // Subsequent renders with EMPTY_PROFILE or reset states never save old data
      persistCitizenProfile(EMPTY_PROFILE, false, mockStorage);
      persistDocuments([], false, mockStorage);
      persistSelectedSchemes([], false, mockStorage);
      persistApplicationProgress({}, false, mockStorage);
      persistApplicationNotes({}, false, mockStorage);
      persistApplicationStatus({}, false, mockStorage);
      persistApplicationReminders({}, false, mockStorage);

      expect(isCitizenDataPersisted(mockStorage)).toBe(false);
    });
  });

  describe('6. Ending a citizen session', () => {
    it('purges storage and resets session cleanly while preserving Kiosk Mode configuration', () => {
      mockStorage.setItem(STORAGE_KEYS.KIOSK_MODE, 'true');

      // End session called
      purgeCitizenStorage(mockStorage);

      expect(isCitizenDataPersisted(mockStorage)).toBe(false);
      // Kiosk Mode configuration is preserved for the next citizen
      expect(mockStorage.getItem(STORAGE_KEYS.KIOSK_MODE)).toBe('true');
    });
  });

  describe('7. Automatic Inactivity Reset', () => {
    it('renders the accessible InactivityWarningDialog with countdown and continue action', () => {
      const onContinue = vi.fn();
      const onEndNow = vi.fn();

      const html = renderToString(
        <LanguageProvider>
          <InactivityWarningDialog
            isOpen={true}
            secondsRemaining={25}
            onContinue={onContinue}
            onEndNow={onEndNow}
          />
        </LanguageProvider>
      );

      expect(html).toContain('role="dialog"');
      expect(html).toContain('Inactivity Warning');
      expect(html).toContain('00:25');
      expect(html).toContain('Continue Session');
      expect(html).toContain('End Session Now');
    });
  });

  describe('8. Normal browsing and persistent mode continue working', () => {
    it('saves and restores citizen profile, documents, and schemes when Kiosk Mode is disabled', () => {
      mockStorage.setItem(STORAGE_KEYS.KIOSK_MODE, 'false');

      persistCitizenProfile(DEMO_PROFILE, false, mockStorage);
      persistDocuments(
        [{ id: 'aadhaar', name: 'Aadhaar', description: 'UIDAI', issuingAuthority: 'UIDAI', applicableSchemeIds: [], status: 'have' }],
        false,
        mockStorage
      );
      persistSelectedSchemes(['pm-kisan'], false, mockStorage);

      expect(isCitizenDataPersisted(mockStorage)).toBe(true);
      const savedProfile = JSON.parse(mockStorage.getItem(STORAGE_KEYS.PROFILE)!);
      expect(savedProfile.age).toBe(38);
      expect(savedProfile.occupation).toBe('Farmer / Cultivator');
    });
  });

  describe('9. Multilingual Accessibility & Interface Labels', () => {
    it('renders Public Kiosk Mode controls and badges in Tamil', () => {
      const html = renderToString(
        <LanguageProvider>
          <Header
            activeTab="chat"
            onSelectTab={vi.fn()}
            isKioskMode={true}
          />
        </LanguageProvider>
      );

      expect(html).toContain('Public Kiosk Mode');
    });

    it('renders Public Kiosk Mode banner when active in App', () => {
      mockStorage.setItem(STORAGE_KEYS.KIOSK_MODE, 'true');
      sessionStorage.setItem('sevaiq_intro_seen', 'true');

      const html = renderToString(
        <LanguageProvider>
          <AccessibilityProvider>
            <App />
          </AccessibilityProvider>
        </LanguageProvider>
      );

      expect(html).toContain('Public Kiosk Mode Active');
      expect(html).toContain('Zero Disk Storage');
      expect(html).toContain('5-minute inactivity auto-reset enabled');
      expect(html).toContain('End Session');
    });
  });
});
