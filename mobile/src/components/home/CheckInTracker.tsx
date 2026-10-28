import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import {
  DEMO_TODAY,
  DEMO_TODAY_KEY,
  demoWeekDays,
  toDateKey,
  weekdayLetter,
} from '@/lib/demoDate';
import { colors, type } from '@/theme/tokens';

function CheckMark({ color }: { color: string }) {
  return (
    <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 13l4 4L19 7"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CheckInTracker({
  doneDates,
  todayDone,
}: {
  doneDates: string[];
  todayDone: boolean;
}) {
  const done = new Set(doneDates);
  if (todayDone) done.add(DEMO_TODAY_KEY);
  const week = demoWeekDays();

  return (
    <View style={styles.wrap} accessibilityRole="summary" accessibilityLabel="Check-in week">
      <Text style={styles.label}>Week of Oct 19</Text>
      <View style={styles.row}>
        {week.map((d) => {
          const key = toDateKey(d);
          const isDone = done.has(key);
          const isToday = key === DEMO_TODAY_KEY;
          const isFuture = d.getTime() > DEMO_TODAY.getTime();
          return (
            <View key={key} style={styles.cell}>
              <Text style={[styles.weekday, isToday && styles.weekdayToday]}>
                {weekdayLetter(d)}
              </Text>
              <View
                style={[
                  styles.dot,
                  isDone && styles.dotDone,
                  isToday && !isDone && styles.dotToday,
                  isFuture && styles.dotFuture,
                ]}
              >
                {isDone ? (
                  <CheckMark color={colors.white} />
                ) : (
                  <Text style={[styles.dateNum, isToday && styles.dateNumToday]}>{d.getDate()}</Text>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginTop: 28,
    paddingHorizontal: 4,
  },
  label: {
    ...type.bodyMuted,
    textAlign: 'center',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cell: {
    alignItems: 'center',
    gap: 6,
    width: 40,
  },
  weekday: {
    fontFamily: type.body.fontFamily,
    fontSize: 13,
    color: colors.muted,
  },
  weekdayToday: {
    color: colors.terracottaText,
    fontFamily: type.bodyMedium.fontFamily,
  },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  dotToday: {
    borderColor: colors.terracotta,
    borderWidth: 2,
  },
  dotFuture: {
    opacity: 0.45,
  },
  dateNum: {
    fontFamily: type.body.fontFamily,
    fontSize: 13,
    color: colors.muted,
  },
  dateNumToday: {
    color: colors.terracottaText,
    fontFamily: type.bodyMedium.fontFamily,
  },
});
