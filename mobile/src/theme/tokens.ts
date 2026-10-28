/** Design tokens from designs/source/build_calm.py */
export const colors = {
  cream: '#F4EFE6',
  card: '#FEFBF5',
  green: '#35493B',
  sage: '#E3E9DC',
  sageLight: '#EAEFE4',
  greenMid: '#7E9A84',
  greenDarkRing: '#3F5747',
  greenDarkRing2: '#4C6654',
  terracotta: '#B66947',
  terracottaButton: '#A65B3B',
  terracottaText: '#8E4A2C',
  peach: '#E8B49A',
  heading: '#2E3A31',
  ink: '#2B2A26',
  muted: '#5E5B53',
  faint: '#6B675E',
  line: '#E6DED0',
  cardLine: '#ECE4D6',
  track: '#DCD3C3',
  checkboxLine: '#B9B0A0',
  white: '#FFFFFF',
  noteBg: '#F6E6DC',
  noteText: '#7A3F25',
  codeError: '#C98F73',
  codeIdle: '#D9CFBF',
  stone1: '#A99B86',
  stone2: '#BFB29E',
  stone3: '#D2C7B5',
  ground: '#8E826F',
} as const;

export const fonts = {
  heading: 'Lora_500Medium',
  body: 'DMSans_400Regular',
  bodyMedium: 'DMSans_500Medium',
} as const;

/** Nothing smaller than 17px, ever. */
export const type = {
  h1: { fontFamily: fonts.heading, fontSize: 30, lineHeight: 37.5, color: colors.heading },
  h1Hero: { fontFamily: fonts.heading, fontSize: 34, lineHeight: 42.5, color: colors.heading },
  h2: { fontFamily: fonts.heading, fontSize: 22, lineHeight: 28.6, color: colors.heading },
  optionTitle: { fontFamily: fonts.bodyMedium, fontSize: 20, lineHeight: 28, color: colors.ink },
  button: { fontFamily: fonts.bodyMedium, fontSize: 18, lineHeight: 24, color: colors.white },
  list: { fontFamily: fonts.body, fontSize: 18, lineHeight: 27, color: colors.ink },
  body: { fontFamily: fonts.body, fontSize: 17, lineHeight: 25.5, color: colors.ink },
  bodyMedium: { fontFamily: fonts.bodyMedium, fontSize: 17, lineHeight: 25.5, color: colors.ink },
  bodyMuted: { fontFamily: fonts.body, fontSize: 17, lineHeight: 25.5, color: colors.muted },
  eyebrow: { fontFamily: fonts.bodyMedium, fontSize: 17, lineHeight: 25.5, color: colors.terracottaText },
  faint: { fontFamily: fonts.body, fontSize: 17, lineHeight: 25.5, color: colors.faint },
  tab: { fontFamily: fonts.body, fontSize: 17, lineHeight: 22, color: colors.muted },
  tabActive: { fontFamily: fonts.bodyMedium, fontSize: 17, lineHeight: 22, color: colors.green },
} as const;

export const space = {
  screenTop: 16,
  screenX: 28,
  screenBottom: 26,
  tabBar: 80,
} as const;

export const radius = {
  button: 12,
  card: 16,
  checkbox: 6,
} as const;

export const sizes = {
  mainButton: 60,
  secondaryButton: 56,
  optionMin: 72,
  listRowMin: 64,
  tapMin: 44,
  checkbox: 24,
  progress: 4,
  progressGap: 6,
} as const;

/** Placeholder hotline. Replace when backend is wired. */
export const HOTLINE = '5105550199';
export const HOTLINE_DISPLAY = '(510) 555-0199';
export const MOCK_SMS_CODE = '123456';
