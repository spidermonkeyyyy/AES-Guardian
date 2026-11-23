import React from 'react';
import { useEducationStore } from '../state/use-education-store';
import { formatDuration } from '../../../../types/education';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { useTheme } from '../../../../theme/ThemeContext';

const ExerciseDetailScreen: React.FC<{ exerciseId: string; onStartSession: (exerciseId: string) => void; onBack: () => void }> = ({ exerciseId, onStartSession, onBack }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  const { program } = useEducationStore();
  const exercise = program?.exercises.find(e => e.id === exerciseId);

  if (!exercise) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Exercice non trouvé</Text>
        <Text style={styles.notFoundSub}>Cet exercice n'existe pas dans votre programme.</Text>
        <TouchableOpacity onPress={onBack}><Text style={styles.backLink}>← Retour</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container as any} contentContainerStyle={styles.content as any}>
      {/* Duration header — matches Flutter source design */}
      <View style={styles.durationHeader}>
        <View style={styles.durationIcon}>
          <Text style={styles.durationIconText}>⏱</Text>
        </View>
        <View style={styles.durationInfo}>
          <Text style={styles.durationLabel}>Durée estimée</Text>
          <Text style={styles.durationValue}>{formatDuration(exercise.durationMinutes)}</Text>
        </View>
      </View>

      {/* Video placeholder — SOURCE IS EXPLICITLY PLACEHOLDER */}
      <View style={styles.videoPlaceholder}>
        <View style={styles.videoImageArea}>
          <Text style={styles.videoPlay}>▶</Text>
          <View style={styles.videoLabel}><Text style={styles.videoLabelText}>Vidéo placeholder</Text></View>
        </View>
        <View style={styles.videoInfo}>
          <View style={styles.videoTitleRow}>
            <Text style={styles.videoIcon}>🎬</Text>
            <Text style={styles.videoTitle}>Vidéo d'exercice guidé</Text>
          </View>
          <Text style={styles.videoSubtitle}>La vidéo de démonstration sera fournie par votre équipe de rééducation.</Text>
        </View>
      </View>

      {/* Start button */}
      <TouchableOpacity style={styles.startButton} onPress={() => onStartSession(exercise.id)}>
        <Text style={styles.startButtonText}>▶  Commencer la séance</Text>
      </TouchableOpacity>

      {/* Objective — source-backed, not invented */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>🎯</Text>
          <Text style={styles.sectionTitle}>Objectif</Text>
        </View>
        <Text style={styles.sectionBody}>
          Suivre l'exercice présenté dans votre programme de rééducation respiratoire.
        </Text>
      </View>

      {/* Instructions — SOURCE EXPLICITLY MARKS THESE AS PLACEHOLDERS */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionIcon}>📝</Text>
          <Text style={styles.sectionTitle}>Instructions</Text>
        </View>
        <Text style={styles.instructionText}>{exercise.instructions}</Text>

        {/* Source-backed placeholder disclaimer — preserved exactly */}
        <View style={styles.placeholderDisclaimer}>
          <Text style={styles.placeholderDisclaimerText}>⚠️ Ces consignes sont des placeholders. Les instructions validées par votre équipe soignante remplaceront ce contenu.</Text>
        </View>
      </View>
    </ScrollView>
  );
};

function createStyles(colors: any) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  notFound: { fontSize: 18, fontWeight: '600', color: colors.primary, marginBottom: 8 },
  notFoundSub: { fontSize: 14, color: colors.mutedForeground, textAlign: 'center', marginBottom: 16 },
  backLink: { fontSize: 14, color: colors.primary, fontWeight: '600', textDecorationLine: 'underline' },
  durationHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.secondary, borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: colors.primary },
  durationIcon: { width: 48, height: 48, borderRadius: 8, backgroundColor: colors.primary, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  durationIconText: { fontSize: 20, color: colors.primaryForeground },
  durationInfo: { flex: 1 },
  durationLabel: { fontSize: 12, color: colors.primary, fontWeight: '600' },
  durationValue: { fontSize: 28, fontWeight: '700', color: colors.primary },
  videoPlaceholder: { backgroundColor: colors.primaryForeground, borderRadius: 12, overflow: 'hidden', marginBottom: 16 },
  videoImageArea: { height: 200, backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  videoPlay: { fontSize: 48, color: colors.primary, backgroundColor: 'rgba(26,60,90,0.9)', width: 72, height: 72, borderRadius: 36, textAlign: 'center', lineHeight: 72 },
  videoLabel: { position: 'absolute', bottom: 12, backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 4 },
  videoLabelText: { color: colors.primaryForeground, fontSize: 12, fontWeight: '600' },
  videoInfo: { padding: 16 },
  videoTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  videoIcon: { fontSize: 18, marginRight: 8 },
  videoTitle: { fontSize: 16, fontWeight: '600', color: colors.primary },
  videoSubtitle: { fontSize: 13, color: colors.mutedForeground },
  startButton: { backgroundColor: colors.primary, borderRadius: 8, paddingVertical: 14, alignItems: 'center', marginBottom: 16 },
  startButtonText: { color: colors.primaryForeground, fontSize: 16, fontWeight: '600' },
  sectionCard: { backgroundColor: colors.primaryForeground, borderRadius: 12, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  sectionIcon: { fontSize: 20, marginRight: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.primary },
  sectionBody: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
  instructionText: { fontSize: 14, color: colors.foreground, lineHeight: 22 },
  placeholderDisclaimer: { marginTop: 12, backgroundColor: colors.primaryForeground + '3e0', borderRadius: 8, padding: 12, borderWidth: 1, borderColor: colors.warning },
  placeholderDisclaimerText: { fontSize: 12, color: colors.warning },
});
}

export default ExerciseDetailScreen;