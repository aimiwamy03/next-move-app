import React, { useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, radius } from '@/theme/tokens';
import { Body, TextLink } from '@/components/ui';

type Props = {
  paths: string[];
  onChange: (paths: string[]) => void;
  onClear: () => void;
};

export function SignaturePad({ paths, onChange, onClear }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const [draft, setDraft] = useState('');
  const draftRef = useRef('');
  const pathsRef = useRef(paths);
  pathsRef.current = paths;

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        draftRef.current = `M${x.toFixed(1)} ${y.toFixed(1)}`;
        setDraft(draftRef.current);
      },
      onPanResponderMove: (e) => {
        const { locationX: x, locationY: y } = e.nativeEvent;
        draftRef.current += ` L${x.toFixed(1)} ${y.toFixed(1)}`;
        setDraft(draftRef.current);
      },
      onPanResponderRelease: () => {
        if (!draftRef.current) return;
        onChange([...pathsRef.current, draftRef.current]);
        draftRef.current = '';
        setDraft('');
      },
    }),
  ).current;

  const onLayout = (e: LayoutChangeEvent) => {
    const { width, height } = e.nativeEvent.layout;
    setSize({ w: width, h: height });
  };

  const all = draft ? [...paths, draft] : paths;

  return (
    <View>
      <View style={styles.pad} onLayout={onLayout} {...pan.panHandlers}>
        <Svg width={size.w || 1} height={size.h || 170}>
          {all.map((d, i) => (
            <Path
              key={`${i}-${d.length}`}
              d={d}
              stroke={colors.green}
              strokeWidth={3}
              fill="none"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </Svg>
        <View style={styles.line} pointerEvents="none">
          <Body muted>Sign here</Body>
        </View>
      </View>
      {paths.length > 0 ? <TextLink label="Clear signature" onPress={onClear} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pad: {
    height: 170,
    borderRadius: radius.card,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardLine,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  line: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1.5,
    borderTopColor: '#CFC5B3',
    paddingTop: 8,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
});
