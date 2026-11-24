import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { AppIcon } from '../../../components/AppIcon';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { useTheme, ThemeMode } from '../../../theme/ThemeContext';
import { AppHeader, AppCard } from '../../../components';
import { useAuthStore } from '../../authentication/hooks/use-auth-store';
import { logout } from '../../authentication/hooks/use-auth';
import {
  LOCALE_LABELS,
  SUPPORTED_LOCALES,
  SupportedLocale,
  TranslationKey,
  isRTL,
  setLocale,
  t,
  useLocale,
} from '../../../localization';

const themeOptions: { mode: ThemeMode; label: TranslationKey; icon: string }[] = [
  { mode: 'light', label: 'patient.profile.theme.light', icon: 'sun' },
  { mode: 'dark', label: 'patient.profile.theme.dark', icon: 'moon' },
  { mode: 'system', label: 'patient.profile.theme.system', icon: 'smartphone' },
];

export default function PatientProfileScreen() {
  const user = useAuthStore((state) => state.user);
  const { isDark, themeMode, setThemeMode, colors } = useTheme();
  const locale = useLocale();
  const rtl = isRTL(locale);
  const styles = createStyles(colors);
  const name = user?.name?.trim();
  const email = user?.email?.trim();
  const initials = name
    ? name.split(/\s+/).map((part) => part[0]).join('').substring(0, 2)
    : '';
  const themeLabelKey: Record<ThemeMode, TranslationKey> = {
    light: 'patient.profile.theme.light',
    dark: 'patient.profile.theme.dark',
    system: 'patient.profile.theme.system',
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('patient.profile.title', locale)} />
      <ScrollView contentContainerStyle={[styles.content, { direction: rtl ? 'rtl' : 'ltr' }]}>
        <AppCard variant="elevated" style={styles.userCard}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.secondary }]}>
            {initials ? (
              <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
            ) : (
              <AppIcon name="user" size={28} color={colors.primary} />
            )}
          </View>
          <Text style={[styles.userName, { color: colors.foreground }]}>
            {name || t('patient.profile.nameUnavailable', locale)}
          </Text>
          <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>
            {email || t('patient.profile.emailUnavailable', locale)}
          </Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.roleText, { color: colors.primary }]}>
              {t('patient.profile.role', locale)}
            </Text>
          </View>
        </AppCard>

        <Text style={[styles.sectionHeader, { color: colors.foreground }]}>
          {t('patient.profile.themeSection', locale)}
        </Text>
        <AppCard variant="outlined" style={styles.preferenceCard}>
          <View style={styles.themeRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
              <AppIcon name={isDark ? 'moon' : 'sun'} size={18} color={colors.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>
                {t('patient.profile.displayMode', locale)}
              </Text>
              <Text style={[styles.settingSubtitle, { color: colors.mutedForeground }]}>
                {t(themeLabelKey[themeMode], locale)}
              </Text>
            </View>
          </View>
          <View style={styles.optionsGroup}>
            {themeOptions.map((option) => {
              const selected = themeMode === option.mode;
              return (
                <TouchableOpacity
                  key={option.mode}
                  style={[
                    styles.optionPill,
                    {
                      borderColor: colors.border,
                      backgroundColor: selected ? colors.primary : colors.card,
                    },
                  ]}
                  onPress={() => setThemeMode(option.mode)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={t(option.label, locale)}
                >
                  <AppIcon
                    name={option.icon}
                    size={14}
                    color={selected ? colors.primaryForeground : colors.foreground}
                  />
                  <Text
                    style={[
                      styles.optionText,
                      { color: selected ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {t(option.label, locale)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </AppCard>

        <Text style={[styles.sectionHeader, { color: colors.foreground }]}>
          {t('patient.profile.languageSection', locale)}
        </Text>
        <AppCard variant="outlined" style={styles.optionsGroupCard}>
          <View style={styles.optionsGroup}>
            {SUPPORTED_LOCALES.map((language: SupportedLocale) => {
              const selected = locale === language;
              return (
                <TouchableOpacity
                  key={language}
                  style={[
                    styles.optionPill,
                    {
                      borderColor: colors.border,
                      backgroundColor: selected ? colors.primary : colors.card,
                    },
                  ]}
                  onPress={() => setLocale(language)}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  accessibilityLabel={LOCALE_LABELS[language]}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: selected ? colors.primaryForeground : colors.foreground },
                    ]}
                  >
                    {LOCALE_LABELS[language]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </AppCard>

        <Text style={[styles.sectionHeader, { color: colors.foreground }]}>
          {t('patient.profile.preferencesSection', locale)}
        </Text>
        <AppCard variant="flat" style={[styles.preferenceNotice, { backgroundColor: colors.infoBackground }]}>
          <Text style={[styles.settingSubtitle, { color: colors.foreground }]}>
            {t('patient.profile.preferencesNotice', locale)}
          </Text>
        </AppCard>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={() => logout()}
          accessibilityRole="button"
        >
          <AppIcon name="log-out" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive }]}>
            {t('patient.profile.logout', locale)}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1 },
    content: { padding: spacing.lg, gap: spacing.md },
    userCard: { alignItems: 'center', padding: spacing.lg, gap: spacing.xs },
    avatarCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    avatarText: {
      fontFamily: typography.fontFamily.urbanist,
      fontSize: typography.fontSize['2xl'],
      fontWeight: typography.fontWeight.bold,
    },
    userName: {
      fontFamily: typography.fontFamily.urbanist,
      fontSize: typography.fontSize.xl,
      fontWeight: typography.fontWeight.bold,
      textAlign: 'center',
    },
    userEmail: {
      fontFamily: typography.fontFamily.openSans,
      fontSize: typography.fontSize.sm,
      textAlign: 'center',
    },
    roleBadge: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: shapes.pill,
      marginTop: spacing.xs,
    },
    roleText: {
      fontFamily: typography.fontFamily.openSans,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
    },
    sectionHeader: {
      fontFamily: typography.fontFamily.urbanist,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.bold,
      marginTop: spacing.xs,
    },
    preferenceCard: { padding: spacing.md, gap: spacing.md },
    optionsGroupCard: { padding: spacing.md },
    themeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    optionsGroup: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap' },
    optionPill: {
      flex: 1,
      minHeight: 40,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      borderRadius: shapes.pill,
      borderWidth: 1,
      gap: spacing.xs,
    },
    optionText: {
      fontFamily: typography.fontFamily.openSans,
      fontSize: typography.fontSize.xs,
      fontWeight: typography.fontWeight.semibold,
    },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
    },
    settingTextContainer: { flex: 1 },
    settingTitle: {
      fontFamily: typography.fontFamily.urbanist,
      fontSize: typography.fontSize.sm,
      fontWeight: typography.fontWeight.bold,
    },
    settingSubtitle: {
      fontFamily: typography.fontFamily.openSans,
      fontSize: typography.fontSize.xs,
      lineHeight: 18,
      marginTop: spacing.xxs,
    },
    preferenceNotice: { padding: spacing.md },
    logoutButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      padding: spacing.md,
      borderRadius: shapes.md,
      borderWidth: 1,
      borderColor: colors.destructive + '33',
      backgroundColor: colors.destructive + '0A',
      marginTop: spacing.sm,
    },
    logoutText: {
      fontFamily: typography.fontFamily.openSans,
      fontSize: typography.fontSize.md,
      fontWeight: typography.fontWeight.semibold,
    },
  });
}
