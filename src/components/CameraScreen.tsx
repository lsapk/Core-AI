import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, Alert, Dimensions, TextInput, KeyboardAvoidingView, Platform, Modal } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { BlurView } from 'expo-blur';
import { View as MotiView, AnimatePresence } from 'moti';
import { X, Zap, ScanBarcode, Camera as CameraIcon, Loader2, Check, Type } from 'lucide-react-native';
import { analyzeMealImage } from '../services/gemini';
import { fetchProductByBarcode } from '../services/openFoodFacts';
import { useStore } from '../store/useStore';
import { useAppTheme } from '../utils/Theme';

const { width, height } = Dimensions.get('window');

export default function CameraScreen({ onComplete }: { onComplete: () => void }) {
  const theme = useAppTheme();
  const styles = getStyles(theme);
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [extraDetails, setExtraDetails] = useState('');
  const [isScanningBarcode, setIsScanningBarcode] = useState(false);
  const [flash, setFlash] = useState<'off' | 'on'>('off');
  const [analysisResult, setAnalysisResult] = useState<any | null>(null);
  const [servings, setServings] = useState('1');
  const cameraRef = useRef<CameraView>(null);
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
            <CameraIcon size={40} color={theme.colors.primary} />
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

  const handleBarcodeScan = () => {
    setServings('1');
    setIsScanningBarcode(true);
  };

  const onBarcodeScanned = async (result: any) => {
    if (isProcessing || !isScanningBarcode) return;
    try {
      setIsProcessing(true);
      setIsScanningBarcode(false);
      const product = await fetchProductByBarcode(result.data);
      setServings('1');
      setAnalysisResult(product);
    } catch (error: any) {
      console.error("Barcode scan error:", error);
      Alert.alert("Erreur", `Produit introuvable ou erreur réseau. (${error.message || 'Erreur inconnue'})`);
    } finally {
      setIsProcessing(false);
    }
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
        setBase64Image(manipResult.base64);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Error taking picture. Please try again.");
      setPreview(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const analyzeMeal = async () => {
    if (!base64Image) return;
    try {
      setIsProcessing(true);
      const result = await analyzeMealImage(base64Image, 'image/jpeg', profile?.goal, extraDetails);
      
      // Upload image to Supabase Storage
      const publicUrl = await useStore.getState().uploadImage(base64Image);
      
      setServings('1');
      setAnalysisResult({
        ...result,
        imageUrl: publicUrl || undefined
      });
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Error analyzing image. Please try again.");
      setPreview(null);
      setBase64Image(null);
      setExtraDetails('');
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmMeal = async () => {
    if (!analysisResult) return;
    const qty = parseFloat(servings.replace(',', '.')) || 1;
    try {
      setIsProcessing(true);
      await addMeal({
        date: new Date().toISOString(),
        foodName: analysisResult.foodName,
        calories: analysisResult.calories * qty,
        protein: analysisResult.protein * qty,
        carbs: analysisResult.carbs * qty,
        fat: analysisResult.fat * qty,
        servings: qty,
        imageUrl: analysisResult.imageUrl
      });
      onComplete();
    } catch (error) {
      Alert.alert("Error", "Failed to save meal.");
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
          <CameraView 
            style={StyleSheet.absoluteFill} 
            ref={cameraRef} 
            facing={"back" as any}
            enableTorch={flash === 'on'}
            onBarcodeScanned={isScanningBarcode ? onBarcodeScanned : undefined}
          />
        )}

        {/* Top Controls */}
        <View style={[styles.topControls, { paddingTop: insets.top || 20 }]}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={isScanningBarcode ? () => setIsScanningBarcode(false) : onComplete}
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
              <Zap size={24} color={flash === 'on' ? theme.colors.orange : "white"} fill={flash === 'on' ? theme.colors.orange : "transparent"} />
            </BlurView>
          </TouchableOpacity>
        </View>

        {/* Bottom Controls */}
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.bottomControls, { paddingBottom: insets.bottom + 20 }]}
        >
          {preview ? (
            <View style={styles.previewControls}>
              <View style={styles.inputContainer}>
                <Type size={20} color={theme.colors.secondaryText} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Add details (e.g. 'with olive oil')"
                  placeholderTextColor={theme.colors.secondaryText}
                  value={extraDetails}
                  onChangeText={setExtraDetails}
                  multiline
                />
              </View>
              <TouchableOpacity 
                style={styles.confirmButton} 
                onPress={analyzeMeal}
                disabled={isProcessing}
                activeOpacity={0.8}
              >
                <Check size={24} color="white" />
                <Text style={styles.confirmButtonText}>Analyze</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {!isScanningBarcode ? (
                <>
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
                </>
              ) : (
                <View style={styles.scanningOverlay}>
                  <Text style={styles.scanningText}>Point camera at barcode</Text>
                </View>
              )}
            </>
          )}
        </KeyboardAvoidingView>

        {/* Analysis Result Modal */}
        <Modal visible={!!analysisResult} transparent animationType="slide">
          <View style={styles.modalOverlay}>
            <MotiView 
              from={{ opacity: 0, translateY: 100 } as any}
              animate={{ opacity: 1, translateY: 0 } as any}
              style={styles.resultCard}
            >
              <View style={styles.modalHandle} />
              <View style={styles.resultHeader}>
                <Text style={styles.resultTitle}>Vérification</Text>
                <TouchableOpacity onPress={() => setAnalysisResult(null)} style={styles.modalCloseBtn}>
                  <X size={20} color={theme.colors.text} />
                </TouchableOpacity>
              </View>

              <Text style={styles.foodName}>{analysisResult?.foodName}</Text>
              
              <View style={styles.resultStats}>
                <View style={styles.resultStat}>
                  <Text style={styles.statValue}>{Math.round(analysisResult?.calories * (parseFloat(servings.replace(',', '.')) || 1))}</Text>
                  <Text style={styles.statLabel}>kcal</Text>
                </View>
                <View style={styles.resultStat}>
                  <Text style={styles.statValue}>{Math.round(analysisResult?.protein * (parseFloat(servings.replace(',', '.')) || 1))}g</Text>
                  <Text style={styles.statLabel}>Prot</Text>
                </View>
                <View style={styles.resultStat}>
                  <Text style={styles.statValue}>{Math.round(analysisResult?.carbs * (parseFloat(servings.replace(',', '.')) || 1))}g</Text>
                  <Text style={styles.statLabel}>Gluc</Text>
                </View>
                <View style={styles.resultStat}>
                  <Text style={styles.statValue}>{Math.round(analysisResult?.fat * (parseFloat(servings.replace(',', '.')) || 1))}g</Text>
                  <Text style={styles.statLabel}>Lip</Text>
                </View>
              </View>

              <View style={styles.quantityContainer}>
                <Text style={styles.quantityLabel}>Quantité / Portions</Text>
                <View style={styles.quantityInputWrapper}>
                  <TextInput
                    style={styles.quantityInput}
                    keyboardType="numeric"
                    value={servings}
                    onChangeText={setServings}
                  />
                  <Text style={styles.quantityUnit}>portion(s)</Text>
                </View>
              </View>

              <TouchableOpacity style={styles.confirmResultBtn} onPress={confirmMeal}>
                <Text style={styles.confirmResultBtnText}>Confirmer</Text>
              </TouchableOpacity>
            </MotiView>
          </View>
        </Modal>

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

const getStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: 'black',
  },
  cameraWrapper: {
    flex: 1,
    borderRadius: theme.radius.xl,
    overflow: 'hidden',
  },
  previewImage: {
    ...StyleSheet.absoluteFillObject,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
  },
  permissionCard: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radius.xl,
    padding: theme.spacing.xl,
    alignItems: 'center',
    ...theme.shadows.medium,
  },
  permissionIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  permissionText: {
    fontSize: 15,
    color: theme.colors.secondaryText,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: theme.spacing.xl,
  },
  grantButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: theme.radius.lg,
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
    paddingHorizontal: theme.spacing.lg,
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
    paddingHorizontal: theme.spacing.xl,
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
  previewControls: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.md,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: theme.radius.lg,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  inputIcon: {
    marginRight: theme.spacing.sm,
  },
  input: {
    flex: 1,
    color: 'white',
    fontSize: 15,
    maxHeight: 100,
  },
  confirmButton: {
    backgroundColor: theme.colors.primary,
    height: 50,
    paddingHorizontal: theme.spacing.lg,
    borderRadius: theme.radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: 'white',
    fontWeight: '700',
    marginLeft: 8,
    fontSize: 16,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
  },
  overlayContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.xl,
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
  scanningOverlay: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: theme.spacing.xl,
  },
  scanningText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  resultCard: {
    width: '100%',
    backgroundColor: theme.colors.card,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
    ...theme.shadows.medium,
  },
  modalHandle: {
    width: 40,
    height: 5,
    backgroundColor: theme.colors.separator,
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 20,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: -0.5,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  foodName: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 24,
    letterSpacing: -1,
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.separator,
  },
  resultStat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.text,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.secondaryText,
    marginTop: 4,
  },
  quantityContainer: {
    marginBottom: 32,
  },
  quantityLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.secondaryText,
    marginBottom: 8,
    marginLeft: 4,
  },
  quantityInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  quantityInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: theme.colors.text,
  },
  quantityUnit: {
    fontSize: 15,
    fontWeight: '600',
    color: theme.colors.secondaryText,
    marginLeft: 8,
  },
  confirmResultBtn: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.soft,
  },
  confirmResultBtnText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '700',
  },
});
