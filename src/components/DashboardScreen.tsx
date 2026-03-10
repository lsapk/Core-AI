import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { useStore } from '../store/useStore';

export default function DashboardScreen() {
  const { meals, dailyGoal } = useStore();

  const today = new Date().toISOString().split('T')[0];
  const todaysMeals = meals.filter(meal => meal.date.startsWith(today));
  
  const totalCalories = todaysMeals.reduce((sum, meal) => sum + meal.calories, 0);
  const totalProtein = todaysMeals.reduce((sum, meal) => sum + meal.protein, 0);
  const totalCarbs = todaysMeals.reduce((sum, meal) => sum + meal.carbs, 0);
  const totalFat = todaysMeals.reduce((sum, meal) => sum + meal.fat, 0);

  const remainingCalories = Math.max(0, dailyGoal - totalCalories);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Summary Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Today</Text>
        <View style={styles.circleContainer}>
          <View style={styles.circle}>
            <Text style={styles.caloriesText}>{remainingCalories}</Text>
            <Text style={styles.caloriesLabel}>Kcal Left</Text>
          </View>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Eaten</Text>
            <Text style={styles.statValue}>{totalCalories}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Goal</Text>
            <Text style={styles.statValue}>{dailyGoal}</Text>
          </View>
        </View>
      </View>

      {/* Macros */}
      <View style={styles.macrosRow}>
        <View style={styles.macroCard}>
          <Text style={styles.macroLabel}>Protein</Text>
          <Text style={[styles.macroValue, { color: '#3b82f6' }]}>{Math.round(totalProtein)}g</Text>
        </View>
        <View style={styles.macroCard}>
          <Text style={styles.macroLabel}>Carbs</Text>
          <Text style={[styles.macroValue, { color: '#f59e0b' }]}>{Math.round(totalCarbs)}g</Text>
        </View>
        <View style={styles.macroCard}>
          <Text style={styles.macroLabel}>Fat</Text>
          <Text style={[styles.macroValue, { color: '#f43f5e' }]}>{Math.round(totalFat)}g</Text>
        </View>
      </View>

      {/* Meals List */}
      <Text style={styles.sectionTitle}>Meals</Text>
      {todaysMeals.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🍽️</Text>
          <Text style={styles.emptyTitle}>No meals logged today</Text>
          <Text style={styles.emptySub}>Tap the camera to add one!</Text>
        </View>
      ) : (
        todaysMeals.map(meal => (
          <View key={meal.id} style={styles.mealCard}>
            {meal.imageUrl ? (
              <Image source={{ uri: meal.imageUrl }} style={styles.mealImage} />
            ) : (
              <View style={styles.mealImagePlaceholder}>
                <Text style={{ fontSize: 24 }}>🍽️</Text>
              </View>
            )}
            <View style={styles.mealInfo}>
              <Text style={styles.mealName}>{meal.foodName}</Text>
              <Text style={styles.mealCals}>{meal.calories} kcal</Text>
            </View>
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 100 },
  card: { backgroundColor: 'white', borderRadius: 32, padding: 24, marginBottom: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  cardTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 24 },
  circleContainer: { alignItems: 'center', marginBottom: 32 },
  circle: { width: 200, height: 200, borderRadius: 100, borderWidth: 8, borderColor: '#10b981', justifyContent: 'center', alignItems: 'center' },
  caloriesText: { fontSize: 48, fontWeight: '900', color: '#111827' },
  caloriesLabel: { fontSize: 14, fontWeight: '600', color: '#9ca3af', textTransform: 'uppercase', marginTop: 4 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  statBox: { alignItems: 'center' },
  statLabel: { fontSize: 12, fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 4 },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  statDivider: { width: 1, height: 40, backgroundColor: '#f3f4f6' },
  macrosRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 24 },
  macroCard: { flex: 1, backgroundColor: 'white', borderRadius: 24, padding: 16, alignItems: 'center', marginHorizontal: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  macroLabel: { fontSize: 10, fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', marginBottom: 8 },
  macroValue: { fontSize: 20, fontWeight: '900' },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 16, marginTop: 8 },
  emptyCard: { backgroundColor: 'white', borderRadius: 24, padding: 32, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  emptyEmoji: { fontSize: 40, marginBottom: 16 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: '#111827' },
  emptySub: { fontSize: 14, color: '#9ca3af', marginTop: 4 },
  mealCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 24, padding: 16, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  mealImage: { width: 64, height: 64, borderRadius: 16 },
  mealImagePlaceholder: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center' },
  mealInfo: { marginLeft: 16, flex: 1 },
  mealName: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  mealCals: { fontSize: 14, fontWeight: '600', color: '#10b981', marginTop: 4 },
});
