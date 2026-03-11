import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, Dimensions, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { View as MotiView, AnimatePresence } from 'moti';
import Svg, { Circle } from 'react-native-svg';
import { useStore } from '../store/useStore';
import { Theme } from '../utils/Theme';
import { ChevronRight, Flame, Target, Utensils, Plus, Droplets, Camera as CameraIcon, Search, X, Bot } from 'lucide-react-native';

const { width } = Dimensions.get('window');

const ProgressRing = ({ size, strokeWidth, progress, color }: { size: number, strokeWidth: number, progress: number, color: string }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <Svg width={size} height={size}>
      <Circle
        stroke={Theme.colors.background}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
      />
      <Circle
        stroke={color}
        fill="none"
        cx={size / 2}
        cy={size / 2}
        r={radius}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
    </Svg>
  );
};

export default function DashboardScreen({ onNavigate }: { onNavigate: (tab: 'home' | 'chat' | 'camera' | 'history' | 'profile') => void }) {
  const { meals, profile, water, addWater, addMeal } = useStore();
  const [isManualModalVisible, setIsManualModalVisible] = useState(false);
  const [manualMeal, setManualMeal] = useState({
    foodName: '',
    calories: '',
    protein: '',
    carbs: '',
    fat: '',
  });

  const handleManualSubmit = async () => {
    if (!manualMeal.foodName || !manualMeal.calories) {
      Alert.alert("Erreur", "Veuillez entrer au moins un nom et les calories.");
      return;
    }

    try {
      await addMeal({
        date: new Date().toISOString(),
        foodName: manualMeal.foodName,
        calories: parseInt(manualMeal.calories),
        protein: parseFloat(manualMeal.protein) || 0,
        carbs: parseFloat(manualMeal.carbs) || 0,
        fat: parseFloat(manualMeal.fat) || 0,
      });
      setIsManualModalVisible(false);
      setManualMeal({ foodName: '', calories: '', protein: '', carbs: '', fat: '' });
    } catch (error) {
      Alert.alert("Erreur", "Impossible d'ajouter le repas.");
    }
  };

  const dailyGoal = profile?.daily_calories_goal || 2000;
  const proteinGoal = profile?.protein_goal || 150;
  const carbsGoal = profile?.carbs_goal || 200;
  const fatGoal = profile?.fat_goal || 65;

  const today = new Date().toISOString().split('T')[0];
  const todaysMeals = useMemo(() => meals.filter(meal => meal.date.startsWith(today)), [meals, today]);
  
  const totalCalories = useMemo(() => todaysMeals.reduce((sum, meal) => sum + meal.calories, 0), [todaysMeals]);
  const totalProtein = useMemo(() => todaysMeals.reduce((sum, meal) => sum + meal.protein, 0), [todaysMeals]);
  const totalCarbs = useMemo(() => todaysMeals.reduce((sum, meal) => sum + meal.carbs, 0), [todaysMeals]);
  const totalFat = useMemo(() => todaysMeals.reduce((sum, meal) => sum + meal.fat, 0), [todaysMeals]);

  const remainingCalories = Math.max(0, dailyGoal - totalCalories);
  const progress = Math.min(1, totalCalories / dailyGoal);

  return (
    <ScrollView 
      style={styles.container} 
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Summary Card */}
      <MotiView 
        from={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={styles.card}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Aujourd'hui</Text>
          <View style={styles.dateBadge}>
            <Text style={styles.dateText}>{new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</Text>
          </View>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.circleWrapper}>
            <ProgressRing 
              size={160} 
              strokeWidth={14} 
              progress={progress} 
              color={Theme.colors.primary} 
            />
            <View style={styles.circleOverlay}>
              <Text style={styles.caloriesText}>{remainingCalories}</Text>
              <Text style={styles.caloriesLabel}>kcal restants</Text>
            </View>
          </View>

          <View style={styles.statsColumn}>
            <View style={styles.miniStat}>
              <View style={[styles.miniIcon, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                <Flame size={16} color={Theme.colors.primary} />
              </View>
              <View>
                <Text style={styles.miniLabel}>Consommé</Text>
                <Text style={styles.miniValue}>{totalCalories} kcal</Text>
              </View>
            </View>
            
            <View style={styles.miniStat}>
              <View style={[styles.miniIcon, { backgroundColor: 'rgba(0, 122, 255, 0.1)' }]}>
                <Target size={16} color={Theme.colors.blue} />
              </View>
              <View>
                <Text style={styles.miniLabel}>Objectif</Text>
                <Text style={styles.miniValue}>{dailyGoal} kcal</Text>
              </View>
            </View>
          </View>
        </View>
      </MotiView>

      {/* Macros */}
      <View style={styles.macrosRow}>
        {[
          { label: 'Protéines', value: totalProtein, goal: proteinGoal, color: Theme.colors.blue, icon: 'P' },
          { label: 'Glucides', value: totalCarbs, goal: carbsGoal, color: Theme.colors.orange, icon: 'G' },
          { label: 'Lipides', value: totalFat, goal: fatGoal, color: Theme.colors.red, icon: 'L' },
        ].map((macro, index) => (
          <MotiView 
            key={macro.label}
            from={{ opacity: 0, translateY: 20 }}
            animate={{ opacity: 1, translateY: 0 }}
            transition={{ delay: 100 + (index * 100) }}
            style={styles.macroCard}
          >
            <View style={[styles.macroIcon, { backgroundColor: `${macro.color}15` }]}>
              <Text style={[styles.macroIconText, { color: macro.color }]}>{macro.icon}</Text>
            </View>
            <Text style={styles.macroValue}>{Math.round(macro.value)}g</Text>
            <Text style={styles.macroLabel}>{macro.label}</Text>
            <View style={styles.macroProgressContainer}>
              <View style={[styles.macroProgressBar, { width: `${Math.min(100, (macro.value / macro.goal) * 100)}%`, backgroundColor: macro.color }]} />
            </View>
          </MotiView>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={() => onNavigate('chat')}>
          <View style={[styles.actionIcon, { backgroundColor: Theme.colors.primary }]}>
            <Bot size={24} color="white" />
          </View>
          <Text style={styles.actionLabel}>AI Chat</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionBtn}>
          <View style={[styles.actionIcon, { backgroundColor: Theme.colors.blue }]}>
            <Search size={24} color="white" />
          </View>
          <Text style={styles.actionLabel}>Chercher</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionBtn} onPress={() => setIsManualModalVisible(true)}>
          <View style={[styles.actionIcon, { backgroundColor: Theme.colors.orange }]}>
            <Plus size={24} color="white" />
          </View>
          <Text style={styles.actionLabel}>Manuel</Text>
        </TouchableOpacity>
      </View>

      {/* AI Assistant Card */}
      <TouchableOpacity 
        style={styles.aiCard}
        onPress={() => onNavigate('chat')}
      >
        <View style={styles.aiCardContent}>
          <View style={styles.aiIconContainer}>
            <Bot size={24} color="white" />
          </View>
          <View style={styles.aiTextContainer}>
            <Text style={styles.aiTitle}>AI Nutritionist</Text>
            <Text style={styles.aiSub}>"Combien de calories dans un croissant ?"</Text>
          </View>
          <ChevronRight size={20} color={Theme.colors.secondaryText} />
        </View>
      </TouchableOpacity>

      {/* Water Tracker */}
      <MotiView 
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        style={styles.waterCard}
      >
        <View style={styles.waterHeader}>
          <View style={styles.waterTitleRow}>
            <Droplets size={20} color={Theme.colors.blue} />
            <Text style={styles.waterTitle}>Hydratation</Text>
          </View>
          <Text style={styles.waterGoal}>Objectif: 2.5L</Text>
        </View>
        
        <View style={styles.waterContent}>
          <View style={styles.waterInfo}>
            <Text style={styles.waterValue}>{(water / 1000).toFixed(1)}L</Text>
            <Text style={styles.waterSub}>Continue comme ça ! 💧</Text>
          </View>
          
          <View style={styles.waterControls}>
            <TouchableOpacity 
              style={styles.addWaterBtn}
              onPress={() => addWater(250)}
            >
              <Plus size={20} color="white" />
              <Text style={styles.addWaterText}>250ml</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.waterProgressBg}>
          <View style={[styles.waterProgressBar, { width: `${Math.min(100, (water / 2500) * 100)}%` }]} />
        </View>
      </MotiView>

      {/* Recent Meals */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Repas récents</Text>
      </View>

      {todaysMeals.length === 0 ? (
        <View style={styles.emptyCard}>
          <Utensils size={32} color={Theme.colors.secondaryText} opacity={0.3} />
          <Text style={styles.emptyText}>Aucun repas aujourd'hui</Text>
        </View>
      ) : (
        todaysMeals.slice(0, 3).map((meal, index) => (
          <MotiView 
            key={meal.id} 
            from={{ opacity: 0, translateX: -20 }}
            animate={{ opacity: 1, translateX: 0 }}
            transition={{ delay: 300 + (index * 100) }}
            style={styles.mealCard}
          >
            <View style={styles.mealImageContainer}>
              {meal.imageUrl ? (
                <Image source={{ uri: meal.imageUrl }} style={styles.mealImage} />
              ) : (
                <View style={styles.mealImagePlaceholder}>
                  <Utensils size={20} color={Theme.colors.secondaryText} />
                </View>
              )}
            </View>
            <View style={styles.mealInfo}>
              <Text style={styles.mealName} numberOfLines={1}>{meal.foodName}</Text>
              <Text style={styles.mealCals}>{meal.calories} kcal</Text>
            </View>
            <ChevronRight size={20} color={Theme.colors.separator} />
          </MotiView>
        ))
      )}

      {/* Manual Entry Modal */}
      <Modal visible={isManualModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <MotiView from={{ translateY: 300 }} animate={{ translateY: 0 }} style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajout manuel</Text>
              <TouchableOpacity onPress={() => setIsManualModalVisible(false)}>
                <X size={24} color={Theme.colors.text} />
              </TouchableOpacity>
            </View>

            <TextInput
              style={styles.input}
              placeholder="Nom du repas"
              value={manualMeal.foodName}
              onChangeText={(v) => setManualMeal({...manualMeal, foodName: v})}
            />
            <TextInput
              style={styles.input}
              placeholder="Calories"
              keyboardType="numeric"
              value={manualMeal.calories}
              onChangeText={(v) => setManualMeal({...manualMeal, calories: v})}
            />
            
            <View style={styles.macrosInputRow}>
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Prot (g)"
                keyboardType="numeric"
                value={manualMeal.protein}
                onChangeText={(v) => setManualMeal({...manualMeal, protein: v})}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Gluc (g)"
                keyboardType="numeric"
                value={manualMeal.carbs}
                onChangeText={(v) => setManualMeal({...manualMeal, carbs: v})}
              />
              <TextInput
                style={[styles.input, { flex: 1 }]}
                placeholder="Lip (g)"
                keyboardType="numeric"
                value={manualMeal.fat}
                onChangeText={(v) => setManualMeal({...manualMeal, fat: v})}
              />
            </View>

            <TouchableOpacity style={styles.submitBtn} onPress={handleManualSubmit}>
              <Text style={styles.submitBtnText}>Ajouter le repas</Text>
            </TouchableOpacity>
          </MotiView>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  content: { padding: Theme.spacing.lg, paddingBottom: 120 },
  card: { 
    backgroundColor: Theme.colors.card, 
    borderRadius: Theme.radius.xl, 
    padding: Theme.spacing.lg, 
    marginBottom: Theme.spacing.lg,
    ...Theme.shadows.soft 
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.lg },
  cardTitle: { fontSize: 20, fontWeight: '800', color: Theme.colors.text, letterSpacing: -0.5 },
  dateBadge: { backgroundColor: Theme.colors.background, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  dateText: { fontSize: 12, fontWeight: '700', color: Theme.colors.secondaryText },
  progressContainer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  circleWrapper: { width: 160, height: 160, justifyContent: 'center', alignItems: 'center' },
  circleOverlay: { position: 'absolute', alignItems: 'center' },
  caloriesText: { fontSize: 38, fontWeight: '900', color: Theme.colors.text, letterSpacing: -1 },
  caloriesLabel: { fontSize: 12, fontWeight: '700', color: Theme.colors.secondaryText, marginTop: -4 },
  statsColumn: { flex: 1, marginLeft: Theme.spacing.lg, gap: Theme.spacing.md },
  miniStat: { flexDirection: 'row', alignItems: 'center' },
  miniIcon: { width: 36, height: 36, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  miniLabel: { fontSize: 11, fontWeight: '600', color: Theme.colors.secondaryText },
  miniValue: { fontSize: 15, fontWeight: '800', color: Theme.colors.text },
  macrosRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: Theme.spacing.xl, gap: Theme.spacing.sm },
  macroCard: { flex: 1, backgroundColor: Theme.colors.card, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, ...Theme.shadows.soft },
  macroIcon: { width: 28, height: 28, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  macroIconText: { fontSize: 12, fontWeight: '800' },
  macroValue: { fontSize: 18, fontWeight: '900', color: Theme.colors.text, letterSpacing: -0.5 },
  macroLabel: { fontSize: 11, fontWeight: '600', color: Theme.colors.secondaryText },
  macroProgressContainer: { height: 4, width: '100%', backgroundColor: Theme.colors.background, borderRadius: 2, marginTop: 8, overflow: 'hidden' },
  macroProgressBar: { height: '100%', borderRadius: 2 },
  quickActions: { flexDirection: 'row', gap: Theme.spacing.md, marginBottom: Theme.spacing.xl },
  actionBtn: { flex: 1, backgroundColor: Theme.colors.card, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, alignItems: 'center', ...Theme.shadows.soft },
  actionIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  actionLabel: { fontSize: 12, fontWeight: '700', color: Theme.colors.text },
  aiCard: {
    backgroundColor: Theme.colors.card,
    borderRadius: Theme.radius.xl,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.xl,
    ...Theme.shadows.soft,
  },
  aiCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Theme.spacing.md,
  },
  aiTextContainer: {
    flex: 1,
  },
  aiTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Theme.colors.text,
  },
  aiSub: {
    fontSize: 13,
    color: Theme.colors.secondaryText,
    marginTop: 2,
  },
  waterCard: { backgroundColor: Theme.colors.card, borderRadius: Theme.radius.xl, padding: Theme.spacing.lg, marginBottom: Theme.spacing.xl, ...Theme.shadows.soft },
  waterHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.md },
  waterTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  waterTitle: { fontSize: 18, fontWeight: '800', color: Theme.colors.text },
  waterGoal: { fontSize: 12, fontWeight: '600', color: Theme.colors.secondaryText },
  waterContent: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: Theme.spacing.md },
  waterInfo: { flex: 1 },
  waterValue: { fontSize: 28, fontWeight: '900', color: Theme.colors.text, letterSpacing: -0.5 },
  waterSub: { fontSize: 12, color: Theme.colors.secondaryText },
  waterControls: { flexDirection: 'row', gap: 8 },
  addWaterBtn: { backgroundColor: Theme.colors.blue, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 6 },
  addWaterText: { color: 'white', fontWeight: '800', fontSize: 14 },
  waterProgressBg: { height: 8, backgroundColor: Theme.colors.background, borderRadius: 4, overflow: 'hidden' },
  waterProgressBar: { height: '100%', backgroundColor: Theme.colors.blue },
  sectionHeader: { marginBottom: Theme.spacing.md },
  sectionTitle: { fontSize: 22, fontWeight: '800', color: Theme.colors.text, letterSpacing: -0.5 },
  mealCard: { flexDirection: 'row', backgroundColor: Theme.colors.card, borderRadius: Theme.radius.lg, padding: Theme.spacing.md, marginBottom: Theme.spacing.sm, alignItems: 'center', ...Theme.shadows.soft },
  mealImageContainer: { ...Theme.shadows.soft },
  mealImage: { width: 50, height: 50, borderRadius: 10 },
  mealImagePlaceholder: { width: 50, height: 50, borderRadius: 10, backgroundColor: Theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  mealInfo: { marginLeft: Theme.spacing.md, flex: 1 },
  mealName: { fontSize: 16, fontWeight: '700', color: Theme.colors.text },
  mealCals: { fontSize: 14, fontWeight: '600', color: Theme.colors.primary },
  emptyCard: { padding: 40, alignItems: 'center', opacity: 0.5 },
  emptyText: { marginTop: 10, color: Theme.colors.secondaryText, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: Theme.colors.card, borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: Theme.spacing.xl },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 22, fontWeight: '800' },
  input: { backgroundColor: Theme.colors.background, borderRadius: 12, padding: 15, marginBottom: 15, fontSize: 16, fontWeight: '600' },
  macrosInputRow: { flexDirection: 'row', gap: 10 },
  submitBtn: { backgroundColor: Theme.colors.primary, padding: 18, borderRadius: 15, alignItems: 'center', marginTop: 10 },
  submitBtnText: { color: 'white', fontSize: 18, fontWeight: '800' },
});
