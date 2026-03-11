import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, Dimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { BlurView } from 'expo-blur';
import { View as MotiView, AnimatePresence } from 'moti';
import { X, Zap, ScanBarcode, Camera as CameraIcon, Loader2 } from 'lucide-react-native';
import { analyzeMealImage } from '../services/gemini';
import { fetchProductByBarcode } from '../services/openFoodFacts';
import { useStore } from '../store/useStore';
import { Theme } from '../utils/Theme';

const { width, height } = Dimensions.get('window');

export default function CameraScreen({ onComplete }: { onComplete: () => void }) {
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = Camera.useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const cameraRef = useRef<Camera>(null);
  const addMeal = useStore(state => state.addMeal);
  const profile = useStore(state => state.profile);

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={[styles.permissionContainer, { paddingTop: insets.top }]}>
        <MotiView 
          from={{ opacity: 0, scale: 0.9 } as any}
          animate={{ opacity: 1, scale: 1 } as any}
          style={styles.permissionCard}
        >
          <View style={styles.permissionIcon}>
            <CameraIcon size={40} color={Theme.colors.primary} />
          </View>
          <Text style={styles.permissionTitle}>Camera Access</Text>
          <Text style={styles.permissionText}>We need camera access to analyze your meals and track your nutrition.</Text>
          <TouchableOpacity style={styles.grantButton} onPress={requestPermission}>
            <Text style={styles.grantButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </MotiView>
      </View>
    );
  }

  const handleBarcodeScan = async () => {
    Alert.prompt(
      "Scan Barcode",
      "Enter barcode number:",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Search", 
          onPress: async (barcode) => {
            if (!barcode) return;
            try {
              setIsProcessing(true);
              const product = await fetchProductByBarcode(barcode);
              await addMeal({
                date: new Date().toISOString(),
                foodName: product.foodName,
                calories: product.calories,
                protein: product.protein,
                carbs: product.carbs,
                fat: product.fat,
              });
              onComplete();
            } catch (error) {
              Alert.alert("Error", "Product not found or error fetching data.");
            } finally {
              setIsProcessing(false);
            }
          }
        }
      ]
    );
  };

  const takePicture = async () => {
    if (!cameraRef.current || isProcessing) return;
    try {
      setIsProcessing(true);
      const photo = await cameraRef.current.takePictureAsync();
      
      if (!photo) throw new Error("Failed to take photo");

      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ resize: { width: 800 } }],
        { compress: 0.7, base64: true }
      );

      setPreview(manipResult.uri);

      if (manipResult.base64) {
        const result = await analyzeMealImage(manipResult.base64, 'image/jpeg', profile?.goal);
        
        // Upload image to Supabase Storage
        const publicUrl = await useStore.getState().uploadImage(manipResult.base64);
        
        await addMeal({
          date: new Date().toISOString(),
          foodName: result.foodName,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
          imageUrl: publicUrl || undefined
        });
        onComplete();
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Error analyzing image. Please try again.");
      setPreview(null);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraWrapper}>
        {preview ? (
          <Image source={{ uri: preview }} style={styles.previewImage} />
        ) : (
          <Camera 
            style={StyleSheet.absoluteFill} 
            ref={cameraRef} 
            type={"back" as any}
            flashMode={flash === 'on' ? ("torch" as any) : ("off" as any)}
          />
        )}

        {/* Top Controls */}
        <View style={[styles.topControls, { paddingTop: insets.top || 20 }]}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={onComplete}
            activeOpacity={0.7}
          >
            <BlurView intensity={40} tint="dark" style={styles.blurIcon}>
              <X size={24} color="white" />
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => setFlash(flash === 'on' ? 'off' : 'on')}
            activeOpacity={0.7}
          >
            <BlurView intensity={40} tint="dark" style={styles.blurIcon}>
              <Zap size={24} color={flash === 'on' ? Theme.colors.orange : "white"} fill={flash === 'on' ? Theme.colors.orange : "transparent"} />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Bottom Controls */}
        <View style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}>
          <TouchableOpacity 
            style={styles.sideButton} 
            onPress={handleBarcodeScan}
            activeOpacity={0.7}
          >
            <BlurView intensity={40} tint="dark" style={styles.blurSideButton}>
              <ScanBarcode size={24} color="white" />
              <Text style={styles.sideButtonText}>Barcode</Text>
            </BlurView>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.captureButton} 
            onPress={takePicture}
            disabled={isProcessing}
            activeOpacity={0.8}
          >
            <View style={styles.captureOuter}>
              <MotiView 
                animate={{ scale: isProcessing ? 0.8 : 1 } as any}
                style={styles.captureInner} 
              />
            </View>
          </TouchableOpacity>

          <View style={styles.sideButtonPlaceholder} />
        </View>

        {/* Processing Overlay */}
        <AnimatePresence>
          {isProcessing && (
            <MotiView 
              from={{ opacity: 0 } as any}
              animate={{ opacity: 1 } as any}
              exit={{ opacity: 0 } as any}
              style={styles.overlay}
            >
              <BlurView intensity={60} tint="dark" style={StyleSheet.absoluteFill}>
                <View style={styles.overlayContent}>
                  <MotiView
                    from={{ rotate: '0deg' } as any}
                    animate={{ rotate: '360deg' } as any}
                    transition={{ loop: true, type: 'timing', duration: 2000 } as any}
                  >
                    <Loader2 size={48} color="white" />
                  </MotiView>
                  <Text style={styles.loadingText}>Analyzing Meal...</Text>
                  <Text style={styles.loadingSub}>Identifying ingredients and nutrition</Text>
                </View>
              </BlurView>
            </MotiView>
          )}
        </AnimatePresence>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'black',
  },
  cameraWrapper: {
    flex: 1,
    borderRadius: Theme.radius.xl,
    overflow: 'hidden',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: Theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  permissionCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.xl,
    alignItems: 'center',
    ...Theme.shadows.medium,
  },
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.lg,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Theme.colors.text,
    marginBottom: Theme.spacing.sm,
  },
  permissionText: {
    fontSize: 15,
    color: Theme.colors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Theme.spacing.xl,
  },
  grantButton: {
    backgroundColor: Theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: Theme.spacing.xl,
    borderRadius: Theme.radius.lg,
    width: '100%',
    alignItems: 'center',
  },
  grantButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: 16,
  },
  topControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.lg,
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  blurIcon: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.xl,
  },
  captureButton: {
    width: 84,
    height: 84,
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureOuter: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureInner: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'white',
  },
  sideButton: {
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
  },
  sideButtonPlaceholder: {
    width: 80,
  },
  blurSideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: '100%',
  },
  sideButtonText: {
    color: 'white',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 14,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  overlayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  loadingText: {
    color: 'white',
    fontSize: 22,
    fontWeight: '800',
    marginTop: 24,
    letterSpacing: -0.5,
  },
  loadingSub: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center',
  },
});
