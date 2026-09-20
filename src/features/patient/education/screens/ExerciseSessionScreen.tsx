import React, { useEffect, useRef, useState } from 'react';
import { useEducationStore } from '../state/use-education-store';
import { formatDuration } from '../../../../types/education';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  Animated, Easing, ScrollView,
} from 'react-native';
import { useTheme } from '../../../../theme/ThemeContext';

/** Session timer state machine mirrors Flutter:
 *   notStarted → running (with timer) → paused (timer suspended) → running → completed
 */
const SessionState = { NOT_STARTED: 'NOT_STARTED', RUNNING: 'RUNNING', PAUSED: 'PAUSED', COMPLETED: 'COMPLETED' } as const;

type SessionStateType = typeof SessionState[keyof typeof SessionState];

const ExerciseSessionScreen: React.FC<{ exerciseId: string; onBack: () => void }> = ({ exerciseId, onBack }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { program, recordExerciseSession } = useEducationStore();
  const [sessionState, setSessionState] = useState<SessionStateType>(SessionState.NOT_STARTED);
  const [elapsed, setElapsed] = useState(0); // seconds
  const [notes, setNotes] = useState('');
  const [perceivedEffort, setPerceivedEffort] = useState<number | undefined>(undefined);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  const exercise = program?.exercises.find(e => e.id === exerciseId);

  useEffect(() => {
    if (sessionState === SessionState.RUNNING) {
      timerRef.current = setInterval(() => setElapsed(s => s + 1), 1000);
    } else {
      if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [sessionState]);

  useEffect(() => {
    if (exercise?.durationMinutes) {
      const targetSec = exercise.durationMinutes * 60;
      Animated.timing(progressAnim, {
        toValue: targetSec > 0 ? Math.min(elapsed / targetSec, 1) : 0,
        duration: 300,
        easing: Easing.out(Easing.ease),
        useNativeDriver: false,
      }).start();
    }
  }, [elapsed, progressAnim]);

  const start = () => setSessionState(SessionState.RUNNING);
  const pause = () => setSessionState(SessionState.PAUSED);
  const resume = () => setSessionState(SessionState.RUNNING);

  const complete = async () => {
    if (!exercise) return;
    const session = {
      id: `sess-${Date.now()}`,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      completedAt: new Date().toISOString(),
      actualDurationMinutes: Math.round(elapsed / 60),
      perceivedEffort,
      notes: notes.trim() || undefined,
    };
    await recordExerciseSession(session);
    setSessionState(SessionState.COMPLETED);
  };

  const formatTime = (sec: number) => {
    const m = String(Math.floor(sec / 60)).padStart(2, '0');
    const s = String(sec % 60).padStart(2, '0');
    return `${m}:${s}`;
  };

  if (!exercise) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Exercice non trouvé</Text>
        <TouchableOpacity onPress={onBack}><Text style={styles.backLink}>← Retour</Text></TouchableOpacity>
      </View>
    );
  }

  const targetSec = exercise.durationMinutes * 60;

  if (sessionState === SessionState.COMPLETED) {
    return (
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.completionContent}>
          <View style={styles.completionIcon}><Text style={styles.completionIconText}>✓</Text></View>
          <Text style={styles.completionTitle}>Séance terminée</Text>
          <Text style={styles.completionSubtitle}>Bravo ! Vous avez complété votre exercice.</Text>
          <View style={styles.completionStats}>
            <View style={styles.statItem}><Text style={styles.statValue}>{formatTime(elapsed)}</Text><Text style={styles.statLabel}>Durée réelle</Text></View>
            <View style={styles.statItem}><Text style={styles.statValue}>{formatDuration(exercise.durationMinutes)}</Text><Text style={styles.statLabel}>Objectif</Text></View>
          </View>
          <TouchableOpacity style={styles.button} onPress={onBack}><Text style={styles.buttonText}>←  Retour au programme</Text></TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // Running / Paused / Not started state
  return (
    <View style={styles.container}>
      <Text style={styles.header}>{sessionState === SessionState.RUNNING ? 'Séance en cours' : sessionState === SessionState.PAUSED ? 'En pause' : 'Séance'}</Text>

      {/* Timer display */}
      <View style={styles.timerCircle}>
        <Animated.View style={[styles.progressRing, { borderTopColor: sessionState === SessionState.PAUSED ? colors.warning : colors.primary, borderTopWidth: 8, borderRadius: 100, width: 200 - 8, height: 200 - 8, borderColor: colors.border, borderWidth: 8 }]}>
          <View style={styles.timerTextContainer}>
            <Text style={styles.timerText}>{formatTime(elapsed)}</Text>
            <Text style={styles.timerSubText}>sur {formatDuration(exercise.durationMinutes)}</Text>
          </View>
        </Animated.View>
      </View>

      <Text style={styles.timerStatus}>{sessionState === SessionState.PAUSED ? 'En pause' : 'Séance en cours'}</Text>

      {/* Controls */}
      <View style={styles.controlsRow}>
        {sessionState === SessionState.RUNNING && (
          <>
            <TouchableOpacity style={styles.controlButtonSecondary} onPress={pause}><Text style={styles.controlButtonText}>⏸  Pause</Text></TouchableOpacity>
            <TouchableOpacity style={styles.controlButtonDanger} onPress={complete}><Text style={styles.controlButtonText}>⏹  Terminer</Text></TouchableOpacity>
          </>
        )}
        {sessionState === SessionState.PAUSED && (
          <>
            <TouchableOpacity style={styles.controlButtonPrimary} onPress={resume}><Text style={styles.controlButtonText}>▶  Reprendre</Text></TouchableOpacity>
            <TouchableOpacity style={styles.controlButtonDanger} onPress={complete}><Text style={styles.controlButtonText}>⏹  Terminer</Text></TouchableOpacity>
          </>
        )}
        {sessionState === SessionState.NOT_STARTED && (
          <TouchableOpacity style={styles.controlButtonPrimaryFull} onPress={start}><Text style={styles.controlButtonText}>▶  Commencer</Text></TouchableOpacity>
        )}
      </View>

      {/* Notes — preserved */}
      <Text style={styles.noteTitle}>Notes (optionnel)</Text>
      <Text style={styles.noteSub}>Comment s'est passée la séance ?</Text>

      <TouchableOpacity style={styles.backNav} onPress={onBack}><Text style={styles.backNavText}>← Retour au programme</Text></TouchableOpacity>
    </View>
  );
};

function createStyles(colors: any) {
  return {
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  notFound: { fontSize: 18, fontWeight: '600', color: colors.primary, marginBottom: 8 },
  notFoundSub: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 16 },
  backLink: { fontSize: 14, color: colors.primary, fontWeight: '600', textDecorationLine: 'underline' },
  header: { fontSize: 24, fontWeight: '700', color: colors.primary, paddingVertical: 20, textAlign: 'center' },
  timerCircle: { justifyContent: 'center', alignItems: 'center', marginVertical: 24 },
  timerTextContainer: { alignItems: 'center', justifyContent: 'center', width: 200, height: 200 },
  timerText: { fontSize: 48, fontWeight: '300', color: colors.primary },
  timerSubText: { fontSize: 14, color: colors.mutedForeground, marginTop: 4 },
  timerStatus: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 24 },
  progressRing: { justifyContent: 'center', alignItems: 'center', borderRadius: 100 },
  controlsRow: { flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 16 },
  controlButtonPrimary: { flex: 1, backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  controlButtonSecondary: { flex: 1, backgroundColor: colors.primaryForeground, borderColor: colors.primary, borderWidth: 2, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  controlButtonDanger: { flex: 1, backgroundColor: colors.destructive, borderRadius: 8, paddingVertical: 14, alignItems: 'center' },
  controlButtonPrimaryFull: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginHorizontal: 16 },
  controlButtonText: { color: colors.primaryForeground, fontSize: 14, fontWeight: '600' },
  effortSection: { paddingHorizontal: 16, marginTop: 8 },
  effortTitle: { fontSize: 14, fontWeight: '600', color: colors.primary, marginBottom: 8 },
  effortRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  effortButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  effortButtonSelected: { backgroundColor: colors.primary },
  effortButtonText: { fontSize: 12, fontWeight: '600', color: colors.primary },
  effortButtonTextSelected: { color: colors.primaryForeground },
  noteTitle: { fontSize: 14, fontWeight: '600', color: colors.primary, paddingHorizontal: 16, marginTop: 16, marginBottom: 4 },
  noteSub: { fontSize: 12, color: colors.mutedForeground, paddingHorizontal: 16, marginBottom: 8 },
  backNav: { padding: 16 },
  backNavText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  completionContent: { padding: 24, alignItems: 'center' },
  completionIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: colors.success, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  completionIconText: { fontSize: 36, color: colors.primaryForeground, fontWeight: '700' },
  completionTitle: { fontSize: 24, fontWeight: '700', color: colors.success, marginBottom: 8 },
  completionSubtitle: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 16 },
  completionStats: { flexDirection: 'row', gap: 24, marginBottom: 24 },
  statItem: { alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 11, color: colors.mutedForeground, marginTop: 2 },
  button: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, marginHorizontal: 16, alignItems: 'center', marginBottom: 8 },
  buttonText: { color: colors.primaryForeground, fontSize: 14, fontWeight: '600' },
}
}

export default ExerciseSessionScreen;