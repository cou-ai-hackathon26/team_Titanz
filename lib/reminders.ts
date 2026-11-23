// Pre-iftar reminders (feature N2): a phone notification 1 hour before iftar in the user's district.
// Everything is scheduled on the phone itself. No server, no account, works offline.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { loadProfile } from './storage';
import { findDistrict, fastTimes } from './places';
import { reminderTime } from './time';

const CHANNEL_ID = 'iftar-reminder';
const PILL_MINUTES_BEFORE_SEHRI_END = 30;
const DAYS_AHEAD = 14; // how many days of reminders we keep ready (refreshed every time the app opens)

// Show reminders even when the app is open.
Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

// Asks the phone for permission to show notifications. Returns true if allowed.
export async function askReminderPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) return true;
  if (!current.canAskAgain) return false;
  const asked = await Notifications.requestPermissionsAsync();
  return asked.granted;
}

// Clears old reminders and schedules the next 14 days for the user's district:
// the pre-iftar check (if on) and, for tablet/insulin users, the sehri medicine reminder (if on).
// Safe to call often (on app open, after changing the district or the switch).
export async function refreshReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const profile = await loadProfile();
  const district = findDistrict(profile.districtId);
  const takesMedicine = profile.treatment === 'tablets' || profile.treatment === 'insulin';
  const wantPill = profile.pillReminder && takesMedicine;
  if ((!profile.reminder && !wantPill) || !district) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'রোজার রিমাইন্ডার (Fasting reminders)',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const now = new Date();
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const times = fastTimes(district, day);

    // 1 hour before iftar: how do you feel? (tap opens the pre-iftar check)
    const iftarAt = reminderTime(day, times.iftar);
    if (profile.reminder && iftarAt > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'ইফতারের ১ ঘণ্টা বাকি',
          body: 'শরীর কেমন লাগছে? মাথা ঘোরা, ঘাম বা কাঁপুনি হলে এখনই সুগার মাপুন। চাপ দিয়ে চেক করুন।',
          data: { open: '/check' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: iftarAt, channelId: CHANNEL_ID },
      });
    }

    // 30 minutes before sehri ends: medicine reminder. Never a dose — only "as your doctor said".
    const pillAt = reminderTime(day, times.sehriEnd, PILL_MINUTES_BEFORE_SEHRI_END);
    if (wantPill && pillAt > now) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'সেহরির সময় শেষ হতে ৩০ মিনিট বাকি',
          body: 'সেহরির ওষুধ ডাক্তার যেভাবে বলেছেন সেভাবে নিন। নিজে থেকে ডোজ বদলাবেন না।',
          data: { open: '/home' },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: pillAt, channelId: CHANNEL_ID },
      });
    }
  }
}
