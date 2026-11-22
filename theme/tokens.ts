// Design tokens from Figma ("My choice" page). Use ONLY these colors, radii and fonts.

// All app colors. Names match the Figma variables (e.g. "bg/app" -> bgApp).
export const colors = {
  bgApp: '#F7F7F4', // app background
  bgSurface: '#FFFFFF', // cards, sheets, nav bar
  bgSurfaceMuted: '#F2F2EE', // grey tiles, icon circles, steppers
  bgBrandStrong: '#0B4A33', // main buttons, dark cards
  bgBrand: '#205C42', // dark hero areas
  bgPage: '#E2F28F', // lime: iftar card, selected answer, scan button
  bgAccent: '#DAE386', // lime chart bars
  iconAccent: '#E3E86A', // small lime accents
  bgAccentSoft: '#F4FBD1', // very light lime fills
  textPrimary: '#10231A', // main text
  textSecondary: '#6B726C', // sub-labels, English lines
  textBrand: '#046C4B', // green text, links
  textOnBrand: '#FFFFFF', // text on dark green
  borderDefault: '#DEDEDC', // card and button borders (also "neutral-300")
  borderBrand: '#046C4B', // selected answer border
  riskLow: '#258267',
  riskLowSoft: '#E3F2E6',
  riskModerate: '#E3A33A',
  riskModerateSoft: '#FBEFD6',
  riskHigh: '#D95040',
  riskHighSoft: '#FBE3DF',
};

// Corner roundness. "pill" makes a fully round end.
export const radius = {
  card: 24,
  tile: 20,
  input: 16,
  pill: 999,
};

// Font family names, loaded in app/_layout.tsx.
export const fonts = {
  bangla: 'HindSiliguri_400Regular',
  banglaMedium: 'HindSiliguri_500Medium',
  banglaSemiBold: 'HindSiliguri_600SemiBold',
  banglaBold: 'HindSiliguri_700Bold',
  english: 'Inter_400Regular',
  englishMedium: 'Inter_500Medium',
  englishSemiBold: 'Inter_600SemiBold',
  englishBold: 'Inter_700Bold',
  icons: 'MaterialSymbolsRounded',
  // Bangla digits ০–৯ only (Noto Sans Bengali). Used automatically by <Txt>; Hind Siliguri's "১" is hard to read.
  digits: 'BanglaDigits_400Regular',
  digitsMedium: 'BanglaDigits_500Medium',
  digitsSemiBold: 'BanglaDigits_600SemiBold',
  digitsBold: 'BanglaDigits_700Bold',
};

// Soft card / chip shadow from Figma (0 8 24 rgba(15,36,26,0.12)).
export const softShadow = {
  shadowColor: '#0F241A',
  shadowOffset: { width: 0, height: 8 },
  shadowOpacity: 0.12,
  shadowRadius: 24,
  elevation: 6,
};
