// Lets TypeScript accept require('...svg') for Figma SVG icons (shown with expo-image).
declare module '*.svg' {
  const asset: number;
  export default asset;
}
