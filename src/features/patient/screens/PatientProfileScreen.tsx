import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Feather';
import { spacing, typography, shapes } from '../../../theme/tokens';
import { useTheme, ThemeMode } from '../../../theme/ThemeContext';
import { AppHeader, AppCard } from '../../../components';
import { useAuthStore } from '../../authentication/hooks/use-auth-store';
import { logout } from '../../authentication/hooks/use-auth';

export default function PatientProfileScreen(
{ navigation }: any) {
  const user = useAuthStore((s) => s.user);
  const { isDark, themeMode, setThemeMode, colors } = useTheme();
  const initials = user?.name ? user.name.split(' ').map((n) => n[0]).join('').substring(0, 2) : 'PT';

  const settingsItems = [
    { id: 'notifs', icon: 'bell', title: 'Rappels & Notifications', subtitle: 'Heures de traitement et suivi' },
    { id: 'lang', icon: 'globe', title: 'Langue / Language', subtitle: 'Français' },
    { id: 'privacy', icon: 'shield', title: 'Confidentialité & Données', subtitle: 'Gestion de vos données médicales' },
    { id: 'help', icon: 'help-circle', title: 'Aide & Support', subtitle: 'Assistance Sanad' },
  ];

  const themeOptions: { mode: ThemeMode; label: string; icon: string }[] = [
    { mode: 'light', label: 'Clair', icon: 'sun' },
    { mode: 'dark', label: 'Sombre', icon: 'moon' },
    { mode: 'system', label: 'Système', icon: 'smartphone' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title="Mon Profil" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* User Card */}
        <AppCard variant="elevated" style={styles.userCard}>
          <View style={[styles.avatarCircle, { backgroundColor: colors.secondary }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>{initials}</Text>
          </View>
          <Text style={[styles.userName, { color: colors.foreground }]}>{user?.name || 'Jean Dupont'}</Text>
          <Text style={[styles.userEmail, { color: colors.mutedForeground }]}>{user?.email || 'patient@respiracare.org'}</Text>
          <View style={[styles.roleBadge, { backgroundColor: colors.primary + '18' }]}>
            <Text style={[styles.roleText, { color: colors.primary }]}>Espace Patient Sanad</Text>
          </View>
        </AppCard>

        {/* Theme Preference Selector */}
        <Text style={[styles.sectionHeader, { color: colors.foreground }]}>Thème de l'application</Text>
        <AppCard variant="outlined" style={styles.themeCard}>
          <View style={styles.themeRow}>
            <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
              <Icon name={isDark ? 'moon' : 'sun'} size={18} color={colors.primary} />
            </View>
            <View style={styles.settingTextContainer}>
              <Text style={[styles.settingTitle, { color: colors.foreground }]}>Mode d'affichage</Text>
              <Text style={[styles.settingSubtitle, { color: colors.mutedForeground }]}>
                {themeMode === 'system' ? 'Ajusté au système' : themeMode === 'dark' ? 'Thème Sombre' : 'Thème Clair'}
              </Text>
            </View>
          </View>
          <View style={styles.themeOptionsGroup}>
            {themeOptions.map((opt) => (
              <TouchableOpacity
                key={opt.mode}
                style={[
                  styles.themePill,
                  { borderColor: colors.border, backgroundColor: themeMode === opt.mode ? colors.primary : colors.card },
                ]}
                onPress={() => setThemeMode(opt.mode)}
              >
                <Icon
                  name={opt.icon}
                  size={14}
                  color={themeMode === opt.mode ? colors.primaryForeground : colors.foreground}
                />
                <Text
                  style={[
                    styles.themePillText,
                    { color: themeMode === opt.mode ? colors.primaryForeground : colors.foreground },
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </AppCard>

        {/* Settings List */}
        <Text style={[styles.sectionHeader, { color: colors.foreground }]}>Paramètres & Préférences</Text>
        <AppCard variant="outlined" style={styles.settingsCard}>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              style={[
                styles.settingRow,
                index < settingsItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
              onPress={() => Alert.alert(item.title, 'Fonctionnalité disponible très prochainement.')}
            >
              <View style={[styles.iconCircle, { backgroundColor: colors.secondary }]}>
                <Icon name={item.icon} size={18} color={colors.primary} />
              </View>
              <View style={styles.settingTextContainer}>
                <Text style={[styles.settingTitle, { color: colors.foreground }]}>{item.title}</Text>
                <Text style={[styles.settingSubtitle, { color: colors.mutedForeground }]}>{item.subtitle}</Text>
              </View>
              <Icon name="chevron-right" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </AppCard>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={() => logout()}>
          <Icon name="log-out" size={18} color="colors.destructive" />
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, { color: colors.mutedForeground }]}>Sanad RespiraCare v1.0.0 (Build 76)</Text>
      </ScrollView>
    </View>
  );
}

function createStyles(colors: any) {
  return {
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
  },
  userEmail: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
  },
  roleBadge: {
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
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
  themeCard: { padding: spacing.md, gap: spacing.md },
  themeRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  themeOptionsGroup: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.xs },
  themePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    borderRadius: shapes.pill,
    borderWidth: 1,
    gap: spacing.xs,
  },
  themePillText: {
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  settingsCard: { padding: 0, overflow: 'hidden' },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
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
    marginTop: 2,
  },
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
    color: colors.destructive,
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  versionText: {
    textAlign: 'center',
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.xs,
    marginVertical: spacing.sm,
  },
}
}
