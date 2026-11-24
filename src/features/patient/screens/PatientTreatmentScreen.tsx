import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AppIcon } from '../../../components/AppIcon';
import { AppButton, AppCard, AppHeader } from '../../../components';
import { useLocale, t } from '../../../localization';
import { spacing, typography } from '../../../theme/tokens';
import { useTheme } from '../../../theme/ThemeContext';

export default function PatientTreatmentScreen({ navigation }: any) {
  const { colors } = useTheme();
  const locale = useLocale();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AppHeader title={t('patient.treatment.title', locale)} />
      <ScrollView contentContainerStyle={styles.content}>
        <AppCard
          variant="flat"
          style={[styles.notice, { backgroundColor: colors.infoBackground }]}
        >
          <View style={styles.noticeHeader}>
            <AppIcon name="info" size={20} color={colors.info} />
            <Text style={[styles.noticeText, { color: colors.foreground }]}>
              {t('patient.treatment.demoNotice', locale)}
            </Text>
          </View>
          <AppButton
            title={t('patient.treatment.messagesAction', locale)}
            onPress={() => navigation.navigate('messages')}
            variant="primary"
            style={styles.action}
          />
        </AppCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: spacing.screenPadding,
  },
  notice: {
    padding: spacing.cardPadding,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  noticeText: {
    flex: 1,
    fontFamily: typography.fontFamily.openSans,
    fontSize: typography.fontSize.sm,
    lineHeight: 22,
  },
  action: {
    marginTop: spacing.md,
  },
});
