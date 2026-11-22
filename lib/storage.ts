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
