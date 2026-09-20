import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { AppCard, RespiBadge, AppButton } from '../../../components';
import { useAuthStore } from '../../authentication/hooks/use-auth-store';
import { useTheme } from '../../../theme/ThemeContext';

export default function PatientHomeScreen({ navigation }: any) {
  const { colors, isDark } = useTheme();
  const user = useAuthStore((s) => s.user);
  const [refreshing, setRefreshing] = useState(false);
  const [medicationTaken, setMedicationTaken] = useState(false);

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  };

  const todayDateStr = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const firstName = (user?.name || 'Amina').split(' ')[0].replace(/\(.*\)/, '').trim();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.foreground }]}>Bonjour, {firstName} 👋</Text>
          <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{todayDateStr}</Text>
        </View>
        <TouchableOpacity
          style={[styles.profileBadge, { backgroundColor: colors.secondary }]}
          onPress={() => navigation.navigate('profile')}
        >
          <Icon name="user" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 1. Health Status Card */}
      <AppCard variant="elevated" style={styles.healthCard}>
        <View style={styles.cardHeaderRow}>
          <View>
            <Text style={[styles.cardTitle, { color: colors.foreground }]}>État de santé actuel</Text>
            <Text style={[styles.cardSubtitle, { color: colors.mutedForeground }]}>Dernière mesure : Aujourd'hui à 08:30</Text>
          </View>
          <RespiBadge label="Stable" variant="success" />
        </View>
        <View style={[styles.metricsRow, { backgroundColor: colors.surfaceVariant }]}>
          <View style={styles.metricBox}>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>SpO₂</Text>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>96 <Text style={[styles.metricUnit, { color: colors.mutedForeground }]}>%</Text></Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
          <View style={styles.metricBox}>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Pouls</Text>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>72 <Text style={[styles.metricUnit, { color: colors.mutedForeground }]}>bpm</Text></Text>
          </View>
          <View style={[styles.metricDivider, { backgroundColor: colors.border }]} />
          <View style={styles.metricBox}>
            <Text style={[styles.metricLabel, { color: colors.mutedForeground }]}>Dyspnée</Text>
            <Text style={[styles.metricValue, { color: colors.foreground }]}>2 <Text style={[styles.metricUnit, { color: colors.mutedForeground }]}>/ 4</Text></Text>
          </View>
        </View>
      </AppCard>

      {/* 2. Daily Monitoring Card */}
      <AppCard variant="outlined" style={styles.actionCard}>
        <View style={styles.actionCardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
            <Icon name="activity" size={24} color={colors.primary} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, { color: colors.foreground }]}>Questionnaire quotidien</Text>
            <Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>Renseignez vos symptômes du jour (3 min)</Text>
          </View>
        </View>
        <AppButton
          title="Commencer mon questionnaire"
          onPress={() => navigation.navigate('monitor')}
          variant="primary"
          style={styles.actionButton}
        />
      </AppCard>

      {/* 3. Medication Treatment Card */}
      <AppCard variant="outlined" style={styles.actionCard}>
        <View style={styles.actionCardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: colors.warningBackground }]}>
                      <Icon name="disc" size={24} color={colors.warning} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, { color: colors.foreground }]}>Traitement du jour</Text>
            <Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>
              {medicationTaken ? 'Traitement du matin validé' : 'Inhalateur Spiriva (2 bouffées à 09:00)'}
            </Text>
          </View>
        </View>
        <AppButton
          title={medicationTaken ? 'Traitement pris ✓' : 'Confirmer la prise'}
          onPress={() => setMedicationTaken(!medicationTaken)}
          variant={medicationTaken ? 'secondary' : 'outline'}
          style={styles.actionButton}
        />
      </AppCard>

      {/* 4. Rehabilitation Card */}
      <AppCard variant="outlined" style={styles.actionCard}>
        <View style={styles.actionCardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: colors.infoBackground }]}>
                      <Icon name="heart" size={24} color={colors.info} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, { color: colors.foreground }]}>Exercices de réhabilitation</Text>
            <Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>Session de respiration lèvre pincée (10 min)</Text>
          </View>
        </View>
        <AppButton
          title="Voir mes exercices"
          onPress={() => navigation.navigate('treatment')}
          variant="outline"
          style={styles.actionButton}
        />
      </AppCard>

      {/* 5. Care Team Card */}
      <AppCard variant="flat" style={styles.teamCard}>
        <View style={styles.teamRow}>
          <View style={[styles.nurseAvatar, { backgroundColor: colors.primary }]}>
            <Text style={[styles.nurseAvatarText, { color: colors.primaryForeground }]}>IB</Text>
          </View>
          <View style={styles.nurseInfo}>
            <Text style={[styles.nurseName, { color: colors.foreground }]}>Infirmière Sarah Benali</Text>
            <Text style={[styles.nurseRole, { color: colors.mutedForeground }]}>Équipe de télé-suivi Sanad</Text>
          </View>
          <TouchableOpacity
            style={[styles.messageButton, { backgroundColor: colors.secondary }]}
            onPress={() => navigation.navigate('messages')}
          >
            <Icon name="message-square" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </AppCard>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.screenPadding, gap: spacing.md },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  greeting: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize['2xl'],
    fontWeight: typography.fontWeight.bold,
  },
  dateText: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
    textTransform: 'capitalize',
  },
  profileBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  healthCard: {},
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  cardTitle: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  cardSubtitle: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderRadius: shapes.md,
    paddingVertical: spacing.md,
  },
  metricBox: {
    alignItems: 'center',
  },
  metricLabel: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
  },
  metricValue: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginTop: 2,
  },
  metricUnit: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.normal,
  },
  metricDivider: {
    width: 1,
    height: 24,
  },
  actionCard: {
    padding: spacing.cardPadding,
  },
  actionCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
  },
  actionSubtitle: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    marginTop: 2,
  },
  actionButton: {
    marginTop: spacing.xs,
  },
  teamCard: {
    padding: spacing.md,
  },
  teamRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  nurseAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nurseAvatarText: {
    fontWeight: typography.fontWeight.bold,
    fontSize: typography.fontSize.sm,
  },
  nurseInfo: {
    flex: 1,
    marginLeft: spacing.md,
  },
  nurseName: {
    fontFamily: typography.fontFamily.urbanist,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
  },
  nurseRole: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
  },
  messageButton: {
    padding: spacing.xs,
    borderRadius: shapes.sm,
  },
});
