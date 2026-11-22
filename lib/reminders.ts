// Pre-iftar reminders (feature N2): a phone notification 1 hour before iftar in the user's district.
// Everything is scheduled on the phone itself. No server, no account, works offline.
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { loadProfile } from './storage';
import { findDistrict, fastTimes } from './places';
import { reminderTime } from './time';

const CHANNEL_ID = 'iftar-reminder';
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

// Clears old reminders and, if the switch is on, schedules the next 14 days for the user's district.
// Safe to call often (on app open, after changing the district or the switch).
export async function refreshReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
  const profile = await loadProfile();
  const district = findDistrict(profile.districtId);
  if (!profile.reminder || !district) return;
  if (!(await Notifications.getPermissionsAsync()).granted) return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'ইফতারের আগে মনে করিয়ে দেওয়া',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  const now = new Date();
  for (let i = 0; i < DAYS_AHEAD; i++) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
    const at = reminderTime(day, fastTimes(district, day).iftar);
    if (at <= now) continue; // today's reminder time has already passed
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'ইফতারের ১ ঘণ্টা বাকি',
        body: 'শরীর কেমন লাগছে? মাথা ঘোরা, ঘাম বা কাঁপুনি হলে এখনই সুগার মাপুন। চাপ দিয়ে চেক করুন।',
        data: { open: '/check' },
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: at, channelId: CHANNEL_ID },
    });
  }
}
