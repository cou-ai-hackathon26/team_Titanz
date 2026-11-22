// Shrinks a photo before upload, as STACK.md says: ~1024 px wide, JPEG quality 0.7.
// A smaller photo uploads fast on mobile data and costs less for the AI to read.
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

const MAX_WIDTH = 1024;

// Returns the shrunk photo's address (to show it) and its base64 text (to send it).
export async function preparePhoto(uri: string, width: number): Promise<{ uri: string; base64: string }> {
  const context = ImageManipulator.manipulate(uri);
  if (width > MAX_WIDTH) context.resize({ width: MAX_WIDTH }); // height follows automatically
  const image = await context.renderAsync();
  const saved = await image.saveAsync({ compress: 0.7, format: SaveFormat.JPEG, base64: true });
  if (!saved.base64) throw new Error('Photo could not be read');
  return { uri: saved.uri, base64: saved.base64 };
}
