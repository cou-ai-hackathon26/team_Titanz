import { toBanglaDigits } from './bangla';

// Districts the user can pick, with their map position (used to work out sehri and iftar times).
export type District = { id: string; name: string; lat: number; lng: number };

export const districts: District[] = [
  { id: 'cumilla', name: 'কুমিল্লা', lat: 23.4607, lng: 91.1809 },
  { id: 'dhaka', name: 'ঢাকা', lat: 23.8103, lng: 90.4125 },
  { id: 'chattogram', name: 'চট্টগ্রাম', lat: 22.3569, lng: 91.7832 },
  { id: 'sylhet', name: 'সিলেট', lat: 24.8949, lng: 91.8687 },
  { id: 'rajshahi', name: 'রাজশাহী', lat: 24.3745, lng: 88.6042 },
  { id: 'khulna', name: 'খুলনা', lat: 22.8456, lng: 89.5403 },
  { id: 'barishal', name: 'বরিশাল', lat: 22.701, lng: 90.3535 },
  { id: 'rangpur', name: 'রংপুর', lat: 25.7439, lng: 89.2752 },
  { id: 'mymensingh', name: 'ময়মনসিংহ', lat: 24.7471, lng: 90.4203 },
];

// Finds a district by its id (or undefined if not found).
export function findDistrict(id: string | null): District | undefined {
  return districts.find((d) => d.id === id);
}

const BD_UTC_OFFSET_MIN = 6 * 60; // Bangladesh time is UTC+6, no daylight saving

// Works out, in minutes after midnight (Bangladesh time), when the sun is at a given angle.
// Uses the standard NOAA sun-position formula. "zenith" 90.833 = sunset, 108 = dawn (Fajr, 18°).
function sunEventMinutes(date: Date, lat: number, lng: number, zenith: number, morning: boolean): number {
  const startOfYear = Date.UTC(date.getFullYear(), 0, 1);
  const dayOfYear = Math.floor((Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) - startOfYear) / 86400000) + 1;
  const g = ((2 * Math.PI) / 365) * (dayOfYear - 1); // position in the year, as an angle
  // How much the sun runs early/late (minutes) and how far north/south it is (radians).
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl =
    0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const latRad = (lat * Math.PI) / 180;
  const cosHourAngle = Math.cos((zenith * Math.PI) / 180) / (Math.cos(latRad) * Math.cos(decl)) - Math.tan(latRad) * Math.tan(decl);
  const hourAngleDeg = (Math.acos(Math.min(1, Math.max(-1, cosHourAngle))) * 180) / Math.PI;
  const utcMinutes = 720 - 4 * (lng + (morning ? hourAngleDeg : -hourAngleDeg)) - eqTime;
  return utcMinutes + BD_UTC_OFFSET_MIN;
}

// Today's sehri end (dawn) and iftar (sunset) for a district, in minutes after midnight.
export function fastTimes(district: District, date = new Date()) {
  return {
    sehriEnd: sunEventMinutes(date, district.lat, district.lng, 108, true),
    iftar: sunEventMinutes(date, district.lat, district.lng, 90.833, false),
  };
}

// Shows minutes-after-midnight as a Bangla clock time with AM/PM, e.g. 1092 -> "৬:১২ PM".
export function formatClock(minutes: number): string {
  const total = Math.round(minutes) % (24 * 60);
  const h24 = Math.floor(total / 60);
  const m = total % 60;
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12;
  const ampm = h24 < 12 ? 'AM' : 'PM';
  return `${toBanglaDigits(h12)}:${toBanglaDigits(String(m).padStart(2, '0'))} ${ampm}`;
}
