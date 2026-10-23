import { CitizenProfile, DocumentRecord } from '../types';

export const EMPTY_PROFILE: CitizenProfile = {
  age: null,
  gender: '',
  state: '',
  area: '',
  occupation: '',
  incomeBracket: '',
  category: '',
  landholding: '',
  isStudent: false,
  hasDisability: false,
  annualIncome: null,
  ownsPuccaHouse: null,
  isTaxPayer: null,
  isGovernmentEmployee: null,
};

export const DEMO_PROFILE: CitizenProfile = {
  age: 38,
  gender: 'Female',
  state: 'Karnataka',
  area: 'Rural',
  occupation: 'Farmer / Cultivator',
  incomeBracket: '1 - 2.5 Lakh',
  category: 'OBC',
  landholding: 'Small (1-2 ha)',
  isStudent: false,
  hasDisability: false,
  annualIncome: 120000,
  ownsPuccaHouse: false,
  isTaxPayer: false,
  isGovernmentEmployee: false,
};

export const STORAGE_KEYS = {
  PROFILE: 'sevaiq_citizen_profile',
  DOCUMENTS: 'sevaiq_documents',
  SELECTED_SCHEMES: 'sevaiq_selected_schemes',
  KIOSK_MODE: 'sevaiq_kiosk_mode',
  APPLICATION_PROGRESS: 'SEVAIQ_APPLICATION_PROGRESS',
  APPLICATION_NOTES: 'SEVAIQ_APPLICATION_NOTES',
  APPLICATION_TRACKING: 'SEVAIQ_APPLICATION_TRACKING',
  APPLICATION_STATUS: 'SEVAIQ_APPLICATION_STATUS',
  APPLICATION_REMINDERS: 'SEVAIQ_APPLICATION_REMINDERS',
} as const;

/**
 * Fallback in-memory storage implementation for environments without DOM localStorage (e.g. tests, SSR).
 */
export class MemoryStorage implements Storage {
  private map = new Map<string, string>();

  get length(): number {
    return this.map.size;
  }

  clear(): void {
    this.map.clear();
  }

  getItem(key: string): string | null {
    return this.map.has(key) ? this.map.get(key)! : null;
  }

  key(index: number): string | null {
    return Array.from(this.map.keys())[index] ?? null;
  }

  removeItem(key: string): void {
    this.map.delete(key);
  }

  setItem(key: string, value: string): void {
    this.map.set(key, String(value));
  }
}

const memoryStorageFallback = new MemoryStorage();

export function getDefaultStorage(): Storage {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) {
      return (globalThis as any).localStorage;
    }
  } catch {
    // Restricted environment fallback
  }
  return memoryStorageFallback;
}

/**
 * Checks whether a citizen profile contains any user-entered demographic data.
 */
export function isProfileEmpty(profile: CitizenProfile | null | undefined): boolean {
  if (!profile) return true;
  return (
    profile.age === null &&
    !profile.gender &&
    !profile.state &&
    !profile.area &&
    !profile.occupation &&
    !profile.incomeBracket &&
    !profile.category &&
    !profile.landholding &&
    !profile.isStudent &&
    !profile.hasDisability &&
    (profile.annualIncome === null || profile.annualIncome === undefined) &&
    (profile.ownsPuccaHouse === null || profile.ownsPuccaHouse === undefined) &&
    (profile.isTaxPayer === null || profile.isTaxPayer === undefined) &&
    (profile.isGovernmentEmployee === null || profile.isGovernmentEmployee === undefined)
  );
}

/**
 * Completely purges all citizen-specific data from persistent storage.
 */
export function purgeCitizenStorage(storage: Storage = getDefaultStorage()): void {
  try {
    storage.removeItem(STORAGE_KEYS.PROFILE);
    storage.removeItem(STORAGE_KEYS.DOCUMENTS);
    storage.removeItem(STORAGE_KEYS.SELECTED_SCHEMES);
    storage.removeItem(STORAGE_KEYS.APPLICATION_PROGRESS);
    storage.removeItem(STORAGE_KEYS.APPLICATION_NOTES);
    storage.removeItem(STORAGE_KEYS.APPLICATION_TRACKING);
    storage.removeItem(STORAGE_KEYS.APPLICATION_STATUS);
    storage.removeItem(STORAGE_KEYS.APPLICATION_REMINDERS);
  } catch {
    // Storage access may be restricted in sandboxed iframes
  }
}

/**
 * Safely persists a citizen profile only when Kiosk Mode is disabled
 * and the profile is not empty.
 */
export function persistCitizenProfile(
  profile: CitizenProfile,
  isKioskMode: boolean,
  storage: Storage = getDefaultStorage()
): void {
  if (isKioskMode) {
    purgeCitizenStorage(storage);
    return;
  }

  try {
    if (isProfileEmpty(profile)) {
      storage.removeItem(STORAGE_KEYS.PROFILE);
    } else {
      storage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
    }
  } catch {
    // ignore storage quota errors
  }
}

/**
 * Safely persists document statuses only when Kiosk Mode is disabled.
 */
export function persistDocuments(
  documents: DocumentRecord[],
  isKioskMode: boolean,
  storage: Storage = getDefaultStorage()
): void {
  if (isKioskMode) {
    try {
      storage.removeItem(STORAGE_KEYS.DOCUMENTS);
    } catch {}
    return;
  }

  try {
    const hasModifications = documents.some((d) => d.status !== 'unconfirmed');
    if (!hasModifications) {
      storage.removeItem(STORAGE_KEYS.DOCUMENTS);
    } else {
      storage.setItem(STORAGE_KEYS.DOCUMENTS, JSON.stringify(documents));
    }
  } catch {
    // ignore
  }
}

/**
 * Safely persists selected scheme IDs only when Kiosk Mode is disabled.
 */
export function persistSelectedSchemes(
  schemeIds: string[],
  isKioskMode: boolean,
  storage: Storage = getDefaultStorage()
): void {
  if (isKioskMode) {
    try {
      storage.removeItem(STORAGE_KEYS.SELECTED_SCHEMES);
    } catch {}
    return;
  }

  try {
    if (!schemeIds || schemeIds.length === 0) {
      storage.removeItem(STORAGE_KEYS.SELECTED_SCHEMES);
    } else {
      storage.setItem(STORAGE_KEYS.SELECTED_SCHEMES, JSON.stringify(schemeIds));
    }
  } catch {
    // ignore
  }
}
