/** Fixed "today" for the demo — Oct 25, 2026 (Sunday). */
export const DEMO_TODAY = new Date(2026, 9, 25);

export function toDateKey(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export const DEMO_TODAY_KEY = toDateKey(DEMO_TODAY);

/** Monday–Sunday week that ends on demo today (Oct 19–25, 2026). */
export function demoWeekDays() {
  const sunday = DEMO_TODAY;
  const monday = new Date(sunday);
  monday.setDate(sunday.getDate() - 6);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

/** Demo always assumes a full week of check-ins. */
export function demoWeekDoneKeys() {
  return demoWeekDays().map(toDateKey);
}

/** Prior days this week checked in; demo today still open. */
export function demoWeekDoneExceptTodayKeys() {
  return demoWeekDoneKeys().filter((k) => k !== DEMO_TODAY_KEY);
}

const WEEKDAY = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export function weekdayLetter(d: Date) {
  // JS: 0=Sun … 6=Sat → map to Mon-first index
  const monFirst = (d.getDay() + 6) % 7;
  return WEEKDAY[monFirst];
}
