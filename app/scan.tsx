import { useRef, useState, ComponentRef } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { CameraView, useCameraPermissions, CameraType } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import Text from '../components/Txt'; // <Text> that draws Bangla digits clearly
import Icon from '../components/Icon';
import Button from '../components/Button';
import { goBack } from '../lib/nav';
import { preparePhoto } from '../lib/photo';
import { setScanPhoto, getScan, startManualScan } from '../lib/scanStore';
import { colors, fonts, radius } from '../theme/tokens';

// A dark fade at the top or bottom so white icons stay readable over the photo.
function Shade({ fromTop, height }: { fromTop: boolean; height: number }) {
  return (
    <Svg style={[styles.shade, fromTop ? { top: 0 } : { bottom: 0 }, { height }]} width="100%" height={height} preserveAspectRatio="none">
      <Defs>
        <LinearGradient id={fromTop ? 'top' : 'bottom'} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#000" stopOpacity={fromTop ? 0.65 : 0} />
          <Stop offset="1" stopColor="#000" stopOpacity={fromTop ? 0 : 0.65} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" fill={`url(#${fromTop ? 'top' : 'bottom'})`} />
    </Svg>
  );
}

// Screen 05 · Scan Camera: live camera with a framing guide. Shutter takes a photo,
// the left button picks one from the gallery. Either way the photo goes to the result screen.
export default function ScanCameraScreen() {
  const insets = useSafeAreaInsets();
  // compare=family: this photo is a family member's plate, for the side-by-side comparison.
  const { compare } = useLocalSearchParams<{ compare?: string }>();
  const next = compare ? { pathname: '/scan-result' as const, params: { compare } } : '/scan-result';
  const cameraRef = useRef<ComponentRef<typeof CameraView>>(null);
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing] = useState<CameraType>('back');
  const [flashOn, setFlashOn] = useState(false);
  const [ready, setReady] = useState(false); // camera has started
  const [busy, setBusy] = useState(false); // taking / preparing a photo
  const lastPhoto = getScan().photoUri;

  // Shrinks the photo, keeps it for the next screen, and opens the result screen.
  async function openPhoto(uri: string, width: number) {
    const photo = await preparePhoto(uri, width);
    setScanPhoto(photo.uri, photo.base64);
    router.replace(next);
  }

  // Takes a photo with the camera.
  async function takePhoto() {
    if (!cameraRef.current || !ready || busy) return;
    setBusy(true);
    try {
      const shot = await cameraRef.current.takePictureAsync({ quality: 0.8 });
      if (shot) await openPhoto(shot.uri, shot.width);
    } catch {
      setBusy(false);
    }
  }

  // Lets the user pick an existing photo from the gallery.
  async function pickFromGallery() {
    if (busy) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled || !result.assets?.[0]) return;
    setBusy(true);
    try {
      await openPhoto(result.assets[0].uri, result.assets[0].width);
    } catch {
      setBusy(false);
    }
  }

  const close = () => goBack('/home');

  // No photo: open the plate screen and pick the foods from our list by hand.
  function addByHand() {
    startManualScan();
    router.replace(next);
  }

  // Camera permission not decided yet (a split second).
  if (!permission) return <View style={styles.screen} />;

  // Permission refused: explain why, offer to ask again, and still allow the gallery.
  if (!permission.granted) {
    return (
      <View style={[styles.screen, styles.ask, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }]}>
        <StatusBar style="light" />
        <Icon name="photo_camera" size={48} color={colors.textOnBrand} />
        <Text style={styles.askTitle}>ক্যামেরা ব্যবহারের অনুমতি দিন</Text>
        <Text style={styles.askBody}>প্লেটের ছবি তুলতে ক্যামেরা লাগবে। ছবি শুধু বিশ্লেষণে পাঠানো হয়, কোথাও সংরক্ষণ হয় না।</Text>
        <Button label="অনুমতি দিন" sub="Allow camera" variant="Light" onPress={requestPermission} style={styles.askButton} />
        <Button label="গ্যালারি থেকে ছবি" sub="Choose from gallery" variant="Secondary" onPress={pickFromGallery} style={styles.askButton} />
        <Button label="ছবি ছাড়া নিজে যোগ করুন" sub="Add foods by hand" variant="Secondary" onPress={addByHand} style={styles.askButton} />
        <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="বন্ধ করুন (Close)" hitSlop={10}>
          <Text style={styles.askClose}>বন্ধ করুন</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <CameraView
        ref={cameraRef}
        style={StyleSheet.absoluteFill}
        facing={facing}
        flash={flashOn ? 'on' : 'off'}
        onCameraReady={() => setReady(true)}
      />
      <Shade fromTop height={180} />
      <Shade fromTop={false} height={284} />

      <View style={[styles.topControls, { top: insets.top + 16 }]}>
        <Pressable onPress={close} accessibilityRole="button" accessibilityLabel="বন্ধ করুন (Close)" style={styles.glassButton} hitSlop={8}>
          <Icon name="close" size={22} color={colors.textOnBrand} />
        </Pressable>
        <Pressable
          onPress={() => setFlashOn(!flashOn)}
          accessibilityRole="switch"
          accessibilityLabel="ফ্ল্যাশ (Flash)"
          accessibilityState={{ checked: flashOn }}
          style={styles.glassButton}
          hitSlop={8}
        >
          <Icon name={flashOn ? 'flash_on' : 'flash_off'} size={22} color={colors.textOnBrand} />
        </Pressable>
      </View>

      {/* Framing guide in the middle of the screen */}
      <View style={styles.guide} pointerEvents="none">
        <Image source={require('../assets/scan/frame-corners.svg')} style={styles.corners} />
        <View style={styles.scanLine} />
        <View style={styles.hintChip}>
          <Text style={styles.hintText}>{compare ? 'পরিবারের সদস্যের প্লেটটি ফ্রেমে রাখুন' : 'পুরো প্লেটটি ফ্রেমের ভিতরে রাখুন'}</Text>
        </View>
      </View>

      <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.shutterRow}>
          <Pressable onPress={pickFromGallery} accessibilityRole="button" accessibilityLabel="গ্যালারি থেকে ছবি (Gallery)" style={styles.gallery}>
            {lastPhoto ? (
              <Image source={{ uri: lastPhoto }} style={styles.galleryPhoto} contentFit="cover" />
            ) : (
              <Icon name="photo_library" size={24} color={colors.textOnBrand} />
            )}
          </Pressable>
          <Pressable
            onPress={takePhoto}
            disabled={!ready || busy}
            accessibilityRole="button"
            accessibilityLabel="ছবি তুলুন (Take photo)"
            style={({ pressed }) => [styles.shutter, pressed ? styles.shutterPressed : null]}
          >
            {busy ? (
              <ActivityIndicator color={colors.textOnBrand} size="large" />
            ) : (
              <Image source={require('../assets/scan/shutter.svg')} style={styles.shutter} />
            )}
          </Pressable>
          <Pressable
            onPress={() => setFacing(facing === 'back' ? 'front' : 'back')}
            accessibilityRole="button"
            accessibilityLabel="ক্যামেরা বদলান (Switch camera)"
            style={styles.switchButton}
          >
            <Icon name="cameraswitch" size={22} color={colors.textOnBrand} />
          </Pressable>
        </View>
        <Pressable onPress={addByHand} accessibilityRole="button" accessibilityLabel="ছবি ছাড়া নিজে খাবার যোগ করুন (Add foods by hand)" style={styles.byHand} hitSlop={8}>
          <Icon name="edit" size={18} color={colors.textOnBrand} />
          <Text style={styles.byHandText}>ছবি ছাড়া নিজে যোগ করুন</Text>
        </Pressable>
        <Text style={styles.privacy}>ছবি শুধু বিশ্লেষণে পাঠানো হয়, কোথাও সংরক্ষণ হয় না</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0E0F0E' }, // Figma camera background (behind the live view)
  shade: { position: 'absolute', left: 0, right: 0 },
  topControls: { position: 'absolute', left: 20, right: 20, flexDirection: 'row', justifyContent: 'space-between' },
  glassButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  guide: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  corners: { width: 290, height: 290 },
  scanLine: {
    position: 'absolute',
    width: 250,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.bgPage,
    shadowColor: colors.bgPage,
    shadowOpacity: 0.9,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  hintChip: {
    position: 'absolute',
    top: '50%',
    marginTop: 167, // just under the 290px frame
    backgroundColor: 'rgba(11,74,51,0.7)',
    borderRadius: radius.tile,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  hintText: { fontFamily: fonts.banglaSemiBold, fontSize: 14, lineHeight: 19, color: colors.textOnBrand },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, gap: 16 },
  shutterRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 40 },
  gallery: {
    width: 48,
    height: 48,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  galleryPhoto: { width: 48, height: 48 },
  shutter: { width: 84, height: 84, alignItems: 'center', justifyContent: 'center' },
  shutterPressed: { opacity: 0.8 },
  switchButton: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  privacy: { textAlign: 'center', fontFamily: fonts.bangla, fontSize: 12, lineHeight: 16, color: colors.textOnBrand, opacity: 0.75 },
  ask: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24, gap: 16 },
  askTitle: { fontFamily: fonts.banglaBold, fontSize: 22, lineHeight: 30, color: colors.textOnBrand, textAlign: 'center' },
  askBody: { fontFamily: fonts.bangla, fontSize: 15, lineHeight: 21, color: colors.textOnBrand, opacity: 0.8, textAlign: 'center' },
  askButton: { alignSelf: 'stretch' },
  byHand: { alignSelf: 'center', flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.18)' },
  byHandText: { fontFamily: fonts.banglaSemiBold, fontSize: 15, lineHeight: 21, color: colors.textOnBrand },
  askClose: { fontFamily: fonts.banglaMedium, fontSize: 15, lineHeight: 20, color: colors.textOnBrand, opacity: 0.8 },
});
