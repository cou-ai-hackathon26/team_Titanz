import AsyncStorage from '@react-native-async-storage/async-storage';

// Everything we save about the user. It stays ONLY on this phone (no login, no server).
export type Profile = {
  name: string;
  age: number | null;
  gender: 'male' | 'female' | null;
  diabetesType: 'type2' | 'type1' | 'unknown' | null;
  treatment: 'diet' | 'tablets' | 'insulin' | null;
  districtId: string | null;
  familyPhone: string; // 10 digits after +880, e.g. "1819234567". Empty = not given.
  reminder: boolean; // remind 1 hour before iftar (feature N2)
  onboarded: boolean; // true once the 2 setup steps are finished
};

const PROFILE_KEY = 'roza-safe/profile';

// A blank profile for a new user.
export const emptyProfile: Profile = {
  name: '',
  age: null,
  gender: null,
  diabetesType: null,
  treatment: null,
  districtId: null,
  familyPhone: '',
  reminder: true,
  onboarded: false,
};

// Reads the saved profile. Returns a blank one if nothing is saved or the data is broken.
export async function loadProfile(): Promise<Profile> {
  try {
    const raw = await AsyncStorage.getItem(PROFILE_KEY);
    if (!raw) return { ...emptyProfile };
    return { ...emptyProfile, ...JSON.parse(raw) };
  } catch {
    return { ...emptyProfile };
  }
}

// Saves some fields of the profile, keeping the fields we already had.
export async function saveProfile(changes: Partial<Profile>): Promise<Profile> {
  const current = await loadProfile();
  const next = { ...current, ...changes };
  await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(next));
  return next;
}

// The saved risk check result (IDF-DAR quick quiz).
export type RiskRecord = {
  answers: Record<string, string>; // IDF-DAR element id -> option id
  score: number;
  band: 'low' | 'moderate' | 'high';
  date: string; // ISO date-time when it was done
};

const RISK_KEY = 'roza-safe/risk';

// Saves the latest risk check result on the phone.
export async function saveRisk(record: RiskRecord): Promise<void> {
  await AsyncStorage.setItem(RISK_KEY, JSON.stringify(record));
}

// Reads the latest risk check result, or null if the user has not done one.
export async function loadRisk(): Promise<RiskRecord | null> {
  try {
    const raw = await AsyncStorage.getItem(RISK_KEY);
    return raw ? (JSON.parse(raw) as RiskRecord) : null;
  } catch {
    return null;
  }
}

// One saved iftar plan (from the forecast screen). Used later by the History screen.
export type MealPlan = {
  date: string; // ISO date-time
  items: { foodId: string; count: number }[]; // the plate after the user's changes
  walk15: boolean;
  peakNow: number; // estimated peak of the plate as scanned (mmol/L)
  peakAfter: number; // estimated peak with the changes (mmol/L)
};

const MEALS_KEY = 'roza-safe/meals';
const MAX_MEALS = 60; // about two Ramadans of iftars; older ones are dropped

// Adds a plan to the saved list (newest first).
export async function saveMealPlan(plan: MealPlan): Promise<void> {
  const list = await loadMealPlans();
  await AsyncStorage.setItem(MEALS_KEY, JSON.stringify([plan, ...list].slice(0, MAX_MEALS)));
}

// Reads the saved plans (newest first). Empty list if none or broken.
export async function loadMealPlans(): Promise<MealPlan[]> {
  try {
    const raw = await AsyncStorage.getItem(MEALS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// One blood sugar reading the user typed in (mmol/L).
export type Reading = { value: number; date: string; when: 'pre-iftar' | 'emergency' | 'other' };

const READINGS_KEY = 'roza-safe/readings';
const MAX_READINGS = 200;

// Adds a reading (newest first).
export async function saveReading(reading: Reading): Promise<void> {
  const list = await loadReadings();
  await AsyncStorage.setItem(READINGS_KEY, JSON.stringify([reading, ...list].slice(0, MAX_READINGS)));
}

// Reads saved readings (newest first). Empty list if none or broken.
export async function loadReadings(): Promise<Reading[]> {
  try {
    const raw = await AsyncStorage.getItem(READINGS_KEY);
    const list = raw ? JSON.parse(raw) : [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

// App settings the user can change in Settings.
export type AppSettings = {
  scanUrl: string; // address of the scan server; empty = use the built-in one (EXPO_PUBLIC_SCAN_URL)
};

const SETTINGS_KEY = 'roza-safe/settings';

// Reads the settings (defaults if none saved).
export async function loadSettings(): Promise<AppSettings> {
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return { scanUrl: '', ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { scanUrl: '' };
  }
}

// Saves some settings, keeping the rest.
export async function saveSettings(changes: Partial<AppSettings>): Promise<AppSettings> {
  const next = { ...(await loadSettings()), ...changes };
  await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next));
  return next;
}

// Deletes everything the app saved on this phone (profile, risk, plans, readings, settings).
export async function deleteAllData(): Promise<void> {
  await AsyncStorage.multiRemove([PROFILE_KEY, RISK_KEY, MEALS_KEY, READINGS_KEY, SETTINGS_KEY]);
}
