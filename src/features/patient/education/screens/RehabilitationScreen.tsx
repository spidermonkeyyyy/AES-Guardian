import React, { useEffect, useState } from 'react';
import { useEducationStore } from '../state/use-education-store';
import { Exercise, ExerciseSession, formatDuration } from '../../../../types/education';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useTheme } from '../../../../theme/ThemeContext';

/**
 * Today's exercise selection matches Flutter source:
 *   exerciseIndex = daysSinceStart % exercises.length
 */
function getTodaysExercise(program: { startDate: string; exercises: Exercise[] }): Exercise | null {
  if (program.exercises.length === 0) return null;
  const daysSinceStart = Math.floor((Date.now() - new Date(program.startDate).getTime()) / (24 * 60 * 60 * 1000));
  const idx = ((daysSinceStart % program.exercises.length) + program.exercises.length) % program.exercises.length;
  return program.exercises[idx];
}

/** Returns 7-element boolean array: true for completed days (matches Flutter: i < weeklySessionsCompleted) */
function buildWeeklyCompletion(completed: number, target: number): boolean[] {
  const cap = Math.min(completed, target);
  return Array.from({ length: 7 }, (_, i) => i < cap);
}

function isCompletedToday(exercise: Exercise, sessions: ExerciseSession[]): boolean {
  const today = new Date();
  const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return sessions.some((s) => {
    if (s.exerciseId !== exercise.id) return false;
    const sd = new Date(s.completedAt);
    const sessionDate = new Date(sd.getFullYear(), sd.getMonth(), sd.getDate()).getTime();
    return sessionDate === todayDate;
  });
}

const RehabilitationScreen: React.FC<{ onExercisePress: (exerciseId: string) => void }> = ({ onExercisePress }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { program, exerciseSessions, isLoading, errorMessage, loadProgram, loadExerciseSessions, recordExerciseSession, clearError } = useEducationStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadProgram();
    loadExerciseSessions(10);
  }, [loadProgram, loadExerciseSessions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([loadProgram(), loadExerciseSessions(10)]);
    setRefreshing(false);
  };

  if (isLoading && !program) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.skeletonHint}>Chargement de votre programme...</Text>
      </View>
    );
  }

  if (errorMessage) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorTitle}>Impossible de charger votre programme</Text>
        <Text style={styles.errorBody}>{errorMessage}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => { clearError(); loadProgram(); }}>
          <Text style={styles.retryButtonText}>Réessayer</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!program) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyTitle}>Aucun programme assigné</Text>
        <Text style={styles.emptyBody}>
          Votre équipe soignante n'a pas encore défini de programme de rééducation pour vous.
        </Text>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadProgram()}>
          <Text style={styles.retryButtonText}>Actualiser</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const todays = getTodaysExercise(program);
  const completedThisWeek = exerciseSessions.filter(
    (s) => new Date(s.completedAt).getTime() > Date.now() - 7 * 24 * 60 * 60 * 1000,
  ).length;
  const weeklyCompletion = buildWeeklyCompletion(completedThisWeek, program.targetWeeklySessions);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Text style={styles.title}>Votre programme</Text>
      <Text style={styles.subtitle}>{program.description}</Text>

      {todays && (
        <View style={styles.todayCard}>
          <View style={styles.todayHeader}>
            <View style={styles.todayIconBox}>
              <Text style={styles.todayIcon}>📅</Text>
            </View>
            <View style={styles.todayInfo}>
              <Text style={styles.todayLabel}>Aujourd'hui</Text>
              <Text style={styles.todayName}>{todays.name}</Text>
            </View>
            <View style={styles.todayDuration}>
              <Text style={styles.todayDurationText}>{formatDuration(todays.durationMinutes)}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.startButton} onPress={() => onExercisePress(todays.id)}>
            <Text style={styles.startButtonText}>▶  Commencer la séance</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.progressCard}>
        <Text style={styles.sectionTitle}>Progression hebdomadaire</Text>
        <View style={styles.weeklyRow}>
          {weeklyCompletion.map((filled, i) => (
            <View key={i} style={[styles.dayDot, filled ? styles.dayDotFilled : styles.dayDotEmpty]}>
              {filled && <Text style={styles.dayDotCheck}>✓</Text>}
            </View>
          ))}
        </View>
        <Text style={styles.progressLabel}>
          {completedThisWeek} / {program.targetWeeklySessions} séances cette semaine
        </Text>
      </View>

      <Text style={styles.sectionTitle}>Mon programme</Text>
      {program.exercises.map((ex, idx) => {
        const isToday = todays?.id === ex.id;
        const completed = isCompletedToday(ex, exerciseSessions);
        return (
          <TouchableOpacity
            key={ex.id}
            style={[styles.exerciseCard, isToday && styles.exerciseCardToday]}
            onPress={() => onExercisePress(ex.id)}
          >
            <View style={styles.exerciseRow}>
              <View style={styles.exerciseNumber}>
                <Text style={styles.exerciseNumberText}>{idx + 1}</Text>
              </View>
              <View style={styles.exerciseInfo}>
                <Text style={styles.exerciseName}>{ex.name}</Text>
                <Text style={styles.exerciseMeta}>{formatDuration(ex.durationMinutes)}</Text>
              </View>
              <View style={styles.exerciseBadges}>
                {isToday && <View style={styles.badgeToday}><Text style={styles.badgeTodayText}>Aujourd'hui</Text></View>}
                {completed && <View style={styles.badgeDone}><Text style={styles.badgeDoneText}>✓</Text></View>}
              </View>
            </View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
};

function createStyles(colors: any) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: colors.background },
  skeletonHint: { marginTop: 12, fontSize: 14, color: colors.mutedForeground },
  title: { fontSize: 24, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.mutedForeground, marginBottom: 16 },
  todayCard: { backgroundColor: colors.secondary, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.primary },
  todayHeader: { flexDirection: 'row', alignItems: 'center' },
  todayIconBox: { width: 40, height: 40, borderRadius: 8, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center' },
  todayIcon: { fontSize: 18, color: colors.primaryForeground },
  todayInfo: { flex: 1, marginLeft: 12 },
  todayLabel: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  todayName: { fontSize: 18, fontWeight: '700', color: colors.primary },
  todayDuration: { backgroundColor: colors.primary, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 },
  todayDurationText: { color: colors.primaryForeground, fontSize: 14, fontWeight: '600' },
  startButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 12, marginTop: 12, alignItems: 'center' },
  startButtonText: { color: colors.primaryForeground, fontSize: 14, fontWeight: '600' },
  progressCard: { backgroundColor: colors.primaryForeground, borderRadius: 12, padding: 16, marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.primary, marginBottom: 8 },
  weeklyRow: { flexDirection: 'row', justifyContent: 'space-between', marginVertical: 8 },
  dayDot: { width: 32, height: 32, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  dayDotFilled: { backgroundColor: colors.success },
  dayDotEmpty: { backgroundColor: colors.border },
  dayDotCheck: { color: colors.primaryForeground, fontSize: 14, fontWeight: '700' },
  progressLabel: { fontSize: 12, color: colors.mutedForeground, marginTop: 8, textAlign: 'center' },
  exerciseCard: { backgroundColor: colors.primaryForeground, borderRadius: 12, padding: 16, marginBottom: 8, borderWidth: 1, borderColor: colors.border },
  exerciseCardToday: { borderColor: colors.primary, borderWidth: 2 },
  exerciseRow: { flexDirection: 'row', alignItems: 'center' },
  exerciseNumber: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.secondary, justifyContent: 'center', alignItems: 'center' },
  exerciseNumberText: { fontSize: 14, fontWeight: '700', color: colors.primary },
  exerciseInfo: { flex: 1, marginLeft: 12 },
  exerciseName: { fontSize: 14, fontWeight: '600', color: colors.primary },
  exerciseMeta: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },
  exerciseBadges: { flexDirection: 'row', alignItems: 'center' },
  badgeToday: { backgroundColor: colors.primary, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 2, marginRight: 4 },
  badgeTodayText: { color: colors.primaryForeground, fontSize: 10, fontWeight: '600' },
  badgeDone: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center' },
  badgeDoneText: { color: colors.primaryForeground, fontSize: 12, fontWeight: '700' },
  errorTitle: { fontSize: 18, fontWeight: '600', color: colors.primary, marginBottom: 8, textAlign: 'center' },
  errorBody: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 16 },
  retryButton: { backgroundColor: colors.primary, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, minHeight: 44, justifyContent: 'center' },
  retryButtonText: { color: colors.primaryForeground, fontSize: 14, fontWeight: '600' },
  emptyTitle: { fontSize: 18, fontWeight: '600', color: colors.primary, marginBottom: 8, textAlign: 'center' },
  emptyBody: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 16 },
});
}

export default RehabilitationScreen;