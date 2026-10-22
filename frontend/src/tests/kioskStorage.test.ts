import { describe, it, expect, beforeEach } from 'vitest';
import {
  EMPTY_PROFILE,
  DEMO_PROFILE,
  STORAGE_KEYS,
  MemoryStorage,
  isProfileEmpty,
  purgeCitizenStorage,
  persistCitizenProfile,
  persistDocuments,
  persistSelectedSchemes,
} from '../utils/kioskStorage';
import { CitizenProfile, DocumentRecord } from '../types';

describe('Public Kiosk Mode Storage & Privacy Suite', () => {
  let mockStorage: Storage;

  beforeEach(() => {
    mockStorage = new MemoryStorage();
    (globalThis as any).localStorage = mockStorage;
  });

  describe('isProfileEmpty helper', () => {
    it('returns true for null or undefined profile', () => {
      expect(isProfileEmpty(null)).toBe(true);
      expect(isProfileEmpty(undefined)).toBe(true);
    });

    it('returns true for default EMPTY_PROFILE', () => {
      expect(isProfileEmpty(EMPTY_PROFILE)).toBe(true);
    });

    it('returns false when demographic fields are populated', () => {
      expect(isProfileEmpty(DEMO_PROFILE)).toBe(false);

      const profileWithOnlyAge: CitizenProfile = { ...EMPTY_PROFILE, age: 25 };
      expect(isProfileEmpty(profileWithOnlyAge)).toBe(false);

      const profileWithOnlyState: CitizenProfile = { ...EMPTY_PROFILE, state: 'Karnataka' };
      expect(isProfileEmpty(profileWithOnlyState)).toBe(false);

      const profileWithOnlyDisability: CitizenProfile = { ...EMPTY_PROFILE, hasDisability: true };
      expect(isProfileEmpty(profileWithOnlyDisability)).toBe(false);
    });
  });

  describe('purgeCitizenStorage', () => {
    it('removes all citizen profile, documents, and selected schemes from storage', () => {
      mockStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEMO_PROFILE));
      mockStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify([{ id: 'aadhaar', status: 'have' }]));
      mockStorage.setItem(STORAGE_KEYS.SELECTED_SCHEMES, JSON.stringify(['pm-kisan']));

      purgeCitizenStorage(mockStorage);

      expect(mockStorage.getItem(STORAGE_KEYS.PROFILE)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.DOCUMENTS)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.SELECTED_SCHEMES)).toBeNull();
    });
  });

  describe('persistCitizenProfile', () => {
    it('never writes to storage when kiosk mode is ON', () => {
      persistCitizenProfile(DEMO_PROFILE, true, mockStorage);
      expect(mockStorage.getItem(STORAGE_KEYS.PROFILE)).toBeNull();
    });

    it('purges existing storage if called with kiosk mode ON', () => {
      mockStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEMO_PROFILE));
      persistCitizenProfile(DEMO_PROFILE, true, mockStorage);
      expect(mockStorage.getItem(STORAGE_KEYS.PROFILE)).toBeNull();
    });

    it('persists profile when kiosk mode is OFF and profile is populated', () => {
      persistCitizenProfile(DEMO_PROFILE, false, mockStorage);
      const saved = mockStorage.getItem(STORAGE_KEYS.PROFILE);
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed.age).toBe(DEMO_PROFILE.age);
      expect(parsed.gender).toBe(DEMO_PROFILE.gender);
    });

    it('removes stored profile when kiosk mode is OFF and profile is empty', () => {
      mockStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(DEMO_PROFILE));
      persistCitizenProfile(EMPTY_PROFILE, false, mockStorage);
      expect(mockStorage.getItem(STORAGE_KEYS.PROFILE)).toBeNull();
    });
  });

  describe('persistDocuments', () => {
    const modifiedDocs: DocumentRecord[] = [
      {
        id: 'aadhaar-card',
        name: 'Aadhaar Card',
        description: 'Proof of identity',
        issuingAuthority: 'UIDAI',
        applicableSchemeIds: ['pm-kisan'],
        status: 'have',
      },
    ];

    it('does not write documents to storage when kiosk mode is ON', () => {
      persistDocuments(modifiedDocs, true, mockStorage);
      expect(mockStorage.getItem(STORAGE_KEYS.DOCUMENTS)).toBeNull();
    });

    it('persists modified documents when kiosk mode is OFF', () => {
      persistDocuments(modifiedDocs, false, mockStorage);
      const saved = mockStorage.getItem(STORAGE_KEYS.DOCUMENTS);
      expect(saved).not.toBeNull();
      expect(JSON.parse(saved!)[0].status).toBe('have');
    });

    it('removes documents from storage when none have modified status', () => {
      const defaultDocs: DocumentRecord[] = [
        { ...modifiedDocs[0], status: 'unconfirmed' },
      ];
      mockStorage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(modifiedDocs));
      persistDocuments(defaultDocs, false, mockStorage);
      expect(mockStorage.getItem(STORAGE_KEYS.DOCUMENTS)).toBeNull();
    });
  });

  describe('persistSelectedSchemes', () => {
    it('does not write schemes to storage when kiosk mode is ON', () => {
      persistSelectedSchemes(['pm-kisan', 'ab-pmjay'], true, mockStorage);
      expect(mockStorage.getItem(STORAGE_KEYS.SELECTED_SCHEMES)).toBeNull();
    });

    it('persists schemes when kiosk mode is OFF and list is non-empty', () => {
      persistSelectedSchemes(['pm-kisan'], false, mockStorage);
      const saved = mockStorage.getItem(STORAGE_KEYS.SELECTED_SCHEMES);
      expect(saved).not.toBeNull();
      expect(JSON.parse(saved!)).toEqual(['pm-kisan']);
    });

    it('removes schemes when array is empty', () => {
      mockStorage.setItem(STORAGE_KEYS.SELECTED_SCHEMES, JSON.stringify(['pm-kisan']));
      persistSelectedSchemes([], false, mockStorage);
      expect(mockStorage.getItem(STORAGE_KEYS.SELECTED_SCHEMES)).toBeNull();
    });
  });

  describe('Kiosk Mode Lifecycle & Session Transition Regression Test', () => {
    it('enabling kiosk mode purges previously persisted citizen profile and document data', () => {
      // Step 1: User had saved personal data in standard persistent mode
      persistCitizenProfile(DEMO_PROFILE, false, mockStorage);
      persistDocuments(
        [{ id: 'doc-1', name: 'Income Certificate', description: 'Income proof', issuingAuthority: 'Revenue Dept', applicableSchemeIds: ['pm-kisan'], status: 'have' }],
        false,
        mockStorage
      );
      persistSelectedSchemes(['pm-kisan'], false, mockStorage);

      expect(mockStorage.getItem(STORAGE_KEYS.PROFILE)).not.toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.DOCUMENTS)).not.toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.SELECTED_SCHEMES)).not.toBeNull();

      // Step 2: Kiosk mode is enabled
      purgeCitizenStorage(mockStorage);
      mockStorage.setItem(STORAGE_KEYS.KIOSK_MODE, 'true');

      expect(mockStorage.getItem(STORAGE_KEYS.PROFILE)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.DOCUMENTS)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.SELECTED_SCHEMES)).toBeNull();
    });

    it('citizen data entered during kiosk session is never written to localStorage', () => {
      const kioskCitizen: CitizenProfile = {
        age: 62,
        gender: 'Male',
        state: 'Tamil Nadu',
        area: 'Rural',
        occupation: 'Agricultural Laborer',
        incomeBracket: '< 1 Lakh',
        category: 'SC',
        landholding: 'Marginal (< 1 ha)',
        isStudent: false,
        hasDisability: true,
      };

      // Citizen enters profile during kiosk mode
      persistCitizenProfile(kioskCitizen, true, mockStorage);
      persistDocuments(
        [{ id: 'caste-cert', name: 'Caste Certificate', description: 'Caste verification', issuingAuthority: 'Tahsildar', applicableSchemeIds: [], status: 'have' }],
        true,
        mockStorage
      );
      persistSelectedSchemes(['nsap-ignops'], true, mockStorage);

      expect(mockStorage.getItem(STORAGE_KEYS.PROFILE)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.DOCUMENTS)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.SELECTED_SCHEMES)).toBeNull();
    });

    it('switching kiosk mode OFF clears kiosk session data and prevents in-memory profile from leaking into localStorage', () => {
      // Suppose an in-memory kiosk profile was populated during a kiosk session
      const kioskCitizen: CitizenProfile = {
        ...DEMO_PROFILE,
        age: 55,
      };
      // Session attempted to persist during kiosk mode
      persistCitizenProfile(kioskCitizen, true, mockStorage);
      expect(mockStorage.getItem(STORAGE_KEYS.PROFILE)).toBeNull();

      // 1. Simulating kiosk mode exit: storage is purged and in-memory profile is reset to EMPTY_PROFILE
      purgeCitizenStorage(mockStorage);
      mockStorage.setItem(STORAGE_KEYS.KIOSK_MODE, 'false');

      // 2. React state transitions:
      // Even if an effect fires with EMPTY_PROFILE or with kiosk guard, localStorage remains clean
      persistCitizenProfile(EMPTY_PROFILE, false, mockStorage);
      persistDocuments([], false, mockStorage);
      persistSelectedSchemes([], false, mockStorage);

      expect(mockStorage.getItem(STORAGE_KEYS.PROFILE)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.DOCUMENTS)).toBeNull();
      expect(mockStorage.getItem(STORAGE_KEYS.SELECTED_SCHEMES)).toBeNull();

      // Crucially, the kiosk citizen's personal data was never saved to storage
      expect(mockStorage.getItem(STORAGE_KEYS.PROFILE)).toBeNull();
    });

    it('preserves ordinary persistent-mode behavior for new citizen data entered after kiosk mode has ended', () => {
      // 1. Kiosk mode ends
      purgeCitizenStorage(mockStorage);

      // 2. Next user enters their own profile in persistent mode
      const newCitizen: CitizenProfile = {
        ...EMPTY_PROFILE,
        age: 29,
        gender: 'Female',
        state: 'Maharashtra',
        occupation: 'Self-employed / Artisan',
      };

      persistCitizenProfile(newCitizen, false, mockStorage);

      const saved = mockStorage.getItem(STORAGE_KEYS.PROFILE);
      expect(saved).not.toBeNull();
      const parsed = JSON.parse(saved!);
      expect(parsed.age).toBe(29);
      expect(parsed.state).toBe('Maharashtra');
    });
  });
});
