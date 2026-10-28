import React from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextProps,
  View,
  ViewProps,
  ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { safeBack } from '@/lib/nav';
import { colors, radius, sizes, space, type } from '@/theme/tokens';

export function Screen({
  children,
  style,
  dark,
  withTabPad,
  ...rest
}: ViewProps & { dark?: boolean; withTabPad?: boolean }) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.screen,
        {
          backgroundColor: dark ? colors.green : colors.cream,
          paddingTop: Math.max(insets.top, space.screenTop),
          paddingBottom: withTabPad
            ? space.tabBar + Math.max(insets.bottom, 8)
            : Math.max(insets.bottom, space.screenBottom),
        },
        style,
      ]}
      {...rest}
    >
      {children}
    </View>
  );
}

export function Spacer({ flex = 1, max }: { flex?: number; max?: number }) {
  return <View style={{ flex, maxHeight: max }} />;
}

export function Eyebrow({ children, style, ...rest }: TextProps) {
  return (
    <Text style={[type.eyebrow, style]} {...rest}>
      {children}
    </Text>
  );
}

export function H1({ children, style, hero, light, ...rest }: TextProps & { hero?: boolean; light?: boolean }) {
  return (
    <Text style={[hero ? type.h1Hero : type.h1, light && { color: colors.white }, style]} {...rest}>
      {children}
    </Text>
  );
}

export function H2({ children, style, ...rest }: TextProps) {
  return (
    <Text style={[type.h2, style]} {...rest}>
      {children}
    </Text>
  );
}

export function Body({ children, muted, center, style, ...rest }: TextProps & { muted?: boolean; center?: boolean }) {
  return (
    <Text
      style={[muted ? type.bodyMuted : type.body, center && { textAlign: 'center' }, style]}
      {...rest}
    >
      {children}
    </Text>
  );
}

export function Tiny({ children, style, ...rest }: TextProps) {
  return (
    <Text style={[type.faint, { textAlign: 'center', marginTop: 12 }, style]} {...rest}>
      {children}
    </Text>
  );
}

export function NavRow({
  left,
  right,
}: {
  left?: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <View style={styles.nav}>
      <View style={styles.navSide}>{left}</View>
      <View style={[styles.navSide, { alignItems: 'flex-end' }]}>{right}</View>
    </View>
  );
}

export function BackButton({ onPress }: { onPress?: () => void }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => (onPress ? onPress() : safeBack(router))}
      hitSlop={12}
      style={styles.tap}
      accessibilityRole="button"
      accessibilityLabel="Back"
    >
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M19 12H5m6-6-6 6 6 6"
          stroke={colors.ink}
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Pressable>
  );
}

export function ProgressSegments({
  total = 5,
  current,
  doneAll,
}: {
  total?: number;
  current: number;
  doneAll?: boolean;
}) {
  return (
    <View style={styles.prog}>
      {Array.from({ length: total }).map((_, i) => {
        const done = doneAll || i < current - 1;
        const cur = !doneAll && i === current - 1;
        return (
          <View
            key={i}
            style={[
              styles.progSeg,
              done && { backgroundColor: colors.green },
              cur && { backgroundColor: colors.terracotta },
            ]}
          />
        );
      })}
    </View>
  );
}

type BtnProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  warm?: boolean;
  centered?: boolean;
  showArrow?: boolean;
  style?: ViewStyle;
};

export function MainButton({
  label,
  onPress,
  disabled,
  warm,
  centered,
  showArrow = true,
  style,
}: BtnProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.cta,
        warm && { backgroundColor: colors.terracottaButton },
        centered && { justifyContent: 'center', gap: 10 },
        disabled && { opacity: 0.45 },
        pressed && !disabled && { opacity: 0.9 },
        style,
      ]}
      accessibilityRole="button"
    >
      <Text style={[type.button, centered && !showArrow && { color: colors.white }]}>{label}</Text>
      {showArrow && !centered ? (
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 12h14m-6-6 6 6-6 6"
            stroke="#fff"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      ) : null}
    </Pressable>
  );
}

export function SecondaryButton({
  label,
  onPress,
  warm,
  style,
  icon,
}: {
  label: string;
  onPress: () => void;
  warm?: boolean;
  style?: ViewStyle;
  icon?: React.ReactNode;
}) {
  const color = warm ? colors.terracottaText : colors.green;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.ghost,
        { borderColor: color },
        pressed && { opacity: 0.85 },
        style,
      ]}
      accessibilityRole="button"
    >
      {icon}
      <Text style={[type.button, { color }]}>{label}</Text>
    </Pressable>
  );
}

export function TextLink({
  label,
  onPress,
  light,
  style,
}: {
  label: string;
  onPress: () => void;
  light?: boolean;
  style?: ViewStyle;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.link, style]}
      accessibilityRole="link"
    >
      <Text
        style={[
          type.body,
          {
            fontFamily: type.tabActive.fontFamily,
            color: light ? colors.white : colors.green,
            textDecorationLine: 'underline',
            textDecorationColor: light ? colors.white : colors.green,
          },
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export function Option({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.opt, selected && styles.optOn]}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
    >
      <View style={[styles.box, selected && styles.boxOn]}>
        {selected ? (
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M5 12.5l4.5 4.5L19 7.5"
              stroke="#fff"
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : null}
      </View>
      <View style={{ flex: 1 }}>
        <Text style={type.optionTitle}>{title}</Text>
        {subtitle ? <Text style={type.bodyMuted}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

export function Card({ children, style, tint }: ViewProps & { tint?: boolean }) {
  return (
    <View style={[styles.card, tint && { backgroundColor: colors.sage, borderWidth: 0 }, style]}>
      {children}
    </View>
  );
}

export function ListRow({
  label,
  meta,
  onPress,
  last,
}: {
  label: string;
  meta?: string;
  onPress?: () => void;
  last?: boolean;
}) {
  const inner = (
    <View style={[styles.row, last && { borderBottomWidth: 0 }]}>
      <Text style={type.list}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {meta ? <Text style={type.bodyMuted}>{meta}</Text> : null}
        {onPress ? (
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path
              d="m9 18 6-6-6-6"
              stroke={colors.muted}
              strokeWidth={1.8}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        ) : null}
      </View>
    </View>
  );
  if (!onPress) return inner;
  return (
    <Pressable onPress={onPress} accessibilityRole="button">
      {inner}
    </Pressable>
  );
}

export function Avatar({ initials, size = 56 }: { initials: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: colors.sage,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: type.h1.fontFamily,
          fontSize: size * 0.45,
          color: colors.green,
        }}
      >
        {initials}
      </Text>
    </View>
  );
}

export function OverwhelmedButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.ovr} accessibilityRole="button">
      <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
        <Path
          d="M3 10c2.5-3 4.5-3 7 0s4.5 3 7 0 2.5-2 4-2"
          stroke="#fff"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
        <Path
          d="M3 15c2.5-3 4.5-3 7 0s4.5 3 7 0 2.5-2 4-2"
          stroke="#fff"
          strokeWidth={1.8}
          strokeLinecap="round"
          opacity={0.7}
        />
      </Svg>
      <View>
        <Text style={{ fontFamily: type.optionTitle.fontFamily, fontSize: 20, color: colors.white }}>
          I'm overwhelmed
        </Text>
        <Text style={{ ...type.body, color: colors.white }}>Pause and breathe. One tap.</Text>
      </View>
    </Pressable>
  );
}

export function Field(props: TextInputProps) {
  return (
    <TextInput
      placeholderTextColor={colors.muted}
      {...props}
      style={[styles.field, props.style]}
    />
  );
}

export function Note({ children }: { children: React.ReactNode }) {
  return (
    <View style={styles.note}>
      <Text style={{ ...type.body, color: colors.noteText }}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingHorizontal: space.screenX,
  },
  nav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: sizes.tapMin,
    marginTop: 10,
  },
  navSide: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  tap: { minWidth: 44, minHeight: 44, justifyContent: 'center' },
  prog: { flexDirection: 'row', gap: sizes.progressGap, marginTop: 6 },
  progSeg: {
    flex: 1,
    height: sizes.progress,
    borderRadius: 2,
    backgroundColor: colors.track,
  },
  cta: {
    height: sizes.mainButton,
    borderRadius: radius.button,
    backgroundColor: colors.green,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    width: '100%',
  },
  ghost: {
    height: sizes.secondaryButton,
    borderRadius: radius.button,
    borderWidth: 1.5,
    borderColor: colors.green,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  link: {
    minHeight: sizes.tapMin,
    alignItems: 'center',
    justifyContent: 'center',
  },
  opt: {
    minHeight: sizes.optionMin,
    borderRadius: radius.button,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 18,
  },
  optOn: {
    backgroundColor: colors.sage,
    borderColor: colors.green,
  },
  box: {
    width: sizes.checkbox,
    height: sizes.checkbox,
    borderRadius: radius.checkbox,
    borderWidth: 1.5,
    borderColor: colors.checkboxLine,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxOn: {
    backgroundColor: colors.green,
    borderColor: colors.green,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.cardLine,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: sizes.listRowMin,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
  ovr: {
    height: 76,
    borderRadius: radius.button,
    backgroundColor: colors.terracottaButton,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    paddingHorizontal: 20,
  },
  field: {
    height: 68,
    borderRadius: radius.button,
    backgroundColor: colors.card,
    borderWidth: 1.5,
    borderColor: colors.green,
    paddingHorizontal: 20,
    fontSize: 26,
    fontFamily: type.bodyMedium.fontFamily,
    color: colors.ink,
  },
  note: {
    backgroundColor: colors.noteBg,
    borderRadius: radius.button,
    paddingVertical: 16,
    paddingHorizontal: 18,
  },
});
