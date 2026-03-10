import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import { useStore } from '../store/useStore';
import { Trash2 } from 'lucide-react-native';

export default function HistoryScreen() {
  const { meals, removeMeal } = useStore();

  const groupedMeals = meals.reduce((acc, meal) => {
    const date = meal.date.split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(meal);
    return acc;
  }, {} as Record<string, typeof meals>);

  const sortedDates = Object.keys(groupedMeals).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date().toISOString().split('T')[0];
    if (dateString === today) return 'Today';
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateString === yesterday.toISOString().split('T')[0]) return 'Yesterday';

    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>History</Text>

      {sortedDates.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyEmoji}>🥗</Text>
          <Text style={styles.emptyTitle}>No meals yet</Text>
          <Text style={styles.emptySub}>Start logging your meals to see them here.</Text>
        </View>
      ) : (
        sortedDates.map(date => {
          const dayMeals = groupedMeals[date];
          const dayCalories = dayMeals.reduce((sum, meal) => sum + meal.calories, 0);

          return (
            <View key={date} style={styles.dayGroup}>
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{formatDate(date)}</Text>
                <View style={styles.dayCalsBadge}>
                  <Text style={styles.dayCalsText}>{dayCalories} kcal</Text>
                </View>
              </View>

              {dayMeals.map(meal => (
                <View key={meal.id} style={styles.mealCard}>
                  {meal.imageUrl ? (
                    <Image source={{ uri: meal.imageUrl }} style={styles.mealImage} />
                  ) : (
                    <View style={styles.mealImagePlaceholder}>
                      <Text style={{ fontSize: 24 }}>🍽️</Text>
                    </View>
                  )}
                  
                  <View style={styles.mealInfo}>
                    <Text style={styles.mealName} numberOfLines={1}>{meal.foodName}</Text>
                    <View style={styles.macrosRow}>
                      <Text style={[styles.macroText, { color: '#10b981' }]}>{meal.calories} kcal</Text>
                      <Text style={[styles.macroText, { color: '#3b82f6' }]}>P: {meal.protein}g</Text>
                      <Text style={[styles.macroText, { color: '#f59e0b' }]}>C: {meal.carbs}g</Text>
                      <Text style={[styles.macroText, { color: '#f43f5e' }]}>F: {meal.fat}g</Text>
                    </View>
                    <Text style={styles.timeText}>
                      {new Date(meal.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>

                  <TouchableOpacity onPress={() => removeMeal(meal.id)} style={styles.deleteButton}>
                    <Trash2 size={20} color="#d1d5db" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 24, paddingBottom: 100 },
  title: { fontSize: 32, fontWeight: 'bold', color: '#111827', marginBottom: 24 },
  emptyCard: { backgroundColor: 'white', borderRadius: 32, padding: 40, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  emptyEmoji: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  emptySub: { fontSize: 14, color: '#9ca3af', marginTop: 8, textAlign: 'center' },
  dayGroup: { marginBottom: 32 },
  dayHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', borderBottomWidth: 1, borderBottomColor: '#e5e7eb', paddingBottom: 12, marginBottom: 16, paddingHorizontal: 8 },
  dayTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  dayCalsBadge: { backgroundColor: '#ecfdf5', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 16 },
  dayCalsText: { color: '#10b981', fontWeight: 'bold', fontSize: 12 },
  mealCard: { flexDirection: 'row', backgroundColor: 'white', borderRadius: 24, padding: 16, marginBottom: 12, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 2 },
  mealImage: { width: 64, height: 64, borderRadius: 16 },
  mealImagePlaceholder: { width: 64, height: 64, borderRadius: 16, backgroundColor: '#f9fafb', justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#f3f4f6' },
  mealInfo: { marginLeft: 16, flex: 1 },
  mealName: { fontSize: 18, fontWeight: 'bold', color: '#111827', marginBottom: 4 },
  macrosRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },
  macroText: { fontSize: 12, fontWeight: 'bold' },
  timeText: { fontSize: 10, fontWeight: 'bold', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1 },
  deleteButton: { padding: 12 },
});
