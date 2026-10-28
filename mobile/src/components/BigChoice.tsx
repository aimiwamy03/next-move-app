import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, type } from '@/theme/tokens';

/** Grandma-simple giant Yes / No (or Dog / Cat) buttons. */
export function BigChoiceRow({
  left,
  right,
  onLeft,
  onRight,
}: {
  left: string;
  right: string;
  onLeft: () => void;
  onRight: () => void;
}) {
  return (
    <View style={styles.row}>
      <Pressable
        onPress={onLeft}
        style={({ pressed }) => [styles.btn, styles.yes, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={left}
      >
        <Text style={styles.label}>{left}</Text>
      </Pressable>
      <Pressable
        onPress={onRight}
        style={({ pressed }) => [styles.btn, styles.no, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={right}
      >
        <Text style={[styles.label, styles.noLabel]}>{right}</Text>
      </Pressable>
    </View>
  );
}

export function BigQuestionCard({
  question,
  answered,
  answerLabel,
  onYes,
  onNo,
  yesLabel = 'Yes',
  noLabel = 'No',
}: {
  question: string;
  answered?: boolean;
  answerLabel?: string;
  onYes: () => void;
  onNo: () => void;
  yesLabel?: string;
  noLabel?: string;
}) {
  return (
    <View style={styles.card}>
      <Text style={styles.q}>{question}</Text>
      {answered ? (
        <Text style={styles.done}>{answerLabel ?? 'Saved. Thank you.'}</Text>
      ) : (
        <BigChoiceRow left={yesLabel} right={noLabel} onLeft={onYes} onRight={onNo} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12, marginTop: 18 },
  btn: {
    flex: 1,
    minHeight: 88,
    borderRadius: radius.button,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  yes: { backgroundColor: colors.green },
  no: {
    backgroundColor: colors.card,
    borderWidth: 2,
    borderColor: colors.green,
  },
  pressed: { opacity: 0.88 },
  label: {
    fontFamily: type.h1.fontFamily,
    fontSize: 28,
    color: colors.white,
  },
  noLabel: { color: colors.green },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.cardLine,
    padding: 22,
    marginTop: 14,
  },
  q: {
    fontFamily: type.h2.fontFamily,
    fontSize: 24,
    lineHeight: 30,
    color: colors.heading,
  },
  done: {
    ...type.body,
    marginTop: 14,
    color: colors.green,
    fontFamily: type.bodyMedium.fontFamily,
  },
});
