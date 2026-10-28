import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors, space, type } from '@/theme/tokens';

export type TabName = 'Home' | 'Apply' | 'Breath' | 'Help' | 'Me';

const TABS: { name: TabName; href: string; label: string }[] = [
  { name: 'Home', href: '/(tabs)/home', label: 'Home' },
  { name: 'Apply', href: '/(tabs)/apply', label: 'Steps' },
  { name: 'Breath', href: '/(tabs)/breath', label: 'Breathe' },
  { name: 'Help', href: '/(tabs)/help', label: 'Community' },
  { name: 'Me', href: '/(tabs)/me', label: 'Me' },
];

function TabIcon({ name, active }: { name: TabName; active: boolean }) {
  const c = active ? colors.white : colors.sage;
  if (name === 'Home') {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path
          d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5z"
          stroke={c}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
  if (name === 'Apply') {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Path d="M9 6h11M9 12h11M9 18h11" stroke={c} strokeWidth={1.8} strokeLinecap="round" />
        <Circle cx={5} cy={6} r={1.6} fill={c} />
        <Circle cx={5} cy={12} r={1.6} fill={c} />
        <Circle cx={5} cy={18} r={1.6} fill={c} />
      </Svg>
    );
  }
  if (name === 'Breath') {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Circle cx={12} cy={12} r={8.5} stroke={c} strokeWidth={1.6} opacity={0.45} />
        <Circle cx={12} cy={12} r={5.5} stroke={c} strokeWidth={1.6} opacity={0.7} />
        <Circle cx={12} cy={12} r={2.6} stroke={c} strokeWidth={1.7} />
      </Svg>
    );
  }
  if (name === 'Help') {
    return (
      <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
        <Circle cx={9} cy={9} r={3} stroke={c} strokeWidth={1.7} />
        <Circle cx={16} cy={10} r={2.5} stroke={c} strokeWidth={1.7} />
        <Path
          d="M4 18c1.2-2.8 3.2-4 5-4s3.8 1.2 5 4"
          stroke={c}
          strokeWidth={1.7}
          strokeLinecap="round"
        />
        <Path
          d="M13 18c.8-2 2.2-3 3.5-3s2.5.8 3.2 2.6"
          stroke={c}
          strokeWidth={1.7}
          strokeLinecap="round"
        />
      </Svg>
    );
  }
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={3.5} stroke={c} strokeWidth={1.8} />
      <Path
        d="M5 19c1.5-3.5 4-5 7-5s5.5 1.5 7 5"
        stroke={c}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function TabBar({
  active,
  onNavigate,
}: {
  active: TabName;
  onNavigate: (href: string) => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {TABS.map((t) => {
        const on = t.name === active;
        return (
          <Pressable
            key={t.name}
            onPress={() => onNavigate(t.href)}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            accessibilityLabel={t.label}
          >
            <TabIcon name={t.name} active={on} />
            <Text
              style={[
                {
                  marginTop: 3,
                  fontSize: 13,
                  fontFamily: on ? type.tabActive.fontFamily : type.tab.fontFamily,
                  color: on ? colors.white : colors.sage,
                },
                on && styles.underline,
              ]}
              numberOfLines={1}
            >
              {t.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: space.tabBar,
    backgroundColor: colors.green,
    borderTopWidth: 1,
    borderTopColor: colors.greenDarkRing,
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 10,
  },
  tab: {
    flex: 1,
    minHeight: 52,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  underline: {
    borderBottomWidth: 2,
    borderBottomColor: colors.peach,
    paddingBottom: 2,
  },
});
