import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Image, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';
import { analyzeMealImage } from '../services/gemini';
import { fetchProductByBarcode } from '../services/openFoodFacts';
import { useStore } from '../store/useStore';

export default function CameraScreen({ onComplete }: { onComplete: () => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const addMeal = useStore(state => state.addMeal);

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>We need camera access to scan meals.</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleBarcodeScan = async () => {
    Alert.prompt(
      "Scan Barcode",
      "Enter barcode number (e.g. 3017620422003):",
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
    if (!cameraRef.current) return;
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
        const result = await analyzeMealImage(manipResult.base64, 'image/jpeg');
        
        await addMeal({
          date: new Date().toISOString(),
          foodName: result.foodName,
          calories: result.calories,
          protein: result.protein,
          carbs: result.carbs,
          fat: result.fat,
          imageUrl: manipResult.uri
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
      {preview ? (
        <Image source={{ uri: preview }} style={StyleSheet.absoluteFill} />
      ) : (
        <CameraView style={StyleSheet.absoluteFill} ref={cameraRef} facing="back" />
      )}
      
      {isProcessing && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#10b981" />
          <Text style={styles.loadingText}>Analyzing...</Text>
        </View>
      )}

      {!isProcessing && !preview && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.barcodeButton} onPress={handleBarcodeScan}>
            <Text style={styles.barcodeText}>Barcode</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
            <View style={styles.captureInner} />
          </TouchableOpacity>
          
          <View style={{ width: 60 }} /> {/* Spacer to balance barcode button */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'black', justifyContent: 'center', borderRadius: 32, overflow: 'hidden' },
  text: { color: 'white', textAlign: 'center', marginBottom: 20, fontSize: 16 },
  button: { backgroundColor: '#10b981', padding: 15, borderRadius: 12, alignSelf: 'center' },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  loadingText: { color: 'white', marginTop: 16, fontSize: 18, fontWeight: 'bold' },
  bottomBar: { position: 'absolute', bottom: 40, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 20 },
  captureButton: { width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.3)', justifyContent: 'center', alignItems: 'center' },
  captureInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'white' },
  barcodeButton: { backgroundColor: 'rgba(255,255,255,0.2)', paddingVertical: 12, paddingHorizontal: 16, borderRadius: 20 },
  barcodeText: { color: 'white', fontWeight: 'bold' }
});
