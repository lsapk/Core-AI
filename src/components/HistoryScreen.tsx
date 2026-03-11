import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { View as MotiView } from 'moti';
import { FlashList } from '@shopify/flash-list';
import { useStore } from '../store/useStore';
import { Theme } from '../utils/Theme';
import { Trash2, Calendar, Utensils } from 'lucide-react-native';

const { width } = Dimensions.get('window');

export default function HistoryScreen() {
  const { meals, removeMeal } = useStore();

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Supprimer le repas",
      `Es-tu sûr de vouloir supprimer "${name}" ?`,
      [
        { text: "Annuler", style: "cancel" },
        { text: "Supprimer", style: "destructive", onPress: () => removeMeal(id) }
      ]
    );
  };

  const groupedData = useMemo(() => {
    const groups: { title: string; data: any[]; totalCals: number }[] = [];
    const grouped = meals.reduce((acc, meal) => {
      const date = meal.date.split('T')[0];
      if (!acc[date]) acc[date] = { title: date, data: [], totalCals: 0 };
      acc[date].data.push(meal);
      acc[date].totalCals += meal.calories;
      return acc;
    }, {} as Record<string, { title: string; data: any[]; totalCals: number }>);

    return Object.values(grouped).sort((a, b) => b.title.localeCompare(a.title));
  }, [meals]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date().toISOString().split('T')[0];
    if (dateString === today) return 'Aujourd\'hui';
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (dateString === yesterday.toISOString().split('T')[0]) return 'Hier';

    return date.toLocaleDateString('fr-FR', { weekday: 'long', month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Historique</Text>
      </View>

      <FlashList
        {...({
          data: groupedData,
          keyExtractor: (item: any) => item.title,
          estimatedItemSize: 200,
          contentContainerStyle: styles.listContent,
          renderItem: ({ item: group }: any) => (
            <MotiView 
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              style={styles.dayGroup}
            >
              <View style={styles.dayHeader}>
                <Text style={styles.dayTitle}>{formatDate(group.title)}</Text>
                <View style={styles.dayBadge}>
                  <Text style={styles.dayCalsText}>{group.totalCals} kcal</Text>
                </View>
              </View>

              {group.data.map((meal: any, index: number) => (
                <TouchableOpacity 
                  key={meal.id} 
                  style={styles.mealCard}
                  activeOpacity={0.7}
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
                    <View style={styles.macrosRow}>
                      <Text style={[styles.macroText, { color: Theme.colors.primary }]}>{meal.calories} kcal</Text>
                      <View style={styles.dot} />
                      <Text style={styles.macroText}>P: {Math.round(meal.protein)}g</Text>
                      <View style={styles.dot} />
                      <Text style={styles.macroText}>G: {Math.round(meal.carbs)}g</Text>
                    </View>
                  </View>

                  <TouchableOpacity 
                    onPress={() => handleDelete(meal.id, meal.foodName)} 
                    style={styles.deleteButton}
                  >
                    <Trash2 size={18} color={Theme.colors.red} opacity={0.6} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </MotiView>
          ),
          ListEmptyComponent: (
            <View style={styles.emptyContainer}>
              <Calendar size={64} color={Theme.colors.secondaryText} opacity={0.3} />
              <Text style={styles.emptyTitle}>Rien ici pour le moment</Text>
              <Text style={styles.emptySub}>Tes repas apparaîtront ici une fois enregistrés.</Text>
            </View>
          )
        } as any)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Theme.colors.background },
  header: { padding: Theme.spacing.lg, paddingBottom: 0 },
  title: { fontSize: 34, fontWeight: '800', color: Theme.colors.text, letterSpacing: -1 },
  listContent: { padding: Theme.spacing.lg, paddingBottom: 120 },
  dayGroup: { marginBottom: Theme.spacing.xl },
  dayHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: Theme.spacing.md 
  },
  dayTitle: { fontSize: 18, fontWeight: '700', color: Theme.colors.text, textTransform: 'capitalize' },
  dayBadge: { backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dayCalsText: { color: Theme.colors.primary, fontWeight: '700', fontSize: 13 },
  mealCard: { 
    flexDirection: 'row', 
    backgroundColor: Theme.colors.card, 
    borderRadius: Theme.radius.lg, 
    padding: Theme.spacing.md, 
    marginBottom: Theme.spacing.sm, 
    alignItems: 'center', 
    ...Theme.shadows.soft 
  },
  mealImageContainer: { ...Theme.shadows.soft },
  mealImage: { width: 54, height: 54, borderRadius: 12 },
  mealImagePlaceholder: { width: 54, height: 54, borderRadius: 12, backgroundColor: Theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  mealInfo: { marginLeft: Theme.spacing.md, flex: 1 },
  mealName: { fontSize: 16, fontWeight: '700', color: Theme.colors.text, marginBottom: 2 },
  macrosRow: { flexDirection: 'row', alignItems: 'center' },
  macroText: { fontSize: 12, fontWeight: '600', color: Theme.colors.secondaryText },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: Theme.colors.separator, marginHorizontal: 6 },
  deleteButton: { padding: 8 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 20, fontWeight: '700', color: Theme.colors.text, marginTop: 20 },
  emptySub: { fontSize: 15, color: Theme.colors.secondaryText, marginTop: 8, textAlign: 'center', paddingHorizontal: 40 },
});
