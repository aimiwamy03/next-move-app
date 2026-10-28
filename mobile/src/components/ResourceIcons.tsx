import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { colors } from '@/theme/tokens';

const stroke = colors.green;

export function IconFood({ size = 24, color = stroke }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 11h16a8 8 0 0 1-16 0z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M9 4c0 2 2 2 2 4M14 4c0 2 2 2 2 4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function IconHome({ size = 24, color = stroke }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M4 11l8-7 8 7v9H4z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M10 20v-5h4v5" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
    </Svg>
  );
}

export function IconPhoneDevice({ size = 24, color = stroke }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={7} y={3} width={10} height={18} rx={2} stroke={color} strokeWidth={1.8} />
      <Path d="M11 18h2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function IconId({ size = 24, color = stroke }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={3} y={6} width={18} height={13} rx={2} stroke={color} strokeWidth={1.8} />
      <Circle cx={9} cy={12} r={2} stroke={color} strokeWidth={1.8} />
      <Path d="M14 11h4M14 14h3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M6 16c1-1.5 5-1.5 6 0" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function IconClock({ size = 24, color = stroke }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
      <Path d="M12 7v5l3 2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function IconPin({ size = 24, color = stroke }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Circle cx={12} cy={10} r={2.5} stroke={color} strokeWidth={1.8} />
    </Svg>
  );
}

export function IconCall({ size = 22, color = stroke }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconBenefits({ size = 24, color = stroke }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M7 3h10v18H7z" stroke={color} strokeWidth={1.8} strokeLinejoin="round" />
      <Path d="M10 8h4M10 12h4M10 16h2" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function IconHealth({ size = 24, color = stroke }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 11c0 5.5-7 10-7 10z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function IconOfficer({ size = 24, color = stroke }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={3.5} stroke={color} strokeWidth={1.8} />
      <Path d="M5 20c1.5-4 4-6 7-6s5.5 2 7 6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}

export function IconChevron({ size = 20, color = colors.muted }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="m9 18 6-6-6-6" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
