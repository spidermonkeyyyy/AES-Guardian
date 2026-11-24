/**
 * AES Guardian — Prevention Action Register Screen
 *
 * Read-only register access for quality_staff, admin_reviewer, and
 * oh_professional. Only quality_staff receives the create action.
 */

import AppText from '../../../components/AppText';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import {
  CONTRIBUTING_FACTOR_CATEGORIES,
  canManagePreventionActions,
  canViewPreventionActions,
  getDatabase,
  PREVENTION_ACTION_STATUSES,
  PREVENTION_ACTION_TYPES,
  PreventionAction,
  PreventionActionStatus,
  PreventionActionType,
  ContributingFactorCategory,
  useDemoRoleStore,
} from '../../../core';
import {
  t,
  useLocale,
  useLayoutDirection,
  getLayoutRowDirection,
  getLayoutTextAlign,
  type TranslationKey,
} from '../../../localization';
import { RootStackParamList } from '../../../navigation/routes';
import { formatPreventionDate } from '../prevention-date-format';
import {
  aesColors,
  aesRadii,
  aesSpacing,
  aesTypography,
} from '../../../theme/tokens';
import {
  AesButton,
  AesCard,
  AesRoundArrowButton,
  AesScreenContainer,
  AesScreenHeader,
  AesStatusBadge,
} from '../components';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const STATUS_TRANSLATION_KEYS: Record<PreventionActionStatus, TranslationKey> = {
  proposed: 'prevention.detail.status.proposed',
  in_progress: 'prevention.detail.status.in_progress',
  completed: 'prevention.detail.status.completed',
  cancelled: 'prevention.detail.status.cancelled',
};

const FACTOR_TRANSLATION_KEYS: Record<ContributingFactorCategory, TranslationKey> = {
  device_safety_design: 'prevention.factor.device_safety_design',
  procedure_compliance: 'prevention.factor.procedure_compliance',
  workload_fatigue: 'prevention.factor.workload_fatigue',
  waste_disposal_container: 'prevention.factor.waste_disposal_container',
  protective_equipment: 'prevention.factor.protective_equipment',
  training_supervision: 'prevention.factor.training_supervision',
  environment_workspace: 'prevention.factor.environment_workspace',
  other_factor: 'prevention.factor.other_factor',
};

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
  rtl: boolean;
}

const FilterChip: React.FC<FilterChipProps> = ({
  label,
  selected,
  onPress,
  testID,
  rtl,
}) => (
  <Pressable
    accessibilityRole="button"
    accessibilityLabel={label}
    accessibilityState={{ selected }}
    onPress={onPress}
    style={[styles.filterChip, selected && styles.filterChipSelected]}
    testID={testID}
  >
    <AppText style={[styles.filterChipText, selected && styles.filterChipTextSelected, { textAlign: rtl ? 'right' : 'left' }]}>
      {label}
    </AppText>
  </Pressable>
);

export const PreventionActionRegisterScreen: React.FC = () => {
  const navigation = useNavigation<NavProp>();
  const locale = useLocale();
  const layoutDirection = useLayoutDirection();
  const rtl = layoutDirection === 'rtl';
  const rowDirection = getLayoutRowDirection(layoutDirection);
  const textAlign = getLayoutTextAlign(layoutDirection);
  const activeContext = useDemoRoleStore(state => state.activeContext);
  const userId = activeContext.userId;
  const isAuthorized = canViewPreventionActions(activeContext);
  const canManage = canManagePreventionActions(activeContext);
  const requestVersion = useRef(0);

  const [actions, setActions] = useState<PreventionAction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [filterStatus, setFilterStatus] = useState<PreventionActionStatus | undefined>();
  const [filterType, setFilterType] = useState<PreventionActionType | undefined>();
  const [filterFactor, setFilterFactor] = useState<ContributingFactorCategory | undefined>();

  const loadActions = useCallback(async () => {
    const request = ++requestVersion.current;
    if (!isAuthorized || !userId) {
      setActions([]);
      setError(false);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(false);
    try {
      const result = await getDatabase().listPreventionActions(userId, {
        status: filterStatus,
        action_type: filterType,
        contributing_factor: filterFactor,
      });
      if (request === requestVersion.current) {
        setActions(result);
      }
    } catch {
      if (request === requestVersion.current) {
        setError(true);
        setActions([]);
      }
    } finally {
      if (request === requestVersion.current) {
        setLoading(false);
      }
    }
  }, [filterFactor, filterStatus, filterType, isAuthorized, userId]);

  useEffect(() => {
    void loadActions();
    const unsubscribe = navigation.addListener('focus', () => {
      void loadActions();
    });
    return () => {
      unsubscribe();
      requestVersion.current += 1;
    };
  }, [loadActions, navigation]);

  const filterLabel = (label: string, testID: string) => (
    <AppText
      style={[styles.filterLabel, { textAlign }]}
      testID={`${testID}-label`}
    >
      {label}
    </AppText>
  );

  const renderFilterGroup = (
    title: string,
    testID: string,
    chips: React.ReactNode,
  ) => (
    <View
      style={[styles.filterGroup, { flexDirection: rowDirection }]}
      testID={`${testID}-group`}
    >
      {filterLabel(title, testID)}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterScrollContent}
      >
        <View
          style={[styles.filterOptions, { flexDirection: rowDirection }]}
          testID={`${testID}-options`}
        >
          {chips}
        </View>
      </ScrollView>
    </View>
  );

  if (!isAuthorized) {
    return (
      <AesScreenContainer scrollable testID="prevention-register-unauthorized">
        <AesScreenHeader
          title={t('prevention.register.title')}
          subtitle={t('prevention.title')}
          overline={t('prevention.nav.title')}
          testID="prevention-register-header"
        />
        <AesCard
          elevated
          accentBorderColor={aesColors.banners.error.border}
          testID="prevention-register-unauthorized-card"
        >
          <AppText style={[styles.stateText, { textAlign: rtl ? 'right' : 'left' }]}>
            {t('prevention.unauthorized')}
          </AppText>
        </AesCard>
      </AesScreenContainer>
    );
  }

  return (
    <AesScreenContainer
      scrollable
      testID="prevention-register"
      contentContainerStyle={styles.content}
    >
      <AesScreenHeader
        title={t('prevention.register.title')}
        subtitle={t('prevention.title')}
        overline={t('prevention.nav.title')}
        testID="prevention-register-header"
      />

      <AesCard elevated testID="prevention-register-filters">
        {renderFilterGroup(
          t('prevention.register.filterStatus'),
          'prevention-register-filter-status',
          <>
            <FilterChip
              label={t('prevention.register.all')}
              selected={!filterStatus}
              onPress={() => setFilterStatus(undefined)}
              testID="prevention-register-filter-status-all"
              rtl={rtl}
            />
            {PREVENTION_ACTION_STATUSES.map(status => (
              <FilterChip
                key={status}
                label={t(STATUS_TRANSLATION_KEYS[status])}
                selected={filterStatus === status}
                onPress={() => setFilterStatus(filterStatus === status ? undefined : status)}
                testID={`prevention-register-filter-status-${status}`}
                rtl={rtl}
              />
            ))}
          </>,
        )}
        {renderFilterGroup(
          t('prevention.register.filterType'),
          'prevention-register-filter-type',
          <>
            <FilterChip
              label={t('prevention.register.all')}
              selected={!filterType}
              onPress={() => setFilterType(undefined)}
              testID="prevention-register-filter-type-all"
              rtl={rtl}
            />
            {PREVENTION_ACTION_TYPES.map(type => (
              <FilterChip
                key={type}
                label={t(type === 'corrective' ? 'prevention.detail.type.corrective' : 'prevention.detail.type.preventive')}
                selected={filterType === type}
                onPress={() => setFilterType(filterType === type ? undefined : type)}
                testID={`prevention-register-filter-type-${type}`}
                rtl={rtl}
              />
            ))}
          </>,
        )}
        {renderFilterGroup(
          t('prevention.register.filterFactor'),
          'prevention-register-filter-factor',
          <>
            <FilterChip
              label={t('prevention.register.all')}
              selected={!filterFactor}
              onPress={() => setFilterFactor(undefined)}
              testID="prevention-register-filter-factor-all"
              rtl={rtl}
            />
            {CONTRIBUTING_FACTOR_CATEGORIES.map(factor => (
              <FilterChip
                key={factor}
                label={t(FACTOR_TRANSLATION_KEYS[factor])}
                selected={filterFactor === factor}
                onPress={() => setFilterFactor(filterFactor === factor ? undefined : factor)}
                testID={`prevention-register-filter-factor-${factor}`}
                rtl={rtl}
              />
            ))}
          </>,
        )}
      </AesCard>

      {loading && (
        <View style={styles.centeredState} testID="prevention-register-loading">
          <ActivityIndicator size="large" color={aesColors.accentGreen} />
          <AppText style={styles.stateText}>{t('app.loading')}</AppText>
        </View>
      )}

      {!loading && error && (
        <AesCard
          elevated
          accentBorderColor={aesColors.banners.error.border}
          testID="prevention-register-error"
        >
          <AppText style={[styles.stateText, { textAlign: rtl ? 'right' : 'left' }]}>
            {t('error.generic')}
          </AppText>
          <AesButton
            title={t('prevention.register.retry')}
            onPress={() => void loadActions()}
            variant="outline"
            style={styles.retryButton}
            testID="prevention-register-retry"
          />
        </AesCard>
      )}

      {!loading && !error && actions.length === 0 && (
        <AesCard elevated testID="prevention-register-empty">
          <AppText style={[styles.stateText, { textAlign: rtl ? 'right' : 'left' }]}>
            {t('prevention.register.empty')}
          </AppText>
        </AesCard>
      )}

      {!loading && !error && actions.map(action => (
        <AesCard
          key={action.id}
          elevated
          testID={`prevention-register-action-${action.id}`}
        >
          <View style={[styles.actionHeader, { flexDirection: rowDirection }]}>
            <AppText style={[styles.reference, { textAlign: rtl ? 'right' : 'left' }]}>
              {action.reference_code}
            </AppText>
            <AesStatusBadge
              status={action.status}
              domain="capa"
              testID={`prevention-register-status-${action.id}`}
            />
          </View>
          <AppText style={[styles.actionTitle, { textAlign: rtl ? 'right' : 'left' }]}>
            {action.title}
          </AppText>
          <AppText
            numberOfLines={3}
            style={[styles.description, { textAlign: rtl ? 'right' : 'left' }]}
          >
            {action.description}
          </AppText>
          <View style={[styles.actionContext, { flexDirection: rowDirection }]}>
            <AppText
              style={styles.contextText}
              testID={`prevention-register-action-type-${action.id}`}
            >
              {t(action.action_type === 'corrective'
                ? 'prevention.detail.type.corrective'
                : 'prevention.detail.type.preventive')}
            </AppText>
            <AppText
              style={styles.contextText}
              testID={`prevention-register-action-factor-${action.id}`}
            >
              {t(FACTOR_TRANSLATION_KEYS[action.contributing_factor])}
            </AppText>
          </View>
          {formatPreventionDate(action.target_date, locale) ? (
            <AppText
              style={[styles.targetDate, { textAlign: rtl ? 'right' : 'left' }]}
              testID={`prevention-register-action-target-date-${action.id}`}
            >
              {t('prevention.detail.targetDate')}: {formatPreventionDate(action.target_date, locale)}
            </AppText>
          ) : null}
          <View style={[styles.detailAction, { flexDirection: rowDirection }]}>
            <AesRoundArrowButton
              onPress={() => navigation.navigate('preventionActionDetail', { actionId: action.id })}
              variant="green"
              accessibilityLabel={t('prevention.register.viewDetails')}
              testID={`prevention-register-detail-${action.id}`}
            />
          </View>
        </AesCard>
      ))}

      {canManage && (
        <AesButton
          title={t('prevention.overview.newAction')}
          onPress={() => navigation.navigate('preventionCreate')}
          variant="green"
          style={styles.createButton}
          testID="prevention-register-create"
        />
      )}
    </AesScreenContainer>
  );
};

const styles = StyleSheet.create({
  content: {
    paddingBottom: aesSpacing.xl,
  },
  filterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    gap: aesSpacing.xs,
  },
  filterGroupRtl: {
    flexDirection: 'row-reverse',
  },
  filterLabel: {
    ...aesTypography.labelSmall,
    color: aesColors.textSecondary,
    minWidth: 58,
  },
  filterScrollContent: {
    flexGrow: 1,
  },
  filterOptions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterOptionsRtl: {
    flexDirection: 'row-reverse',
  },
  filterChip: {
    minHeight: 48,
    paddingHorizontal: aesSpacing.md,
    borderRadius: aesRadii.pill,
    borderWidth: 1,
    borderColor: aesColors.borderMedium,
    backgroundColor: aesColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: aesSpacing.xs,
  },
  filterChipSelected: {
    borderColor: aesColors.accentGreen,
    backgroundColor: aesColors.accentGreenMuted,
  },
  filterChipText: {
    ...aesTypography.labelSmall,
    color: aesColors.textPrimary,
  },
  filterChipTextSelected: {
    color: aesColors.accentGreen,
  },
  centeredState: {
    minHeight: 112,
    alignItems: 'center',
    justifyContent: 'center',
    gap: aesSpacing.sm,
  },
  stateText: {
    ...aesTypography.body,
    color: aesColors.textSecondary,
  },
  retryButton: {
    marginTop: aesSpacing.sm,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: aesSpacing.sm,
    marginBottom: aesSpacing.xs,
  },
  actionHeaderRtl: {
    flexDirection: 'row-reverse',
  },
  reference: {
    ...aesTypography.labelSmall,
    color: aesColors.textSecondary,
    flexShrink: 1,
  },
  actionTitle: {
    ...aesTypography.heading2,
    color: aesColors.textPrimary,
    marginBottom: aesSpacing.xs,
  },
  description: {
    ...aesTypography.bodySmall,
    color: aesColors.textSecondary,
  },
  actionContext: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: aesSpacing.sm,
    marginTop: aesSpacing.sm,
  },
  actionContextRtl: {
    flexDirection: 'row-reverse',
  },
  contextText: {
    ...aesTypography.labelSmall,
    color: aesColors.textSecondary,
  },
  targetDate: {
    ...aesTypography.labelSmall,
    color: aesColors.textSecondary,
    marginTop: aesSpacing.sm,
  },
  detailAction: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: aesSpacing.sm,
  },
  detailActionRtl: {
    flexDirection: 'row-reverse',
  },
  createButton: {
    marginTop: aesSpacing.md,
  },
});
