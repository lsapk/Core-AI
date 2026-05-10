import React, { useMemo, memo } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { View as MotiView } from 'moti';
import { FlashList } from '@shopify/flash-list';
import { useStore } from '../store/useStore';
import { useAppTheme } from '../utils/Theme';
import { Trash2, Calendar, Utensils } from 'lucide-react-native';

const { width } = Dimensions.get('window');

function HistoryScreen() {
  const theme = useAppTheme();
  const styles = getStyles(theme);
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
    const grouped = meals.reduce((acc, meal) => {
      const date = meal.date.split('T')[0];
      if (!acc[date]) acc[date] = { title: date, data: [], totalCals: 0 };
      acc[date].data.push(meal);
      acc[date].totalCals += meal.calories;
      return acc;
    }, {} as Record<string, { title: string; data: any[]; totalCals: number }>);

    return Object.values(grouped).sort((a, b) => b.title.localeCompare(a.title));
  }, [meals]);

  const weeklyStats = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => {
      const dayData = meals.filter(m => m.date.startsWith(date));
      const totalCals = dayData.reduce((sum, m) => sum + m.calories, 0);
      return {
        date,
        dayName: new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' }),
        calories: totalCals
      };
    });
  }, [meals]);

  const maxWeeklyCals = useMemo(() => Math.max(...weeklyStats.map(s => s.calories), 2000), [weeklyStats]);

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

      <View style={styles.statsSection}>
        <View style={styles.statsCard}>
          <Text style={styles.statsCardTitle}>7 derniers jours</Text>
          <View style={styles.chartContainer}>
            {weeklyStats.map((day, i) => (
              <View key={day.date} style={styles.chartBarWrapper}>
                <MotiView
                  from={{ height: 0 }}
                  animate={{ height: Math.max(10, (day.calories / maxWeeklyCals) * 100) }}
                  transition={{ type: 'spring', delay: i * 50 }}
                  style={[
                    styles.chartBar,
                    { backgroundColor: i === 6 ? theme.colors.primary : theme.colors.accent + '60' }
                  ]}
                />
                <Text style={styles.chartDayLabel}>{day.dayName}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <FlashList
        {...({
          data: groupedData,
          keyExtractor: (item: any) => item.title,
          estimatedItemSize: 200,
          contentContainerStyle: styles.listContent,
          renderItem: ({ item: group, index }: any) => (
            <MotiView 
              from={{ opacity: 0, translateY: 20 }}
              animate={{ opacity: 1, translateY: 0 }}
              transition={{ type: 'spring', delay: Math.min(index * 50, 500) }}
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
                        <Utensils size={20} color={theme.colors.secondaryText} />
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.mealInfo}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={[styles.mealName, { flex: 1 }]} numberOfLines={1}>{meal.foodName}</Text>
                      {meal.servings > 0 && (
                        <Text style={styles.servingsText}>x{meal.servings}</Text>
                      )}
                    </View>
                    <Text style={styles.mealTypeLabel}>
                      {meal.mealType === 'breakfast' ? 'Petit déj' : meal.mealType === 'lunch' ? 'Déjeuner' : meal.mealType === 'dinner' ? 'Dîner' : meal.mealType === 'snack' ? 'Collation' : 'Repas'}
                    </Text>
                    <View style={styles.macrosRow}>
                      <Text style={[styles.macroText, { color: theme.colors.primary }]}>{meal.calories} kcal</Text>
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
                    <Trash2 size={18} color={theme.colors.red} opacity={0.6} />
                  </TouchableOpacity>
                </TouchableOpacity>
              ))}
            </MotiView>
          ),
          ListEmptyComponent: (
            <View style={styles.emptyContainer}>
              <Calendar size={64} color={theme.colors.secondaryText} opacity={0.3} />
              <Text style={styles.emptyTitle}>Rien ici pour le moment</Text>
              <Text style={styles.emptySub}>Tes repas apparaîtront ici une fois enregistrés.</Text>
            </View>
          )
        } as any)}
      />
    </View>
  );
}

export default memo(HistoryScreen);

const getStyles = (theme: ReturnType<typeof useAppTheme>) => StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing.lg, paddingBottom: 0 },
  title: { fontSize: 34, fontWeight: '800', color: theme.colors.text, letterSpacing: -1 },
  statsSection: { padding: theme.spacing.lg, paddingBottom: 0 },
  statsCard: {
    backgroundColor: theme.colors.card,
    borderRadius: 24,
    padding: 20,
    ...theme.shadows.soft,
    borderWidth: 1,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
  },
  statsCardTitle: { fontSize: 16, fontWeight: '700', color: theme.colors.text, marginBottom: 20 },
  chartContainer: {
    flexDirection: 'row',
    height: 140,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  chartBarWrapper: { alignItems: 'center', flex: 1 },
  chartBar: { width: 30, borderRadius: 8, minHeight: 4 },
  chartDayLabel: { fontSize: 10, fontWeight: '600', color: theme.colors.secondaryText, marginTop: 8 },
  listContent: { padding: theme.spacing.lg, paddingBottom: 120 },
  dayGroup: { marginBottom: theme.spacing.xl },
  dayHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  dayTitle: { fontSize: 20, fontWeight: '700', color: theme.colors.text, textTransform: 'capitalize', letterSpacing: -0.5 },
  dayBadge: { backgroundColor: theme.isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  dayCalsText: { color: theme.colors.text, fontWeight: '700', fontSize: 13 },
  mealCard: { 
    flexDirection: 'row', 
    backgroundColor: theme.colors.card, 
    borderRadius: 20,
    padding: 12, 
    marginBottom: 12, 
    alignItems: 'center', 
    ...theme.shadows.soft,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)',
  },
  mealImageContainer: { ...theme.shadows.soft },
  mealImage: { width: 60, height: 60, borderRadius: 14 },
  mealImagePlaceholder: { width: 60, height: 60, borderRadius: 14, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  mealInfo: { marginLeft: 16, flex: 1 },
  mealName: { fontSize: 17, fontWeight: '600', color: theme.colors.text, marginBottom: 2, letterSpacing: -0.3 },
  mealTypeLabel: { fontSize: 13, fontWeight: '500', color: theme.colors.secondaryText, marginBottom: 4 },
  servingsText: { fontSize: 13, fontWeight: '700', color: theme.colors.primary, backgroundColor: 'rgba(16, 185, 129, 0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, overflow: 'hidden' },
  macrosRow: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  macroText: { fontSize: 13, fontWeight: '500', color: theme.colors.secondaryText },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: theme.colors.separator, marginHorizontal: 6 },
  deleteButton: { padding: 8, marginLeft: 8 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 100 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: theme.colors.text, marginTop: 20, letterSpacing: -0.5 },
  emptySub: { fontSize: 15, color: theme.colors.secondaryText, marginTop: 8, textAlign: 'center', paddingHorizontal: 40, lineHeight: 22 },
});
