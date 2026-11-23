import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { AppCard, AppButton } from '../../../components';
import { useAuthStore } from '../../authentication/hooks/use-auth-store';
import { useTheme } from '../../../theme/ThemeContext';
import { useLocale, t, isRTL } from '../../../localization';

export default function PatientHomeScreen({ navigation }: any) {
  const { colors } = useTheme();
  const locale = useLocale();
  const rtl = isRTL(locale);
  const user = useAuthStore((s) => s.user);
  const name = user?.name?.split(' ')[0]?.replace(/\(.*\)/, '').trim();
  const greeting = name
    ? t('patient.home.greeting', locale).replace('{name}', name)
    : t('patient.home.greetingGeneric', locale);
  const todayDateStr = new Date().toLocaleDateString(
    { fr: 'fr-FR', en: 'en-GB', ar: 'ar' }[locale],
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    },
  );

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { direction: rtl ? 'rtl' : 'ltr' }]}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.greeting, { color: colors.foreground }]}>{greeting}</Text>
          <Text style={[styles.dateText, { color: colors.mutedForeground }]}>{todayDateStr}</Text>
        </View>
        <TouchableOpacity
          style={[styles.profileBadge, { backgroundColor: colors.secondary }]}
          onPress={() => navigation.navigate('profile')}
          accessibilityRole="button"
          accessibilityLabel={t('patient.home.profileButton', locale)}
        >
          <Icon name="user" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <AppCard
        variant="flat"
        style={[styles.demoNotice, { backgroundColor: colors.infoBackground }]}
      >
        <Text style={[styles.demoNoticeText, { color: colors.info }]}>
          {t('patient.home.demoNotice', locale)}
        </Text>
      </AppCard>

      {/* Daily monitoring */}
      <AppCard variant="outlined" style={styles.actionCard}>
        <View style={styles.actionCardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
            <Icon name="activity" size={24} color={colors.primary} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, { color: colors.foreground }]}>
              {t('patient.home.monitorTitle', locale)}
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>
              {t('patient.home.monitorSubtitle', locale)}
            </Text>
          </View>
        </View>
        <AppButton
          title={t('patient.home.monitorAction', locale)}
          onPress={() => navigation.navigate('monitor')}
          variant="primary"
          style={styles.actionButton}
        />
      </AppCard>

      {/* Care plan */}
      <AppCard variant="outlined" style={styles.actionCard}>
        <View style={styles.actionCardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
            <Icon name="clipboard" size={24} color={colors.primary} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, { color: colors.foreground }]}>
              {t('patient.home.carePlanTitle', locale)}
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>
              {t('patient.home.carePlanSubtitle', locale)}
            </Text>
          </View>
        </View>
        <AppButton
          title={t('patient.home.carePlanAction', locale)}
          onPress={() => navigation.navigate('treatment')}
          variant="outline"
          style={styles.actionButton}
        />
      </AppCard>

      {/* Care team */}
      <AppCard variant="flat" style={styles.teamCard}>
        <View style={styles.actionCardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
            <Icon name="message-square" size={24} color={colors.primary} />
          </View>
          <View style={styles.actionTextContainer}>
            <Text style={[styles.actionTitle, { color: colors.foreground }]}>
              {t('patient.home.careTeamTitle', locale)}
            </Text>
            <Text style={[styles.actionSubtitle, { color: colors.mutedForeground }]}>
              {t('patient.home.careTeamSubtitle', locale)}
            </Text>
          </View>
        </View>
        <AppButton
          title={t('patient.home.messagesAction', locale)}
          onPress={() => navigation.navigate('messages')}
          variant="secondary"
          style={styles.actionButton}
        />
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
  demoNotice: {
    padding: spacing.md,
  },
  demoNoticeText: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    lineHeight: 18,
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
    marginEnd: spacing.md,
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
});
