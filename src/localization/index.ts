/**
 * AES Guardian Localization
 *
 * Full localization for Phase 2C.2 declaration workflow.
 * Languages: French (fr — default), English (en), Arabic (ar — RTL).
 *
 * RTL Note: Arabic requires I18nManager.forceRTL(true) + app restart.
 * RTL layout is handled via StyleSheet properties, not text alignment only.
 *
 * REQUIRES_VALIDATION: Clinical/legal terminology translations should be
 * reviewed by a qualified professional before production use.
 */

import { useState, useEffect } from 'react';

export type SupportedLocale = 'fr' | 'en' | 'ar';
export const SUPPORTED_LOCALES: SupportedLocale[] = ['fr', 'en', 'ar'];
export const DEFAULT_LOCALE: SupportedLocale = 'fr';

export function isRTL(locale: SupportedLocale): boolean {
  return locale === 'ar';
}

export const LOCALE_STORAGE_KEY = '@sanad/locale';

export type LayoutDirection = 'ltr' | 'rtl';

export function resolveLayoutDirection(locale: unknown): LayoutDirection {
  return locale === 'ar' ? 'rtl' : 'ltr';
}

export function getLayoutRowDirection(direction: LayoutDirection): 'row' | 'row-reverse' {
  return direction === 'rtl' ? 'row-reverse' : 'row';
}

export function getLayoutTextAlign(direction: LayoutDirection): 'left' | 'right' {
  return direction === 'rtl' ? 'right' : 'left';
}

export function getLayoutForwardChevron(direction: LayoutDirection): '›' | '‹' {
  return direction === 'rtl' ? '‹' : '›';
}

export function getLayoutForwardArrow(direction: LayoutDirection): '→' | '←' {
  return direction === 'rtl' ? '←' : '→';
}

export function getLayoutBackArrow(direction: LayoutDirection): '←' | '→' {
  return direction === 'rtl' ? '→' : '←';
}

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
};

// ─── Translation keys ─────────────────────────────────────────────────────────

export type TranslationKey =
  // Extra keys for pre-existing destination screens
  | 'navigation.back'
  | 'workspace.nav.title'
  | 'prevention.create.acknowledgement.confirm'
  | 'prevention.create.acknowledgement.inProgress'
  | 'prevention.create.acknowledgement.error'
  | 'prevention.create.result.title'
  | 'prevention.create.result.recovery'
  | 'prevention.create.uncertain'
  | 'prevention.create.reconcileAbsent'
  | 'prevention.create.reference'
  | 'prevention.create.reconcile'
  | 'surveillance.filters.declarationCountLabel'
  | 'surveillance.status.empty'
  // App
  | 'app.name'
  | 'app.loading'
  | 'app.back'
  | 'app.ok'
  | 'app.offline'
  | 'db.initializing'
  | 'db.ready'
  | 'db.error'
  // Navigation / sections
  | 'nav.declarations'
  | 'nav.newDeclaration'
  | 'nav.declarationDetails'
  | 'nav.back'
  // Declaration list
  | 'list.title'
  | 'list.empty'
  | 'list.emptySubtitle'
  | 'list.newButton'
  | 'list.refNumber'
  | 'list.refUnavailable'
  | 'list.incidentDate'
  | 'list.status'
  // Declaration form
  | 'form.title.new'
  | 'form.title.edit'
  | 'form.unauthorized'
  | 'form.incidentDate'
  | 'form.incidentDate.placeholder'
  | 'form.incidentType'
  | 'form.incidentType.placeholder'
  | 'form.incidentType.percutaneous'
  | 'form.incidentType.percutaneous.desc'
  | 'form.incidentType.mucocutaneous'
  | 'form.incidentType.mucocutaneous.desc'
  | 'form.incidentType.sexual_assault'
  | 'form.incidentType.sexual_assault.desc'
  | 'form.incidentType.other'
  | 'form.incidentType.other.desc'
  | 'form.circumstances'
  | 'form.circumstances.placeholder'
  | 'form.exposureDescription'
  | 'form.exposureDescription.placeholder'
  | 'form.protectiveMeasures'
  | 'form.protectiveMeasures.placeholder'
  | 'form.departmentCode'
  | 'form.departmentCode.placeholder'
  | 'form.notes'
  | 'form.notes.placeholder'
  | 'form.required'
  | 'form.optional'
  | 'form.saveDraft'
  | 'form.submit'
  | 'form.saving'
  | 'form.submitting'
  | 'form.savedDraft'
  | 'form.disclaimer'
  // Form Wizard Steps (Batch 3)
  | 'form.step.counter'
  | 'form.step1.title'
  | 'form.step1.subtitle'
  | 'form.step2.title'
  | 'form.step2.subtitle'
  | 'form.step3.title'
  | 'form.step3.subtitle'
  | 'form.step4.title'
  | 'form.step4.subtitle'
  | 'form.step4.advisory'
  | 'form.step5.title'
  | 'form.step5.subtitle'
  | 'form.step.next'
  | 'form.step.prev'
  | 'form.autoSaved'
  | 'form.autoSaveFailed'
  | 'form.saveDraftError'
  | 'form.summary.title'
  | 'form.departmentCode.notSpecified'
  | 'form.attestation.label'
  | 'form.attestation.subtitle'
  | 'form.attestation.required'
  // Validation
  | 'validation.required'
  | 'validation.incidentDateRequired'
  | 'validation.incidentTypeRequired'
  | 'validation.incidentDateInvalid'
  // Status labels
  | 'status.draft'
  | 'status.submitted'
  | 'status.under_review'
  | 'status.correction_requested'
  | 'status.resubmitted'
  | 'status.closed'
  // Declaration details
  | 'details.title'
  | 'details.refNumber'
  | 'details.status'
  | 'details.incidentDate'
  | 'details.incidentType'
  | 'details.circumstances'
  | 'details.exposureDescription'
  | 'details.protectiveMeasures'
  | 'details.departmentCode'
  | 'details.notes'
  | 'details.createdAt'
  | 'details.submittedAt'
  | 'details.editDraft'
  | 'details.submitDeclaration'
  | 'details.notSet'
  | 'details.readOnly'
  // Submission confirmation
  | 'confirm.title'
  | 'confirm.subtitle'
  | 'confirm.refNumber'
  | 'confirm.message'
  | 'confirm.disclaimer'
  | 'confirm.backToList'
  // Errors
  | 'error.generic'
  | 'error.saveFailed'
  | 'error.submitFailed'
  | 'error.loadFailed'
  // Role labels
  | 'role.exposed_professional'
  | 'role.admin_reviewer'
  | 'role.oh_professional'
  | 'role.quality_staff'
  | 'role.tech_admin'
  // Phase 2C.3: Review queue & actions
  | 'nav.reviewQueue'
  | 'reviewQueue.title'
  | 'reviewQueue.empty'
  | 'reviewQueue.emptySubtitle'
  | 'reviewQueue.filterAll'
  | 'reviewQueue.filterSubmitted'
  | 'reviewQueue.filterUnderReview'
  | 'reviewQueue.reviewerBadge'
  | 'reviewQueue.submittedAt'
  | 'reviewQueue.declaredBy'
  | 'reviewQueue.openReview'
  | 'reviewQueue.refresh'
  | 'review.title'
  | 'review.declarationRef'
  | 'review.selectOutcome'
  | 'review.outcome.acknowledged'
  | 'review.outcome.acknowledgedDesc'
  | 'review.outcome.transmission_verified'
  | 'review.outcome.transmission_verifiedDesc'
  | 'review.outcome.correction_requested'
  | 'review.outcome.correction_requestedDesc'
  | 'review.comments'
  | 'review.commentsPlaceholder'
  | 'review.correctionReason'
  | 'review.correctionReasonPlaceholder'
  | 'review.submitButton'
  | 'review.submitting'
  | 'review.success'
  | 'review.confirmTitle'
  | 'review.confirmMessage'
  | 'review.confirmButton'
  | 'review.cancelButton'
  | 'review.historyTitle'
  | 'review.noHistory'
  | 'review.unauthorized'
  | 'review.notReviewable'
  | 'review.correctionReasonRequired'
  | 'review.readOnlyNotice'
  // Phase 2C.3.1: Correction Response Workflow
  | 'reviewQueue.filterCorrectionRequested'
  | 'reviewQueue.filterResubmitted'
  | 'details.pendingCorrectionTitle'
  | 'details.pendingCorrectionAction'
  | 'correction.screenTitle'
  | 'correction.requestHeader'
  | 'correction.reasonLabel'
  | 'correction.commentsLabel'
  | 'correction.demoContext'
  | 'correction.inputLabel'
  | 'correction.inputPlaceholder'
  | 'correction.characterCount'
  | 'correction.submitButton'
  | 'correction.submitting'
  | 'correction.confirmTitle'
  | 'correction.confirmMessage'
  | 'correction.successTitle'
  | 'correction.successMessage'
  | 'correction.unauthorized'
  | 'correction.errorRequired'
  | 'review.declarantResponseHeader'
  | 'review.rereviewButton'
  | 'reviewAction.declarationSummaryTitle'
  | 'reviewAction.outcome.approvedEffect'
  | 'reviewAction.outcome.correctionEffect'
  | 'reviewAction.correctionReasonLabel'
  | 'reviewAction.commentsLabel'
  | 'reviewAction.unauthorizedNotice'
  // Phase 2C.4: Occupational-health coordination
  | 'oh.nav.queue'
  | 'oh.nav.detail'
  | 'oh.nav.create'
  | 'oh.queue.title'
  | 'oh.queue.empty'
  | 'oh.queue.emptySubtitle'
  | 'oh.queue.reviewerBadge'
  | 'oh.queue.reason'
  | 'oh.queue.openDetail'
  | 'oh.queue.refresh'
  | 'oh.create.title'
  | 'oh.create.reason'
  | 'oh.create.disclaimer'
  | 'oh.create.confirm'
  | 'oh.create.confirmMessage'
  | 'oh.create.button'
  | 'oh.create.submitting'
  | 'oh.create.success'
  | 'oh.detail.title'
  | 'oh.detail.noReference'
  | 'oh.detail.status'
  | 'oh.detail.acknowledge'
  | 'oh.detail.complete'
  | 'oh.detail.completeConfirm'
  | 'oh.detail.completeConfirmMessage'
  | 'oh.detail.events'
  | 'oh.detail.noEvents'
  | 'oh.detail.addEvent'
  | 'oh.detail.coordinator'
  | 'oh.detail.declRef'
  | 'oh.detail.reason'
  | 'oh.detail.acknowledgedBy'
  | 'oh.detail.completedBy'
  | 'oh.detail.disclaimer'
  | 'oh.event.title'
  | 'oh.event.category'
  | 'oh.event.date'
  | 'oh.event.datePlaceholder'
  | 'oh.event.note'
  | 'oh.event.notePlaceholder'
  | 'oh.event.submit'
  | 'oh.event.submitting'
  | 'oh.status.pending_acknowledgement'
  | 'oh.status.acknowledged'
  | 'oh.status.completed'
  | 'oh.status.cancelled'
  | 'oh.reason.routine_followup'
  | 'oh.reason.serology_monitoring'
  | 'oh.reason.specialized_evaluation'
  | 'oh.reason.other_coordination'
  | 'oh.event.contact_attempt_recorded'
  | 'oh.event.contact_established'
  | 'oh.event.appointment_coordinated'
  | 'oh.event.consultation_recorded'
  | 'oh.event.follow_up_continued'
  | 'oh.event.follow_up_completed'
  | 'oh.disclaimer.clinical'
  | 'oh.error.unauthorized'
  | 'oh.error.alreadyActive'
  | 'oh.error.noDeclaration'
  | 'oh.decl.coordinationStatus'
  | 'oh.decl.noActiveCoordination'
  | 'oh.decl.createCoordination'
  // Phase 2E.1.6.1: OH Coordination UI Transformation
  | 'oh.queue.tabPending'
  | 'oh.queue.tabAcknowledged'
  | 'oh.queue.tabCompleted'
  | 'oh.queue.emptyPending'
  | 'oh.queue.emptyAcknowledged'
  | 'oh.queue.emptyCompleted'
  | 'oh.queue.totalRecords'
  | 'oh.detail.acknowledgedStatus'
  | 'oh.detail.completedStatus'
  | 'oh.detail.createdAt'
  | 'oh.detail.updatedAt'
  | 'oh.detail.exposedNotice'
  | 'oh.detail.adminNotice'
  | 'oh.detail.timelineTitle'
  | 'oh.detail.unauthorizedMessage'
  | 'oh.event.dateInvalid'
  | 'oh.event.charCount'
  | 'oh.event.noteDescription'
  | 'oh.create.reasonHelp'
  | 'oh.create.disclaimerDetail'
  // Phase 2C.5: Surveillance Dashboard
  | 'surveillance.nav.title'
  | 'surveillance.title'
  | 'surveillance.disclaimer'
  | 'surveillance.unauthorized'
  | 'surveillance.roleBadge'
  | 'surveillance.filters.title'
  | 'surveillance.filters.all'
  | 'surveillance.filters.status'
  | 'surveillance.filters.exposure'
  | 'surveillance.filters.startDate'
  | 'surveillance.filters.endDate'
  | 'surveillance.filters.clear'
  | 'surveillance.overview.title'
  | 'surveillance.overview.total'
  | 'surveillance.overview.draft'
  | 'surveillance.overview.submitted'
  | 'surveillance.overview.underReview'
  | 'surveillance.overview.correctionRequested'
  | 'surveillance.overview.resubmitted'
  | 'surveillance.overview.closed'
  | 'surveillance.overview.activeOh'
  | 'surveillance.overview.completedOh'
  | 'surveillance.temporal.title'
  | 'surveillance.temporal.empty'
  | 'surveillance.exposure.title'
  | 'surveillance.exposure.empty'
  | 'surveillance.status.title'
  | 'surveillance.admin.title'
  | 'surveillance.admin.totalReviews'
  | 'surveillance.admin.correctionRequests'
  | 'surveillance.admin.correctionResponses'
  | 'surveillance.admin.outcomes'
  | 'surveillance.oh.title'
  | 'surveillance.oh.status'
  | 'surveillance.oh.events'
  // Phase 2C.6: Prevention & Corrective-Action Management
  | 'prevention.nav.title'
  | 'prevention.title'
  | 'prevention.disclaimer'
  | 'prevention.provisional.disclaimer'
  | 'prevention.unauthorized'
  | 'prevention.overview.title'
  | 'prevention.overview.total'
  | 'prevention.overview.proposed'
  | 'prevention.overview.in_progress'
  | 'prevention.overview.completed'
  | 'prevention.overview.cancelled'
  | 'prevention.overview.viewRegister'
  | 'prevention.overview.newAction'
  | 'prevention.register.title'
  | 'prevention.register.empty'
  | 'prevention.register.filterStatus'
  | 'prevention.register.filterType'
  | 'prevention.register.filterFactor'
  | 'prevention.register.clearFilters'
  | 'prevention.register.all'
  | 'prevention.register.retry'
  | 'prevention.register.viewDetails'
  | 'prevention.create.title'
  | 'prevention.create.subtitle'
  | 'prevention.create.actionTitle'
  | 'prevention.create.description'
  | 'prevention.create.action_type'
  | 'prevention.create.corrective'
  | 'prevention.create.preventive'
  | 'prevention.create.factor.label'
  | 'prevention.create.factor.none'
  | 'prevention.create.factor.disclaimer'
  | 'prevention.create.rationale'
  | 'prevention.create.target_date'
  | 'prevention.create.surveillance_reference'
  | 'prevention.create.submit'
  | 'prevention.create.submitting'
  | 'prevention.create.success'
  | 'prevention.create.retry'
  | 'prevention.create.error'
  | 'prevention.create.denied'
  | 'prevention.create.validation.title'
  | 'prevention.create.validation.description'
  | 'prevention.create.validation.rationale'
  | 'prevention.create.validation.targetDate'
  | 'prevention.create.validation.surveillanceReference'
  | 'prevention.create.placeholder.title'
  | 'prevention.create.placeholder.description'
  | 'prevention.create.placeholder.rationale'
  | 'prevention.create.placeholder.surveillanceReference'
  | 'prevention.detail.title'
  | 'prevention.detail.subtitle'
  | 'prevention.detail.notFound'
  | 'prevention.detail.loadError'
  | 'prevention.detail.retry'
  | 'prevention.detail.actionInformation'
  | 'prevention.detail.recordInformation'
  | 'prevention.detail.lifecycleActions'
  | 'prevention.detail.referenceCode'
  | 'prevention.detail.status.proposed'
  | 'prevention.detail.status.in_progress'
  | 'prevention.detail.status.completed'
  | 'prevention.detail.status.cancelled'
  | 'prevention.detail.type.corrective'
  | 'prevention.detail.type.preventive'
  | 'prevention.detail.factor'
  | 'prevention.detail.rationale'
  | 'prevention.detail.targetDate'
  | 'prevention.detail.completedAt'
  | 'prevention.detail.completionNotes'
  | 'prevention.detail.start_action'
  | 'prevention.detail.complete_action'
  | 'prevention.detail.cancel_action'
  | 'prevention.detail.completion_note_prompt'
  | 'prevention.detail.completionNoteLabel'
  | 'prevention.detail.cancelNoteLabel'
  | 'prevention.detail.cancelConfirmation'
  | 'prevention.detail.confirmCancellation'
  | 'prevention.detail.keepAction'
  | 'prevention.detail.transitionError'
  | 'prevention.detail.refreshRetry'
  | 'prevention.detail.validation.completionNote'
  | 'prevention.detail.auditEmpty'
  | 'prevention.detail.audit_history'
  | 'prevention.detail.createdAt'
  | 'prevention.detail.updatedAt'
  | 'prevention.factor.device_safety_design'
  | 'prevention.factor.procedure_compliance'
  | 'prevention.factor.workload_fatigue'
  | 'prevention.factor.waste_disposal_container'
  | 'prevention.factor.protective_equipment'
  | 'prevention.factor.training_supervision'
  | 'prevention.factor.environment_workspace'
  | 'prevention.factor.other_factor'
  | 'prevention.factor.none'
  // Phase 2C.7: Unified Demonstration Workspace & End-to-End Workflow Integration
  | 'workspace.tagline'
  | 'workspace.disclaimerTitle'
  | 'workspace.disclaimerText'
  | 'workspace.roleSelectorTitle'
  | 'workspace.roleSelectorSubtitle'
  | 'workspace.roleDesc.exposed'
  | 'workspace.roleDesc.admin'
  | 'workspace.roleDesc.oh'
  | 'workspace.roleDesc.quality'
  | 'workspace.roleDesc.tech'
  | 'workspace.correctionActionRequired'
  | 'workspace.correctionActionDesc'
  | 'workspace.permittedModulesTitle'
  | 'workspace.module.newDeclaration'
  | 'workspace.module.newDeclarationDesc'
  | 'workspace.module.myDeclarations'
  | 'workspace.module.myDeclarationsDesc'
  | 'workspace.module.adminQueue'
  | 'workspace.module.adminQueueDesc'
  | 'workspace.module.allDeclarations'
  | 'workspace.module.allDeclarationsDesc'
  | 'workspace.module.ohQueue'
  | 'workspace.module.ohQueueDesc'
  | 'workspace.module.surveillanceDashboard'
  | 'workspace.module.surveillanceDashboardDesc'
  | 'workspace.module.preventionOverview'
  | 'workspace.module.preventionOverviewDesc'
  | 'workspace.module.preventionRegister'
  | 'workspace.module.preventionRegisterDesc'
  | 'workspace.module.preventionRegisterReadOnly'
  | 'workspace.module.preventionRegisterReadOnlyDesc'
  | 'workspace.module.preventionCreate'
  | 'workspace.module.preventionCreateDesc'
  | 'workspace.notice.exposedRestrictions'
  | 'workspace.notice.qualityRestrictions'
  | 'workspace.notice.techRestrictions'
  | 'workspace.tech.sqliteIntegrity'
  | 'workspace.tech.engine'
  | 'workspace.tech.schemaVersion'
  | 'workspace.tech.fkCheck'
  | 'workspace.tech.fkOk'
  | 'workspace.badgePending'
  | 'workspace.badgeActive'
  | 'workspace.badgeIncidents'
  | 'workspace.badgeActions'
  | 'workspace.scenarioTitle'
  | 'workspace.scenarioSubtitle'
  | 'workspace.step1.title'
  | 'workspace.step1.desc'
  | 'workspace.step2.title'
  | 'workspace.step2.desc'
  | 'workspace.step3.title'
  | 'workspace.step3.desc'
  | 'workspace.step4.title'
  | 'workspace.step4.desc'
  | 'workspace.step5.title'
  | 'workspace.step5.desc'
  | 'workspace.step6.title'
  | 'workspace.step6.desc'
  | 'workspace.switchRole'
  | 'workspace.activeRoleIndicator'

  // ─── Phase 2D.1: Help Centre & Glossary ───
  | 'helpGlossary.title'
  | 'helpGlossary.subtitle'
  | 'helpGlossary.tabHelp'
  | 'helpGlossary.tabGlossary'
  | 'helpGlossary.disclaimer'
  | 'helpGlossary.searchPlaceholder'
  | 'helpGlossary.clearSearch'
  | 'helpGlossary.categoryAll'
  | 'helpGlossary.categoryExposure'
  | 'helpGlossary.categoryDeclaration'
  | 'helpGlossary.categoryAdmin'
  | 'helpGlossary.categoryOH'
  | 'helpGlossary.categoryQuality'
  | 'helpGlossary.emptySearch'
  | 'helpGlossary.backToWorkspace'

  // Help Sections (1 to 8)
  | 'help.section1.title'
  | 'help.section1.content'
  | 'help.section2.title'
  | 'help.section2.content'
  | 'help.section3.title'
  | 'help.section3.content'
  | 'help.section4.title'
  | 'help.section4.content'
  | 'help.section5.title'
  | 'help.section5.content'
  | 'help.section6.title'
  | 'help.section6.content'
  | 'help.section7.title'
  | 'help.section7.content'
  | 'help.section8.title'
  | 'help.section8.content'

  // Glossary Terms (1 to 14)
  | 'glossary.term1.term'
  | 'glossary.term1.category'
  | 'glossary.term1.definition'
  | 'glossary.term2.term'
  | 'glossary.term2.category'
  | 'glossary.term2.definition'
  | 'glossary.term3.term'
  | 'glossary.term3.category'
  | 'glossary.term3.definition'
  | 'glossary.term4.term'
  | 'glossary.term4.category'
  | 'glossary.term4.definition'
  | 'glossary.term5.term'
  | 'glossary.term5.category'
  | 'glossary.term5.definition'
  | 'glossary.term6.term'
  | 'glossary.term6.category'
  | 'glossary.term6.definition'
  | 'glossary.term7.term'
  | 'glossary.term7.category'
  | 'glossary.term7.definition'
  | 'glossary.term8.term'
  | 'glossary.term8.category'
  | 'glossary.term8.definition'
  | 'glossary.term9.term'
  | 'glossary.term9.category'
  | 'glossary.term9.definition'
  | 'glossary.term10.term'
  | 'glossary.term10.category'
  | 'glossary.term10.definition'
  | 'glossary.term11.term'
  | 'glossary.term11.category'
  | 'glossary.term11.definition'
  | 'glossary.term12.term'
  | 'glossary.term12.category'
  | 'glossary.term12.definition'
  | 'glossary.term13.term'
  | 'glossary.term13.category'
  | 'glossary.term13.definition'
  | 'glossary.term14.term'
  | 'glossary.term14.category'
  | 'glossary.term14.definition'

  // ─── Phase 2D.1: Demonstrator Profile & Settings ───
  | 'profile.title'
  | 'profile.subtitle'
  | 'profile.accountSection'
  | 'profile.roleSection'
  | 'profile.permissionsSection'
  | 'profile.authorizedCapabilities'
  | 'profile.restrictedCapabilities'
  | 'profile.demoAccountNotice'
  | 'profile.languageSection'
  | 'profile.languageSelectorTitle'
  | 'profile.rtlNotice'
  | 'profile.navigationSection'
  | 'profile.helpCenterLink'
  | 'profile.glossaryLink'
  | 'profile.guidedTourLink'
  | 'profile.privacySection'
  | 'profile.privacyContent'
  | 'profile.aboutSection'
  | 'profile.appNameLabel'
  | 'profile.dbEngineLabel'
  | 'profile.maintenanceSection'
  | 'profile.error.techAdminOnly'
  | 'profile.error.userIdMissing'

  // Role capability items for profile
  | 'profile.cap.declare'
  | 'profile.cap.myDeclarations'
  | 'profile.cap.respondCorrection'
  | 'profile.cap.adminReview'
  | 'profile.cap.initiateOH'
  | 'profile.cap.ohCoordination'
  | 'profile.cap.ohFollowUp'
  | 'profile.cap.surveillanceDashboard'
  | 'profile.cap.preventionRegister'
  | 'profile.cap.manageCapa'
  | 'profile.cap.techMaintenance'
  | 'profile.restr.noSurveillance'
  | 'profile.restr.noCapa'
  | 'profile.restr.noOtherDeclarations'
  | 'profile.restr.noClinicalContent'
  | 'profile.restr.noAdminQueue'
  | 'profile.restr.noIdentifiableData'

  // ─── Phase 2D.1: Secure Data Reset ───
  | 'reset.sectionTitle'
  | 'reset.sectionDesc'
  | 'reset.buttonLabel'
  | 'reset.dialog1Title'
  | 'reset.dialog1Message'
  | 'reset.dialog1Cancel'
  | 'reset.dialog1Continue'
  | 'reset.dialog2Title'
  | 'reset.dialog2Message'
  | 'reset.dialog2Cancel'
  | 'reset.dialog2Confirm'
  | 'reset.inProgress'
  | 'reset.successTitle'
  | 'reset.successMessage'
  | 'reset.errorTitle'
  | 'reset.errorMessage'

  // ─── Phase 2D.2: In-App Notifications (11 Canonical Events) ───
  // 1. declaration_submitted
  | 'notification.declarationSubmitted.title'
  | 'notification.declarationSubmitted.message'
  // 2. review_completed
  | 'notification.reviewCompleted.title'
  | 'notification.reviewCompleted.message'
  // 3. correction_requested
  | 'notification.correctionRequested.title'
  | 'notification.correctionRequested.message'
  // 4. correction_submitted
  | 'notification.correctionSubmitted.title'
  | 'notification.correctionSubmitted.message'
  // 5. oh_coordination_created
  | 'notification.ohCoordinationCreated.title'
  | 'notification.ohCoordinationCreated.message'
  // 6. oh_coordination_acknowledged
  | 'notification.ohCoordinationAcknowledged.title'
  | 'notification.ohCoordinationAcknowledged.message'
  // 7. oh_milestone_recorded
  | 'notification.ohMilestoneRecorded.title'
  | 'notification.ohMilestoneRecorded.message'
  // 8. oh_coordination_completed
  | 'notification.ohCoordinationCompleted.title'
  | 'notification.ohCoordinationCompleted.message'
  // 9. capa_created
  | 'notification.capaCreated.title'
  | 'notification.capaCreated.message'
  // 10. capa_status_changed
  | 'notification.capaStatusChanged.title'
  | 'notification.capaStatusChanged.message'
  // 11. capa_finalized
  | 'notification.capaFinalized.title'
  | 'notification.capaFinalized.message'

  // ─── Phase 2D.2G: Notification Centre UI ───
  | 'notificationCentre.title'
  | 'notificationCentre.empty'
  | 'notificationCentre.emptySubtitle'
  | 'notificationCentre.markAllRead'
  | 'notificationCentre.markAllReadConfirm'
  | 'notificationCentre.confirm'
  | 'notificationCentre.cancel'
  | 'notificationCentre.retry'
  | 'notificationCentre.unread'
  | 'notificationCentre.read'
  | 'notificationCentre.today'
  | 'notificationCentre.yesterday'
  | 'notificationCentre.tapToOpen'
  | 'notificationCentre.errorLoad'
  | 'notificationCentre.errorNavigation'
  | 'notificationCentre.errorStale'
  | 'notificationCentre.techAdminRestricted'
  | 'notificationCentre.a11y.unreadBadge'
  | 'notificationCentre.a11y.notificationItem'
  | 'notificationCentre.a11y.markAllRead'

  // ─── Phase 2E.1.2: Batch 2 Onboarding & Synthetic Demo Entry ───
  | 'splash.wordmark'
  | 'splash.subtitle'
  | 'splash.enter'
  | 'onboarding.lang.overline'
  | 'onboarding.lang.title'
  | 'onboarding.lang.subtitle'
  | 'onboarding.continue'
  | 'onboarding.carousel.skip'
  | 'onboarding.carousel.start'
  | 'onboarding.carousel.next'
  | 'onboarding.carousel.slide1.title'
  | 'onboarding.carousel.slide1.desc'
  | 'onboarding.carousel.slide1.bullet1'
  | 'onboarding.carousel.slide1.bullet2'
  | 'onboarding.carousel.slide1.bullet3'
  | 'onboarding.carousel.slide2.title'
  | 'onboarding.carousel.slide2.desc'
  | 'onboarding.carousel.slide2.bullet1'
  | 'onboarding.carousel.slide2.bullet2'
  | 'onboarding.carousel.slide2.bullet3'
  | 'onboarding.carousel.slide3.title'
  | 'onboarding.carousel.slide3.desc'
  | 'onboarding.carousel.slide3.bullet1'
  | 'onboarding.carousel.slide3.bullet2'
  | 'onboarding.carousel.slide3.bullet3'
  | 'onboarding.disclaimer.title'
  | 'onboarding.disclaimer.badge'
  | 'onboarding.disclaimer.p1'
  | 'onboarding.disclaimer.p2'
  | 'onboarding.disclaimer.p3'
  | 'onboarding.disclaimer.p4'
  | 'onboarding.disclaimer.checkbox'
  | 'onboarding.disclaimer.accept'
  | 'onboarding.picker.title'
  | 'onboarding.picker.subtitle'
  | 'onboarding.picker.syntheticNotice'
  | 'onboarding.picker.enter'
  | 'onboarding.picker.role1.code'
  | 'onboarding.picker.role1.title'
  | 'onboarding.picker.role1.desc'
  | 'onboarding.picker.role2.code'
  | 'onboarding.picker.role2.title'
  | 'onboarding.picker.role2.desc'
  | 'onboarding.picker.role3.code'
  | 'onboarding.picker.role3.title'
  | 'onboarding.picker.role3.desc'
  | 'onboarding.picker.role4.code'
  | 'onboarding.picker.role4.title'
  | 'onboarding.picker.role4.desc'
  | 'onboarding.picker.role5.code'
  | 'onboarding.picker.role5.title'
  | 'onboarding.picker.role5.desc'

  // ─── Phase 2E.1.4.3: Batch 4 Declaration List & Details ───
  | 'list.filter.all'
  | 'list.filter.draft'
  | 'list.filter.submitted'
  | 'list.filter.under_review'
  | 'list.filter.closed'
  | 'list.adminQueueShortcut'
  | 'list.restrictedTitle'
  | 'list.restrictedMessage'
  | 'list.incidentType'
  | 'list.title.admin'
  | 'details.tab.summary'
  | 'details.tab.incident'
  | 'details.tab.measures'
  | 'details.tab.status'
  | 'details.tab.followup'
  | 'details.followup.noCoordination'
  | 'details.followup.coordinationStatus'
  | 'details.followup.coordinationDate'
  | 'details.followup.updatedAt'
  | 'details.followup.adminSummary'
  | 'details.followup.reason'
  | 'details.followup.acknowledgedAt'
  | 'details.followup.completedAt'
  | 'details.restrictedAccess'
  | 'details.notFound'
  | 'details.reviewHistory'
  | 'details.reviewAction'
  | 'details.createCoordination'
  | 'details.respondToCorrection'
  | 'details.correctionPending';

// ─── Translations ─────────────────────────────────────────────────────────────

type TranslationMap = Record<TranslationKey, string>;

const fr: TranslationMap = {
  // Extra keys
  'navigation.back': 'Retour',
  'workspace.nav.title': 'Espace AES Guardian',
  'prevention.create.acknowledgement.confirm': 'Confirmer la présentation',
  'prevention.create.acknowledgement.inProgress': 'Confirmation en cours...',
  'prevention.create.acknowledgement.error': 'Erreur lors de la confirmation',
  'prevention.create.result.title': 'Action de prévention créée',
  'prevention.create.result.recovery': 'Récupération de l\'action créée',
  'prevention.create.uncertain': 'Création incertaine - statut en attente',
  'prevention.create.reconcileAbsent': 'Action non trouvée lors de la réconciliation',
  'prevention.create.reference': 'Référence',
  'prevention.create.reconcile': 'Réconcilier',
  'surveillance.filters.declarationCountLabel': 'Nombre de déclarations',
  'surveillance.status.empty': 'Aucune donnée de surveillance disponible',
  'app.name': 'AES Guardian',
  'app.loading': 'Chargement…',
  'app.back': 'Retour',
  'app.ok': 'OK',
  'app.offline': 'Hors ligne — Données locales disponibles',
  'db.initializing': 'Initialisation de la base de données…',
  'db.ready': 'Base de données prête',
  'db.error': 'Erreur de base de données',

  'nav.declarations': 'Déclarations AES',
  'nav.newDeclaration': 'Nouvelle déclaration',
  'nav.declarationDetails': 'Détails de la déclaration',
  'nav.back': 'Retour',

  'list.title': 'Mes déclarations',
  'list.empty': 'Aucune déclaration',
  'list.emptySubtitle': 'Appuyez sur le bouton ci-dessous pour créer votre première déclaration.',
  'list.newButton': 'Nouvelle déclaration',
  'list.refNumber': 'Référence',
  'list.refUnavailable': 'Référence indisponible',
  'list.incidentDate': 'Date de l\'incident',
  'list.status': 'Statut',

  'form.title.new': 'Nouvelle déclaration AES',
  'form.title.edit': 'Modifier le brouillon',
  'form.unauthorized': "Cette étape est réservée au professionnel ayant déclaré l'incident.",
  'form.incidentDate': 'Date et heure de l\'incident',
  'form.incidentDate.placeholder': 'JJ/MM/AAAA',
  'form.incidentType': 'Type d\'exposition',
  'form.incidentType.placeholder': 'Sélectionner le type d\'exposition',
  'form.incidentType.percutaneous': 'Accident percutané (piqûre / coupure)',
  'form.incidentType.percutaneous.desc': 'Piqûre d\'aiguille, coupure par bistouri ou effraction cutanée souillée',
  'form.incidentType.mucocutaneous': 'Projection muqueuse ou cutanée',
  'form.incidentType.mucocutaneous.desc': 'Projection de liquide biologique sur muqueuse (œil, bouche) ou peau lésée',
  'form.incidentType.sexual_assault': 'Agression sexuelle',
  'form.incidentType.sexual_assault.desc': 'Exposition particulière avec prise en charge d\'urgence spécifique',
  'form.incidentType.other': 'Autre (préciser dans les circonstances)',
  'form.incidentType.other.desc': 'Autre situation d\'exposition professionnelle accidentelle au sang',
  'form.circumstances': 'Circonstances de l\'incident',
  'form.circumstances.placeholder': 'Décrivez les circonstances de l\'incident…',
  'form.exposureDescription': 'Nature de l\'exposition',
  'form.exposureDescription.placeholder': 'Décrivez la nature de l\'exposition…',
  'form.protectiveMeasures': 'Mesures de protection prises',
  'form.protectiveMeasures.placeholder': 'Indiquez les mesures prises…',
  'form.departmentCode': 'Service / unité',
  'form.departmentCode.placeholder': 'Code ou nom du service (optionnel)',
  'form.notes': 'Notes complémentaires',
  'form.notes.placeholder': 'Informations complémentaires…',
  'form.required': 'Obligatoire',
  'form.optional': 'Optionnel',
  'form.saveDraft': 'Enregistrer le brouillon',
  'form.submit': 'Soumettre la déclaration',
  'form.saving': 'Enregistrement…',
  'form.submitting': 'Soumission…',
  'form.savedDraft': 'Brouillon enregistré',
  'form.disclaimer': 'Cette déclaration est destinée à des fins de coordination. Elle ne constitue pas un avis médical.',
  'form.step.counter': 'Étape {step} sur 5',
  'form.step1.title': 'Informations Générales',
  'form.step1.subtitle': 'Date et lieu de survenue de l\'exposition accidentelle au sang.',
  'form.step2.title': 'Caractéristiques de l\'Exposition',
  'form.step2.subtitle': 'Sélectionnez la nature de l\'exposition professionnelle subie.',
  'form.step3.title': 'Circonstances de l\'Incident',
  'form.step3.subtitle': 'Décrivez le geste en cours, le matériel et la nature du contact.',
  'form.step4.title': 'Mesures de Protection',
  'form.step4.subtitle': 'Description des mesures prises suite à l\'exposition (champ libre).',
  'form.step4.advisory': 'Décrivez librement les mesures que vous avez effectivement prises après l’exposition.',
  'form.step5.title': 'Récapitulatif & Attestation',
  'form.step5.subtitle': 'Vérifiez l\'exactitude des informations avant transmission administrative.',
  'form.step.next': 'Continuer',
  'form.step.prev': 'Précédent',
  'form.autoSaved': 'Brouillon synchronisé',
  'form.autoSaveFailed': 'Échec de sauvegarde',
  'form.saveDraftError': 'Impossible d\'enregistrer le brouillon localement. Vos modifications restent conservées à l\'écran.',
  'form.summary.title': 'Synthèse de la Déclaration',
  'form.departmentCode.notSpecified': 'Non précisé',
  'form.attestation.label': 'J\'atteste sur l\'honneur l\'exactitude des informations déclarées ci-dessus.',
  'form.attestation.subtitle': 'Cette attestation confirme l\'enregistrement local pour le suivi SST et administratif.',
  'form.attestation.required': 'Veuillez attester l\'exactitude des informations pour soumettre.',

  'validation.required': 'Ce champ est obligatoire',
  'validation.incidentDateRequired': 'La date de l\'incident est obligatoire',
  'validation.incidentTypeRequired': 'Le type d\'exposition est obligatoire',
  'validation.incidentDateInvalid': 'Format de date invalide (JJ/MM/AAAA)',

  'status.draft': 'Brouillon',
  'status.submitted': 'Soumise',
  'status.under_review': 'En révision',
  'status.correction_requested': 'Correction demandée',
  'status.resubmitted': 'Réponse transmise',
  'status.closed': 'Clôturée',

  'details.title': 'Déclaration',
  'details.refNumber': 'Numéro de référence',
  'details.status': 'Statut',
  'details.incidentDate': 'Date de l\'incident',
  'details.incidentType': 'Type d\'exposition',
  'details.circumstances': 'Circonstances',
  'details.exposureDescription': 'Nature de l\'exposition',
  'details.protectiveMeasures': 'Mesures de protection',
  'details.departmentCode': 'Service',
  'details.notes': 'Notes',
  'details.createdAt': 'Créée le',
  'details.submittedAt': 'Soumise le',
  'details.editDraft': 'Modifier le brouillon',
  'details.submitDeclaration': 'Soumettre',
  'details.notSet': 'Non renseigné',
  'details.readOnly': 'Cette déclaration a été soumise et ne peut plus être modifiée.',

  'confirm.title': 'Déclaration soumise',
  'confirm.subtitle': 'Votre déclaration a été enregistrée localement.',
  'confirm.refNumber': 'Référence :',
  'confirm.message': 'Votre déclaration a été soumise pour révision administrative. Conservez le numéro de référence pour le suivi.',
  'confirm.disclaimer': 'Note : cet enregistrement est local et n\'est pas envoyé automatiquement. Il n\'est pas juridiquement probant.',
  'confirm.backToList': 'Retour à mes déclarations',

  'error.generic': 'Une erreur s\'est produite',
  'error.saveFailed': 'Échec de l\'enregistrement',
  'error.submitFailed': 'Échec de la soumission',
  'error.loadFailed': 'Échec du chargement',

  'role.exposed_professional': 'Professionnel exposé',
  'role.admin_reviewer': 'Réviseur administratif',
  'role.oh_professional': 'Médecin du travail',
  'role.quality_staff': 'Personnel qualité',
  'role.tech_admin': 'Administrateur technique',

  // Phase 2C.3: Review queue & actions (FR)
  'nav.reviewQueue': 'File d\'attente administrative',
  'reviewQueue.title': 'Revue administrative AES',
  'reviewQueue.empty': 'Aucune déclaration en attente',
  'reviewQueue.emptySubtitle': 'Toutes les déclarations soumises ont été traitées ou aucune n\'est en attente.',
  'reviewQueue.filterAll': 'Toutes',
  'reviewQueue.filterSubmitted': 'Soumises',
  'reviewQueue.filterUnderReview': 'En cours d\'examen',
  'reviewQueue.reviewerBadge': 'Session de révision administrative',
  'reviewQueue.submittedAt': 'Soumise le :',
  'reviewQueue.declaredBy': 'Déclarant (synthétique) :',
  'reviewQueue.openReview': 'Examiner la déclaration',
  'reviewQueue.refresh': 'Actualiser',
  'review.title': 'Traitement administratif',
  'review.declarationRef': 'Déclaration :',
  'review.selectOutcome': 'Décision administrative :',
  'review.outcome.acknowledged': 'Déclaration accusée de réception',
  'review.outcome.acknowledgedDesc': 'Dossier administratif reçu, complet et consigné.',
  'review.outcome.transmission_verified': 'Transmission hiérarchique vérifiée',
  'review.outcome.transmission_verifiedDesc': 'Vérification de la chaîne de transmission et information de la médecine du travail.',
  'review.outcome.correction_requested': 'Demande de correction / complément',
  'review.outcome.correction_requestedDesc': 'Informations administratives incomplètes, retour vers le déclarant sans modifier l\'original.',
  'review.comments': 'Commentaires administratifs (optionnel)',
  'review.commentsPlaceholder': 'Notes administratives ou observations de transmission…',
  'review.correctionReason': 'Motif précis de la correction (obligatoire)',
  'review.correctionReasonPlaceholder': 'Précisez les éléments manquants ou à corriger par le déclarant…',
  'review.submitButton': 'Enregistrer la décision',
  'review.submitting': 'Enregistrement en cours…',
  'review.success': 'Décision administrative enregistrée avec succès.',
  'review.confirmTitle': 'Confirmer la décision',
  'review.confirmMessage': 'Êtes-vous sûr de vouloir enregistrer cette décision administrative ? Cette action sera consignée dans le journal d\'audit.',
  'review.confirmButton': 'Confirmer',
  'review.cancelButton': 'Annuler',
  'review.historyTitle': 'Historique des révisions',
  'review.noHistory': 'Aucune révision enregistrée pour cette déclaration.',
  'review.unauthorized': 'Accès réservé exclusivement au rôle réviseur administratif.',
  'review.notReviewable': "Cette déclaration n'est plus disponible pour une révision administrative.",
  'review.correctionReasonRequired': 'Le motif de correction est obligatoire lorsque vous demandez une correction.',
  'review.readOnlyNotice': 'Les déclarations soumises sont en lecture seule. La demande de correction consigne un motif sans altérer la déclaration originale.',

  // Phase 2C.3.1: Correction Response Workflow (FR)
  'reviewQueue.filterCorrectionRequested': 'En attente déclarant',
  'reviewQueue.filterResubmitted': 'Réponses reçues',
  'details.pendingCorrectionTitle': 'Demande de correction reçue',
  'details.pendingCorrectionAction': 'Répondre à la demande de correction',
  'correction.screenTitle': 'Réponse à la correction',
  'correction.requestHeader': 'Demande du réviseur administratif',
  'correction.reasonLabel': 'Motif de correction :',
  'correction.commentsLabel': 'Commentaires du réviseur :',
  'correction.demoContext': 'Données de démonstration synthétiques uniquement.',
  'correction.inputLabel': 'Votre réponse / précisions (obligatoire)',
  'correction.inputPlaceholder': 'Apportez ici les précisions ou compléments demandés…',
  'correction.characterCount': '{count} caractères',
  'correction.submitButton': 'Transmettre la réponse',
  'correction.submitting': 'Transmission en cours…',
  'correction.confirmTitle': 'Confirmer la transmission',
  'correction.confirmMessage': 'Voulez-vous transmettre cette réponse ? Votre déclaration sera transmise pour réexamen administratif.',
  'correction.successTitle': 'Réponse transmise',
  'correction.successMessage': 'Votre réponse a été enregistrée avec succès et le dossier est de nouveau en attente de réexamen.',
  'correction.unauthorized': 'Seul le déclarant propriétaire de ce dossier peut y répondre.',
  'correction.errorRequired': 'Veuillez saisir votre réponse avant de transmettre.',
  'review.declarantResponseHeader': 'Dernière réponse du déclarant :',
  'review.rereviewButton': 'Enregistrer le réexamen',
  'reviewAction.declarationSummaryTitle': 'Résumé de la déclaration (Lecture seule)',
  'reviewAction.outcome.approvedEffect': 'Statut résultant : En cours d\'examen',
  'reviewAction.outcome.correctionEffect': 'Statut résultant : Demande de correction',
  'reviewAction.correctionReasonLabel': 'Motif : ',
  'reviewAction.commentsLabel': 'Notes : ',
  'reviewAction.unauthorizedNotice': 'Cette interface est réservée exclusivement aux réviseurs administratifs (admin_reviewer).',

  // Phase 2C.4: Occupational-health coordination (FR)
  'oh.nav.queue': "File de coordination santé au travail",
  'oh.nav.detail': "Détail de la coordination",
  'oh.nav.create': "Créer une coordination",
  'oh.queue.title': "File de coordination — Santé au travail",
  'oh.queue.empty': "Aucune coordination en attente",
  'oh.queue.emptySubtitle': "Il n'y a actuellement aucun dossier de coordination en attente d'action.",
  'oh.queue.reviewerBadge': "Session professionnelle de santé au travail (démo)",
  'oh.queue.reason': "Motif :",
  'oh.queue.openDetail': "Voir le détail",
  'oh.queue.refresh': "Actualiser",
  'oh.create.title': "Créer un enregistrement de coordination",
  'oh.create.reason': "Catégorie de coordination",
  'oh.create.disclaimer': "Ceci est un enregistrement de coordination local à des fins de démonstration. Il ne constitue pas une transmission officielle vers un service médical.",
  'oh.create.confirm': "Confirmer la création",
  'oh.create.confirmMessage': "Créer cet enregistrement de coordination de démonstration pour le dossier sélectionné ?",
  'oh.create.button': "Créer la coordination",
  'oh.create.submitting': "Création en cours…",
  'oh.create.success': "Enregistrement de coordination créé.",
  'oh.detail.title': "Détail de la coordination",
  'oh.detail.noReference': 'Référence indisponible',
  'oh.detail.status': "Statut",
  'oh.detail.acknowledge': "Prendre en charge",
  'oh.detail.complete': "Marquer le suivi comme terminé",
  'oh.detail.completeConfirm': "Confirmer la clôture",
  'oh.detail.completeConfirmMessage': "Marquer ce suivi de coordination comme terminé ? Cette action est irréversible.",
  'oh.detail.events': "Événements de suivi enregistrés",
  'oh.detail.noEvents': "Aucun événement de suivi enregistré pour le moment.",
  'oh.detail.addEvent': "Enregistrer un événement de suivi",
  'oh.detail.coordinator': "Initiateur :",
  'oh.detail.declRef': "Référence déclaration :",
  'oh.detail.reason': "Motif de coordination :",
  'oh.detail.acknowledgedBy': "Pris en charge par :",
  'oh.detail.completedBy': "Clôturé par :",
  'oh.detail.disclaimer': "PROTOTYPE DE DÉMONSTRATION — Cet enregistrement local n'est pas une transmission officielle. Il n'engage pas une prise en charge médicale ou institutionnelle.",
  'oh.event.title': "Enregistrer un événement de suivi",
  'oh.event.category': "Catégorie d'événement",
  'oh.event.date': "Date de l'événement",
  'oh.event.datePlaceholder': 'AAAA-MM-JJ',
  'oh.event.note': "Note administrative (optionnel)",
  'oh.event.notePlaceholder': "Brève note de coordination non clinique…",
  'oh.event.submit': "Enregistrer l'événement",
  'oh.event.submitting': "Enregistrement…",
  'oh.status.pending_acknowledgement': "En attente de prise en charge",
  'oh.status.acknowledged': "Pris en charge",
  'oh.status.completed': "Suivi terminé",
  'oh.status.cancelled': "Annulé",
  'oh.reason.routine_followup': "Suivi de routine",
  'oh.reason.serology_monitoring': "Surveillance sérologique coordonnée",
  'oh.reason.specialized_evaluation': "Évaluation spécialisée coordonnée",
  'oh.reason.other_coordination': "Autre coordination administrative",
  'oh.event.contact_attempt_recorded': "Tentative de contact enregistrée",
  'oh.event.contact_established': "Contact établi",
  'oh.event.appointment_coordinated': "Rendez-vous coordonné",
  'oh.event.consultation_recorded': "Consultation enregistrée",
  'oh.event.follow_up_continued': "Suivi en cours",
  'oh.event.follow_up_completed': "Suivi marqué comme terminé",
  'oh.disclaimer.clinical': "Cet outil ne prend aucune décision clinique. Les actions de coordination sont enregistrées par un professionnel de santé au travail autorisé.",
  'oh.error.unauthorized': "Accès non autorisé à cette action de coordination.",
  'oh.error.alreadyActive': "Un enregistrement de coordination actif existe déjà pour ce dossier.",
  'oh.error.noDeclaration': "Déclaration introuvable.",
  'oh.decl.coordinationStatus': "Statut de coordination santé au travail :",
  'oh.decl.noActiveCoordination': "Aucune coordination de santé au travail active pour ce dossier.",
  'oh.decl.createCoordination': "Créer un enregistrement de coordination",
  // Phase 2E.1.6.1: OH Coordination UI Transformation (FR)
  'oh.queue.tabPending': "En attente",
  'oh.queue.tabAcknowledged': "Suivi en cours",
  'oh.queue.tabCompleted': "Suivi terminé",
  'oh.queue.emptyPending': "Aucune coordination en attente de prise en charge.",
  'oh.queue.emptyAcknowledged': "Aucune coordination en cours de suivi.",
  'oh.queue.emptyCompleted': "Aucun dossier de coordination terminé.",
  'oh.queue.totalRecords': "Total dossiers :",
  'oh.detail.acknowledgedStatus': "Pris en charge",
  'oh.detail.completedStatus': "Suivi clôturé",
  'oh.detail.createdAt': "Date d'initiation :",
  'oh.detail.updatedAt': "Dernière mise à jour :",
  'oh.detail.exposedNotice': "Ce volet résume l'état de la coordination santé au travail liée à votre déclaration.",
  'oh.detail.adminNotice': "Vue administrative en lecture seule de la coordination initiée pour cette déclaration.",
  'oh.detail.timelineTitle': "Historique des événements de suivi",
  'oh.detail.unauthorizedMessage': "Vous n'avez pas l'autorisation d'accéder aux détails de cette coordination.",
  'oh.event.dateInvalid': "Format de date invalide. Veuillez utiliser le format AAAA-MM-JJ.",
  'oh.event.charCount': "caractères",
  'oh.event.noteDescription': "Note administrative de traçabilité non clinique (300 caractères max).",
  'oh.create.reasonHelp': "Sélectionnez le motif administratif justifiant cette coordination :",
  'oh.create.disclaimerDetail': "Cette action enregistre une demande de coordination administrative interne. Elle ne remplace pas une prise en charge médicale d'urgence ou un protocole d'exposition au sang.",

  // Phase 2C.5: Surveillance Dashboard (FR)
  'surveillance.nav.title': "Tableau de bord de surveillance",
  'surveillance.title': "Surveillance & Suivi Agrégé AES",
  'surveillance.disclaimer': "DONNÉES DE DÉMONSTRATION SYNTHÉTIQUES — Ce tableau de bord présente des indicateurs agrégés à des fins de démonstration technique. Il ne représente pas des statistiques institutionnelles validées.",
  'surveillance.unauthorized': "Accès réservé exclusivement au personnel autorisé (Qualité, Administration RH, Santé au Travail).",
  'surveillance.roleBadge': "Session Surveillance & Qualité (Démo)",
  'surveillance.filters.title': "Filtres de surveillance",
  'surveillance.filters.all': "Tous",
  'surveillance.filters.status': "Statut :",
  'surveillance.filters.exposure': "Type d'exposition :",
  'surveillance.filters.startDate': "Du : AAAA-MM-JJ",
  'surveillance.filters.endDate': "Au : AAAA-MM-JJ",
  'surveillance.filters.clear': "Réinitialiser les filtres",
  'surveillance.overview.title': "Indicateurs Généraux",
  'surveillance.overview.total': "Total Déclarations",
  'surveillance.overview.draft': "Brouillons",
  'surveillance.overview.submitted': "Soumises",
  'surveillance.overview.underReview': "En revue",
  'surveillance.overview.correctionRequested': "Correction requise",
  'surveillance.overview.resubmitted': "Resoumises",
  'surveillance.overview.closed': "Clôturées",
  'surveillance.overview.activeOh': "Coordinations SST actives",
  'surveillance.overview.completedOh': "Suivis SST clôturés",
  'surveillance.temporal.title': "Évolution Temporelle des Déclarations",
  'surveillance.temporal.empty': "Aucune donnée temporelle sur la période sélectionnée.",
  'surveillance.exposure.title': "Répartition par Type d'Exposition",
  'surveillance.exposure.empty': "Aucune exposition enregistrée.",
  'surveillance.status.title': "Répartition par Statut de Déclaration",
  'surveillance.admin.title': "Indicateurs de Revue Administrative",
  'surveillance.admin.totalReviews': "Revues administratives totales",
  'surveillance.admin.correctionRequests': "Demandes de correction émises",
  'surveillance.admin.correctionResponses': "Réponses de correction reçues",
  'surveillance.admin.outcomes': "Décisions administratives",
  'surveillance.oh.title': "Indicateurs Santé au Travail",
  'surveillance.oh.status': "Statuts de coordination",
  'surveillance.oh.events': "Événements de suivi enregistrés par catégorie",

  // Phase 2C.6: Prevention & Corrective-Action Management (FR)
  'prevention.nav.title': "Prévention & CAPA",
  'prevention.title': "Prévention & Actions Correctives/Préventives",
  'prevention.disclaimer': "Prototype de démonstration — Données synthétiques uniquement. Ne représente pas de statistiques institutionnelles validées.",
  'prevention.provisional.disclaimer': "⚠ Catégories provisoires — validation institutionnelle requise avant tout usage officiel.",
  'prevention.unauthorized': "Accès réservé aux personnels autorisés (Qualité, Admin RH, Santé au Travail).",
  'prevention.overview.title': "Vue d'ensemble des Actions",
  'prevention.overview.total': "Total Actions",
  'prevention.overview.proposed': "Proposées",
  'prevention.overview.in_progress': "En cours",
  'prevention.overview.completed': "Clôturées",
  'prevention.overview.cancelled': "Annulées",
  'prevention.overview.viewRegister': "Voir le Registre",
  'prevention.overview.newAction': "Nouvelle Action",
  'prevention.register.title': "Registre des Actions",
  'prevention.register.empty': "Aucune action enregistrée pour ces critères.",
  'prevention.register.filterStatus': "Statut",
  'prevention.register.filterType': "Type",
  'prevention.register.filterFactor': "Facteur",
  'prevention.register.clearFilters': "Effacer",
  'prevention.register.all': "Tous",
  'prevention.register.retry': "Réessayer",
  'prevention.register.viewDetails': "Voir les détails de l'action",
  'prevention.create.title': "Nouvelle Action CAPA",
  'prevention.create.subtitle': "Formuler une mesure corrective ou préventive",
  'prevention.create.actionTitle': "Titre de la mesure *",
  'prevention.create.description': "Description détaillée *",
  'prevention.create.action_type': "Type de Mesure *",
  'prevention.create.corrective': "Corrective",
  'prevention.create.preventive': "Préventive",
  'prevention.create.factor.label': "Facteur Contributif (Provisoire)",
  'prevention.create.factor.none': "— Aucun facteur —",
  'prevention.create.factor.disclaimer': "⚠ Catégories provisoires — validation institutionnelle requise.",
  'prevention.create.rationale': "Justification *",
  'prevention.create.target_date': "Date Cible (optionnelle, YYYY-MM-DD)",
  'prevention.create.surveillance_reference': "Référence Surveillance (optionnelle)",
  'prevention.create.submit': "Enregistrer l'action",
  'prevention.create.submitting': "Enregistrement…",
  'prevention.create.success': "Action enregistrée avec succès.",
  'prevention.create.retry': "Réessayer",
  'prevention.create.error': "Impossible d'enregistrer l'action. Vos informations restent disponibles.",
  'prevention.create.denied': "Seul le personnel qualité peut créer des actions CAPA.",
  'prevention.create.validation.title': "Le titre doit comporter au moins 3 caractères.",
  'prevention.create.validation.description': "La description doit comporter au moins 5 caractères.",
  'prevention.create.validation.rationale': "La justification doit comporter au moins 5 caractères.",
  'prevention.create.validation.targetDate': "La date cible doit être au format YYYY-MM-DD.",
  'prevention.create.validation.surveillanceReference': "La référence doit être une observation agrégée, sans référence AES individuelle.",
  'prevention.create.placeholder.title': "Exemple : Dotation en collecteurs de sécurité",
  'prevention.create.placeholder.description': "Décrire la mesure proposée",
  'prevention.create.placeholder.rationale': "Justifier la mesure proposée",
  'prevention.create.placeholder.surveillanceReference': "Exemple : Observation T3-2026",
  'prevention.detail.title': "Détail de l'Action",
  'prevention.detail.subtitle': "Informations sur l'action et actions de cycle de vie autorisées",
  'prevention.detail.notFound': "Cette action CAPA est introuvable.",
  'prevention.detail.loadError': "Impossible de charger cette action. Réessayez.",
  'prevention.detail.retry': "Réessayer",
  'prevention.detail.actionInformation': "Informations sur la mesure",
  'prevention.detail.recordInformation': "Informations d'enregistrement",
  'prevention.detail.lifecycleActions': "Actions de cycle de vie",
  'prevention.detail.referenceCode': "Référence",
  'prevention.detail.status.proposed': "Proposée",
  'prevention.detail.status.in_progress': "En cours",
  'prevention.detail.status.completed': "Clôturée",
  'prevention.detail.status.cancelled': "Annulée",
  'prevention.detail.type.corrective': "Corrective",
  'prevention.detail.type.preventive': "Préventive",
  'prevention.detail.factor': "Facteur Contributif",
  'prevention.detail.rationale': "Justification",
  'prevention.detail.targetDate': "Date Cible",
  'prevention.detail.completedAt': "Clôturée le",
  'prevention.detail.completionNotes': "Note de Clôture",
  'prevention.detail.start_action': "Démarrer",
  'prevention.detail.complete_action': "Clôturer",
  'prevention.detail.cancel_action': "Annuler",
  'prevention.detail.completion_note_prompt': "Note de clôture requise (min. 3 caractères)",
  'prevention.detail.completionNoteLabel': "Note de clôture",
  'prevention.detail.cancelNoteLabel': "Note d'annulation (facultative)",
  'prevention.detail.cancelConfirmation': "Confirmer l'annulation de cette action ?",
  'prevention.detail.confirmCancellation': "Confirmer l'annulation",
  'prevention.detail.keepAction': "Conserver l'action",
  'prevention.detail.transitionError': "La mise à jour n'a pas pu être confirmée. Actualisez l'état avant de réessayer.",
  'prevention.detail.refreshRetry': "Actualiser l'état",
  'prevention.detail.validation.completionNote': "La note de clôture doit comporter au moins 3 caractères.",
  'prevention.detail.auditEmpty': "Aucun événement d'audit enregistré.",
  'prevention.detail.audit_history': "Historique des modifications",
  'prevention.detail.createdAt': "Créée le",
  'prevention.detail.updatedAt': "Mise à jour le",
  'prevention.factor.device_safety_design': "Conception dispositif sécurisé",
  'prevention.factor.procedure_compliance': "Conformité procédure",
  'prevention.factor.workload_fatigue': "Charge de travail / Fatigue",
  'prevention.factor.waste_disposal_container': "Conteneur élimination DASRI",
  'prevention.factor.protective_equipment': "Équipement de protection individuelle",
  'prevention.factor.training_supervision': "Formation / Supervision",
  'prevention.factor.environment_workspace': "Environnement / Poste de travail",
  'prevention.factor.other_factor': "Autre facteur",
  'prevention.factor.none': "Non spécifié",

  // Phase 2C.7: Unified Demonstration Workspace (FR)
  'workspace.tagline': "Plateforme intégrée de gestion des Accidents avec Exposition au Sang",
  'workspace.disclaimerTitle': "Prototype de Démonstration PFE — Données Synthétiques",
  'workspace.disclaimerText': "Ce prototype est conçu uniquement pour la soutenance PFE. Les données affichées sont synthétiques et générées localement. Aucune donnée patient ou hospitalière réelle n'est traitée. Les rôles et flux présentés sont simulés en mémoire locale.",
  'workspace.roleSelectorTitle': "Sélecteur de Rôle de Démonstration",
  'workspace.roleSelectorSubtitle': "Basculez entre les 5 rôles pour visualiser les parcours autorisés et les restrictions d'accès.",
  'workspace.roleDesc.exposed': "Déclaration immédiate d’un AES, consultation de ses déclarations, réponse aux demandes de correction administrative.",
  'workspace.roleDesc.admin': "Examen administratif, demande de correction, initiation de la coordination Santé au Travail, consultation CAPA.",
  'workspace.roleDesc.oh': "Prise en charge médico-professionnelle, suivi sérologique (VIH/VHB/VHC), événements de suivi, clôture SST.",
  'workspace.roleDesc.quality': "Surveillance épidémiologique dé-identifiée, consultation des indicateurs agrégés, pilotage du plan d’actions CAPA.",
  'workspace.roleDesc.tech': "Maintenance système, vérification du schéma SQLite et intégrité locale. Accès clinique et personnel strictement interdit.",
  'workspace.correctionActionRequired': "Demande de correction en attente",
  'workspace.correctionActionDesc': "L'administrateur RH a requis une correction sur l'une de vos déclarations. Veuillez compléter les informations.",
  'workspace.permittedModulesTitle': "Modules Autorisés pour ce Rôle",
  'workspace.module.newDeclaration': "Déclarer un AES",
  'workspace.module.newDeclarationDesc': "Saisie pas-à-pas d’une déclaration d’accident avec exposition au sang",
  'workspace.module.myDeclarations': "Mes Déclarations",
  'workspace.module.myDeclarationsDesc': "Historique et statut de vos déclarations personnelles d'AES",
  'workspace.module.adminQueue': "File d'Attente Administrative",
  'workspace.module.adminQueueDesc': "Examen des déclarations soumises, validation ou demande de correction",
  'workspace.module.allDeclarations': "Registre Global des Déclarations",
  'workspace.module.allDeclarationsDesc': "Vue administrative d'ensemble de toutes les déclarations de l'établissement",
  'workspace.module.ohQueue': "File Santé au Travail (SST)",
  'workspace.module.ohQueueDesc': "Coordination médico-professionnelle et suivi sérologique des professionnels exposés",
  'workspace.module.surveillanceDashboard': "Tableau de Bord Épidémiologique",
  'workspace.module.surveillanceDashboardDesc': "Indicateurs agrégés dé-identifiés, tendances, types d'exposition et filtres",
  'workspace.module.preventionOverview': "Vue d'Ensemble Prévention & CAPA",
  'workspace.module.preventionOverviewDesc': "Indicateurs synthétiques d'actions préventives et correctives",
  'workspace.module.preventionRegister': "Registre des Actions CAPA",
  'workspace.module.preventionRegisterDesc': "Pilotage opérationnel, transitions d'état et clôture des actions",
  'workspace.module.preventionRegisterReadOnly': "Registre Prévention (Lecture Seule)",
  'workspace.module.preventionRegisterReadOnlyDesc': "Consultation du registre des actions sans droit de modification",
  'workspace.module.preventionCreate': "Créer une Action CAPA",
  'workspace.module.preventionCreateDesc': "Formuler une action corrective ou préventive suite à un constat d'amélioration",
  'workspace.notice.exposedRestrictions': "Cloisonnement : vous n'avez pas accès aux déclarations d'autres soignants, ni au tableau de bord qualité, ni à la gestion CAPA.",
  'workspace.notice.qualityRestrictions': "Protection de la vie privée : vous avez accès aux indicateurs agrégés dé-identifiés et au registre CAPA, mais aucun accès aux déclarations nominatives ni aux dossiers médicaux SST.",
  'workspace.notice.techRestrictions': "Cloisonnement strict : vous avez accès aux outils de diagnostic SQLite et d'intégrité technique, mais aucun accès aux données cliniques ou personnelles.",
  'workspace.tech.sqliteIntegrity': "Diagnostic SQLite Local",
  'workspace.tech.engine': 'Moteur',
  'workspace.tech.schemaVersion': "Version de Schéma",
  'workspace.tech.fkCheck': "Contrôle Clés Étrangères (PRAGMA foreign_key_check)",
  'workspace.tech.fkOk': "0 violation détectée",
  'workspace.badgePending': "en attente",
  'workspace.badgeActive': "actives",
  'workspace.badgeIncidents': "AES",
  'workspace.badgeActions': "actions",
  'workspace.scenarioTitle': "Scénario de Démonstration Guidé (PFE)",
  'workspace.scenarioSubtitle': "Suivez ces 6 étapes pour présenter le cycle de vie complet d'un AES devant le jury :",
  'workspace.step1.title': "1. Déclaration AES",
  'workspace.step1.desc': "Le soignant déclare un accident d'exposition au sang immédiatement après survenue.",
  'workspace.step2.title': "2. Examen Administratif",
  'workspace.step2.desc': "Le cadre ou RH examine la déclaration et valide ou demande des précisions.",
  'workspace.step3.title': "3. Correction Éventuelle",
  'workspace.step3.desc': "Le professionnel complète les informations requises sans altérer l'audit.",
  'workspace.step4.title': "4. Prise en Charge SST",
  'workspace.step4.desc': "La Santé au Travail assure la coordination confidentielle et le suivi sérologique.",
  'workspace.step5.title': "5. Surveillance Qualité",
  'workspace.step5.desc': "Le responsable qualité analyse les indicateurs épidémiologiques dé-identifiés.",
  'workspace.step6.title': "6. Plan d'Actions CAPA",
  'workspace.step6.desc': "Définition, suivi et clôture d'actions correctives pour prévenir la récidive.",
  'workspace.switchRole': "Basculer vers ce rôle",
  'workspace.activeRoleIndicator': "Rôle Actif",

  // ─── Phase 2D.1: Help Centre & Glossary ───
  'helpGlossary.title': "Centre d'Aide & Glossaire",
  'helpGlossary.subtitle': "Ressources documentaires, définitions et repères pour la démonstration",
  'helpGlossary.tabHelp': "Centre d'Aide",
  'helpGlossary.tabGlossary': "Glossaire AES",
  'helpGlossary.disclaimer': "Cette application est un prototype de démonstration académique utilisant exclusivement des données synthétiques. Elle ne remplace pas les protocoles institutionnels, l'avis des professionnels compétents ni les procédures officielles de prise en charge.",
  'helpGlossary.searchPlaceholder': "Rechercher un terme ou une définition…",
  'helpGlossary.clearSearch': "Effacer la recherche",
  'helpGlossary.categoryAll': "Tous",
  'helpGlossary.categoryExposure': "Exposition",
  'helpGlossary.categoryDeclaration': "Déclaration",
  'helpGlossary.categoryAdmin': "Administratif",
  'helpGlossary.categoryOH': "Santé au Travail",
  'helpGlossary.categoryQuality': "Qualité & CAPA",
  'helpGlossary.emptySearch': "Aucun terme correspondant à votre recherche.",
  'helpGlossary.backToWorkspace': "Retour à l'espace",

  // Help Sections (1 to 8)
  'help.section1.title': "1. Présentation d'AES Guardian",
  'help.section1.content': "AES Guardian est une application mobile de démonstration dédiée à la déclaration, au suivi administratif, à la coordination de Santé au Travail et à la surveillance épidémiologique des Accidents avec Exposition au Sang (AES). Conçue dans le cadre d'un Projet de Fin d'Études (PFE), elle démontre un flux de travail continu et sécurisé opérant intégralement en mode hors-ligne avec SQLite natif.",
  'help.section2.title': "2. Comprendre le parcours de déclaration",
  'help.section2.content': "Le soignant victime d'une exposition (piqûre, coupure, projection de liquide biologique) initie immédiatement la déclaration. Le formulaire permet de consigner la date, le service et les circonstances sans divulguer d'informations nominatives de patients. Une fois transmise, la déclaration devient non modifiable et entre dans le circuit de validation.",
  'help.section3.title': "3. Comprendre la revue administrative",
  'help.section3.content': "L'administrateur RH ou le cadre examine la recevabilité de la déclaration. Trois décisions sont possibles : accuser réception formellement, attester de la transmission vers la Santé au Travail, ou demander un complément d'information au soignant. En cas de demande de correction, le déclarant peut apporter des précisions sans altérer les données initiales.",
  'help.section4.title': "4. Comprendre la coordination de Santé au Travail",
  'help.section4.content': "Le médecin ou infirmier de Santé au Travail assure l'accompagnement médico-professionnel du soignant exposé. Les jalons de suivi (contact établi, consultation spécialisée, surveillance sérologique de contrôle, clôture) sont enregistrés sous forme d'événements administratifs non cliniques afin de préserver le secret médical.",
  'help.section5.title': "5. Comprendre la surveillance épidémiologique",
  'help.section5.content': "Le responsable Qualité accède à des indicateurs statistiques entièrement dé-identifiés : fréquence mensuelle, répartition selon le type d'accident, services les plus exposés et taux de résolution des dossiers. Aucun accès aux données personnelles des soignants n'est possible depuis cet espace.",
  'help.section6.title': "6. Comprendre la démarche CAPA (Prévention)",
  'help.section6.content': "L'analyse des tendances épidémiologiques alimente le registre des actions correctives et préventives (CAPA). Chaque action cible un facteur contributif identifié (qualité du matériel, conformité aux procédures, élimination des déchets, formation) afin d'éviter la récurrence des incidents.",
  'help.section7.title': "7. Comprendre les 5 rôles synthétiques",
  'help.section7.content': "L'application applique un cloisonnement strict des habilitations : Professionnel Exposé (déclaration et ses propres dossiers), Administrateur RH (recevabilité et orientation), Santé au Travail (suivi médical réglementaire), Qualité (indicateurs agrégés et CAPA), et Administrateur Technique (maintenance locale sans accès aux données de santé).",
  'help.section8.title': "8. Confidentialité et limites du prototype",
  'help.section8.content': "Cette application est un environnement de simulation académique utilisant exclusivement des données synthétiques locales. Elle ne constitue pas un dispositif médical, ne formule aucun diagnostic et ne fournit aucune recommandation thérapeutique ou posologique.",

  // Glossary Terms (1 to 14)
  'glossary.term1.term': "AES (Accident d'Exposition au Sang)",
  'glossary.term1.category': "Exposition",
  'glossary.term1.definition': "Tout contact accidentel avec du sang ou un liquide biologique contaminé par du sang, survenant par effraction cutanée (piqûre, coupure) ou projection sur une muqueuse ou une peau lésée.",
  'glossary.term2.term': "Exposition percutanée",
  'glossary.term2.category': "Exposition",
  'glossary.term2.definition': "Lésion pénétrante causée par une aiguille creuse, une lame de bistouri ou tout instrument médical piquant ou tranchant souillé de produit biologique.",
  'glossary.term3.term': "Exposition muqueuse",
  'glossary.term3.category': "Exposition",
  'glossary.term3.definition': "Contact accidentel par projection de liquide biologique sur les muqueuses oculaires (yeux) ou buccales du professionnel.",
  'glossary.term4.term': "Peau lésée",
  'glossary.term4.category': "Exposition",
  'glossary.term4.definition': "Zone cutanée présentant une effraction ou dermatose préexistante (plaie, excoriation, brûlure) entrée en contact avec un fluide biologique.",
  'glossary.term5.term': "Déclaration",
  'glossary.term5.category': "Déclaration",
  'glossary.term5.definition': "Enregistrement dématérialisé initial de l'exposition par le professionnel concerné, consignant les circonstances factuelles sans divulgation de données de patients.",
  'glossary.term6.term': "Revue administrative",
  'glossary.term6.category': "Administratif",
  'glossary.term6.definition': "Examen de conformité et de recevabilité opéré par un cadre ou gestionnaire RH pour acter la déclaration et orienter vers les structures adaptées.",
  'glossary.term7.term': "Coordination de Santé au Travail",
  'glossary.term7.category': "Santé au Travail",
  'glossary.term7.definition': "Dispositif d'accompagnement et de suivi médico-légal assuré par le service de Santé au Travail pour protéger le soignant.",
  'glossary.term8.term': "Sérologie",
  'glossary.term8.category': "Santé au Travail",
  'glossary.term8.definition': "Examens de biologie médicale (notamment VIH, VHB, VHC) réalisés dans le cadre du suivi médico-professionnel consécutif à une exposition. Cette application enregistre les jalons administratifs de ce suivi ; elle n'établit ni ne prescrit de calendrier d'examens.",
  'glossary.term9.term': "Surveillance épidémiologique",
  'glossary.term9.category': "Qualité & CAPA",
  'glossary.term9.definition': "Analyse systématique et agrégée des incidents déclarés pour identifier les tendances de risque et évaluer l'efficacité des mesures préventives.",
  'glossary.term10.term': "Dé-identification",
  'glossary.term10.category': "Qualité & CAPA",
  'glossary.term10.definition': "Principe de protection des données dissociant les indicateurs statistiques de toute référence directe ou indirecte à l'identité du soignant.",
  'glossary.term11.term': "Facteur contributif",
  'glossary.term11.category': "Qualité & CAPA",
  'glossary.term11.definition': "Élément organisationnel, matériel, humain ou environnemental ayant favorisé la survenue ou aggravé les conséquences d'un incident.",
  'glossary.term12.term': "CAPA (Actions Correctives et Préventives)",
  'glossary.term12.category': "Qualité & CAPA",
  'glossary.term12.definition': "Méthodologie qualité structurée visant à éliminer les causes profondes d'accidents récurrents et à empêcher leur répétition.",
  'glossary.term13.term': "Événement de suivi",
  'glossary.term13.category': "Santé au Travail",
  'glossary.term13.definition': "Jalon administratif ou médical horodaté consignant une étape franchie dans le cadre du suivi assuré par la Santé au Travail.",
  'glossary.term14.term': "Journal d'audit",
  'glossary.term14.category': "Administratif",
  'glossary.term14.definition': "Registre local chronologique des opérations du système, maintenu pendant la démonstration prototype. Ce registre peut être effacé lors d'une réinitialisation des données de démonstration.",

  // ─── Phase 2D.1: Demonstrator Profile & Settings ───
  'profile.title': "Profil & Réglages Démonstrateur",
  'profile.subtitle': "Gestion du compte synthétique actif, des préférences et du système",
  'profile.accountSection': "Compte de Démonstration Actif",
  'profile.roleSection': "Changer de Rôle Synthétique",
  'profile.permissionsSection': "Habilitations & Restrictions",
  'profile.authorizedCapabilities': "Fonctionnalités Autorisées",
  'profile.restrictedCapabilities': "Restrictions d'Accès Strictes",
  'profile.demoAccountNotice': "Compte de démonstration simulé en mémoire locale. Aucune session persistante ni mot de passe requis pour le prototype.",
  'profile.languageSection': "Langue de l'Application",
  'profile.languageSelectorTitle': "Sélectionner la langue active :",
  'profile.rtlNotice': "Remarque : L'inversion complète de mise en page (RTL) pour l'arabe sera finalisée dans une mise à jour ultérieure.",
  'profile.navigationSection': "Documentation & Ressources",
  'profile.helpCenterLink': "Centre d'Aide & Parcours",
  'profile.glossaryLink': "Glossaire Terminologique AES",
  'profile.guidedTourLink': "Visite guidée et découverte",
  'profile.privacySection': "Confidentialité & Frontières Éthiques",
  'profile.privacyContent': "Ce prototype traite exclusivement des données synthétiques locales. Aucune donnée personnelle, médicale ou nominative réelle n'est enregistrée. Les données de surveillance présentées à la Qualité sont dé-identifiées dès leur conception.",
  'profile.aboutSection': "À Propos du Prototype",
  'profile.appNameLabel': "Application : AES Guardian (Module Sanad)",
  'profile.dbEngineLabel': "Base de données : SQLite (@op-engineering/op-sqlite)",
  'profile.maintenanceSection': "Maintenance Technique (tech_admin)",
  'profile.error.techAdminOnly': "Seul l'administrateur technique peut effectuer cette opération.",
  'profile.error.userIdMissing': "Impossible de réinitialiser sans le contexte du compte actif.",

  // Role capability items for profile
  'profile.cap.declare': "Déclarer un nouvel AES et enregistrer des brouillons",
  'profile.cap.myDeclarations': "Consulter l'état de ses propres déclarations",
  'profile.cap.respondCorrection': "Répondre aux demandes de précision administrative",
  'profile.cap.adminReview': "Instruire la file d'examen et consigner les revues administratives",
  'profile.cap.initiateOH': "Initier la coordination vers la Santé au Travail",
  'profile.cap.ohCoordination': "Prendre en charge les dossiers SST et gérer les jalons",
  'profile.cap.ohFollowUp': "Consigner les événements de suivi sérologique et clôturer",
  'profile.cap.surveillanceDashboard': "Consulter les indicateurs épidémiologiques dé-identifiés",
  'profile.cap.preventionRegister': "Consulter le registre des actions CAPA en lecture",
  'profile.cap.manageCapa': "Créer et piloter le cycle de vie des actions CAPA",
  'profile.cap.techMaintenance': "Vérifier le schéma SQLite et réinitialiser les données",
  'profile.restr.noSurveillance': "Accès interdit au tableau de bord épidémiologique",
  'profile.restr.noCapa': "Gestion des actions CAPA non autorisée",
  'profile.restr.noOtherDeclarations': "Consultation des déclarations d'autres soignants interdite",
  'profile.restr.noClinicalContent': "Accès au contenu clinique et personnel strictement interdit",
  'profile.restr.noAdminQueue': "Accès à la file de revue administrative interdit",
  'profile.restr.noIdentifiableData': "Accès aux identités individuelles des soignants refusé",

  // ─── Phase 2D.1: Secure Data Reset ───
  'reset.sectionTitle': "Réinitialisation des Données de Démonstration",
  'reset.sectionDesc': "Action de maintenance réservée à l'administrateur technique. Permet de purger les ajouts et de restaurer le scénario étalon complet.",
  'reset.buttonLabel': "Réinitialiser les données de démonstration",
  'reset.dialog1Title': "Réinitialiser les données ?",
  'reset.dialog1Message': "Cette opération supprimera l'ensemble des déclarations ajoutées, revues, suivis et actions créées pour restaurer le jeu de données étalon d'origine (4 déclarations, 5 actions CAPA). Cette action est irréversible.",
  'reset.dialog1Cancel': "Annuler",
  'reset.dialog1Continue': "Continuer…",
  'reset.dialog2Title': "Confirmation Définitive",
  'reset.dialog2Message': "Êtes-vous absolument certain de vouloir réinitialiser la base de données locale maintenant ?",
  'reset.dialog2Cancel': "Annuler",
  'reset.dialog2Confirm': "Confirmer la réinitialisation",
  'reset.inProgress': "Réinitialisation en cours…",
  'reset.successTitle': "Réinitialisation Réussie",
  'reset.successMessage': "Le scénario de démonstration a été restauré.",
  'reset.errorTitle': "Échec de la Réinitialisation",
  'reset.errorMessage': "Une erreur est survenue lors de la réinitialisation transactionnelle :",

  // ─── Phase 2D.2: In-App Notifications (11 Canonical Events) ───
  'notification.declarationSubmitted.title': "Nouvelle déclaration soumise",
  'notification.declarationSubmitted.message': "La déclaration {reference} a été enregistrée et est en attente de revue administrative.",
  'notification.reviewCompleted.title': "Revue administrative finalisée",
  'notification.reviewCompleted.message': "La revue administrative de votre déclaration {reference} est terminée.",
  'notification.correctionRequested.title': "Demande de correction",
  'notification.correctionRequested.message': "Des précisions sont requises pour votre déclaration {reference}.",
  'notification.correctionSubmitted.title': "Réponse à la correction transmise",
  'notification.correctionSubmitted.message': "Le déclarant a transmis les éléments de correction pour le dossier {reference}.",
  'notification.ohCoordinationCreated.title': "Nouveau dossier SST à coordonner",
  'notification.ohCoordinationCreated.message': "Un nouveau dossier de coordination SST a été ouvert pour la déclaration {reference}.",
  'notification.ohCoordinationAcknowledged.title': "Prise en charge SST confirmée",
  'notification.ohCoordinationAcknowledged.message': "Le service de santé au travail a pris en charge votre dossier {reference}.",
  'notification.ohMilestoneRecorded.title': "Étape de suivi SST enregistrée",
  'notification.ohMilestoneRecorded.message': "Une nouvelle étape de suivi a été validée pour votre dossier {reference}.",
  'notification.ohCoordinationCompleted.title': "Suivi SST clôturé",
  'notification.ohCoordinationCompleted.message': "Le suivi de santé au travail pour votre déclaration {reference} est désormais clôturé.",
  'notification.capaCreated.title': "Action de prévention créée",
  'notification.capaCreated.message': "L'action de prévention {reference} a été enregistrée dans le registre CAPA.",
  'notification.capaStatusChanged.title': "Statut CAPA actualisé",
  'notification.capaStatusChanged.message': "Le statut de l'action de prévention {reference} a été mis à jour.",
  'notification.capaFinalized.title': "Action de prévention finalisée",
  'notification.capaFinalized.message': "L'action de prévention {reference} a été finalisée dans le registre CAPA.",

  // ─── Phase 2D.2G: Notification Centre UI ───
  'notificationCentre.title': "Centre de notifications",
  'notificationCentre.empty': "Aucune notification",
  'notificationCentre.emptySubtitle': "Vous n'avez aucune notification pour le moment.",
  'notificationCentre.markAllRead': "Tout marquer comme lu",
  'notificationCentre.markAllReadConfirm': "Marquer toutes les notifications comme lues ?",
  'notificationCentre.confirm': "Confirmer",
  'notificationCentre.cancel': "Annuler",
  'notificationCentre.retry': "Réessayer",
  'notificationCentre.unread': "Non lu",
  'notificationCentre.read': "Lu",
  'notificationCentre.today': "Aujourd'hui",
  'notificationCentre.yesterday': "Hier",
  'notificationCentre.tapToOpen': "Appuyer pour ouvrir",
  'notificationCentre.errorLoad': "Impossible de charger les notifications.",
  'notificationCentre.errorNavigation': "Destination introuvable ou accès refusé.",
  'notificationCentre.errorStale': "Cette notification est peut-être obsolète ou vous n'y avez plus accès.",
  'notificationCentre.techAdminRestricted': "Les administrateurs techniques n'ont pas accès aux notifications opérationnelles.",
  'notificationCentre.a11y.unreadBadge': "Notifications non lues",
  'notificationCentre.a11y.notificationItem': "Notification",
  'notificationCentre.a11y.markAllRead': "Marquer toutes les notifications comme lues",

  // ─── Phase 2E.1.2: Batch 2 Onboarding & Synthetic Demo Entry (FR) ───
  'splash.wordmark': 'AES Guardian',
  'splash.subtitle': 'Gouvernance hospitalière des AES',
  'splash.enter': 'Entrer dans l\'espace',
  'onboarding.lang.overline': 'LANGUE DU SYSTÈME',
  'onboarding.lang.title': 'Choisissez votre langue',
  'onboarding.lang.subtitle': 'Sélectionnez la langue d\'affichage du prototype hospitalier.',
  'onboarding.continue': 'Continuer',
  'onboarding.carousel.skip': 'Passer',
  'onboarding.carousel.start': 'Commencer',
  'onboarding.carousel.next': 'Suivant',
  'onboarding.carousel.slide1.title': 'Déclaration Rapide & Protégée',
  'onboarding.carousel.slide1.desc': 'Signalement structuré en 5 étapes dès la survenue d\'un accident d\'exposition au sang (AES), avec enregistrement local du brouillon.',
  'onboarding.carousel.slide1.bullet1': 'Enregistrement local des brouillons',
  'onboarding.carousel.slide1.bullet2': 'Formulaire structuré en 5 étapes guidées',
  'onboarding.carousel.slide1.bullet3': 'Reprise facilitée du brouillon en cours',
  'onboarding.carousel.slide2.title': 'Suivi de Coordination SST Confidentiel',
  'onboarding.carousel.slide2.desc': 'Prise en charge par la médecine du travail et suivi de coordination avec minimisation des données pour les autres rôles.',
  'onboarding.carousel.slide2.bullet1': 'Notes de suivi réservées à la médecine du travail',
  'onboarding.carousel.slide2.bullet2': 'Traçabilité des jalons de coordination post-exposition',
  'onboarding.carousel.slide2.bullet3': 'Projection restreinte de l\'état pour l\'agent exposé',
  'onboarding.carousel.slide3.title': 'Surveillance & Prévention',
  'onboarding.carousel.slide3.desc': 'Indicateurs statistiques agrégés sans données nominatives et registre local d\'actions correctives et préventives (CAPA).',
  'onboarding.carousel.slide3.bullet1': 'Indicateurs statistiques sans données personnelles',
  'onboarding.carousel.slide3.bullet2': 'Registre structuré des actions de prévention (CAPA)',
  'onboarding.carousel.slide3.bullet3': 'Cloisonnement strict des accès selon le rôle actif',
  'onboarding.disclaimer.title': 'Avertissement — Prototype de Démonstration',
  'onboarding.disclaimer.badge': 'PROTOCOLE ACADÉMIQUE PFE',
  'onboarding.disclaimer.p1': '1. Ce logiciel est un prototype de recherche académique (PFE). Toutes les données, incidents, personnels et matricules sont 100 % synthétiques.',
  'onboarding.disclaimer.p2': '2. Aucune donnée médicale réelle n\'est stockée ni transmise. Le système fonctionne hors-ligne en base locale SQLite.',
  'onboarding.disclaimer.p3': '3. Cette application ne constitue pas un dispositif médical certifié et n\'effectue aucun triage clinique autonome ni prescription médicamenteuse.',
  'onboarding.disclaimer.p4': '4. Ce prototype ne remplace aucun dispositif de prise en charge d\'urgence. En cas d\'exposition réelle, appliquez les protocoles d\'urgence de votre établissement et consultez sans délai un service médical d\'urgence.',
  'onboarding.disclaimer.checkbox': 'J\'ai compris la nature académique du prototype et le caractère synthétique des données.',
  'onboarding.disclaimer.accept': 'Accepter et continuer',
  'onboarding.picker.title': 'Comptes de Démonstration',
  'onboarding.picker.subtitle': 'Sélectionnez un profil canonique pour explorer les parcours opérationnels et les frontières d\'accès.',
  'onboarding.picker.syntheticNotice': 'Comptes synthétiques locaux sans mot de passe. Les identifiants (ex: NURSE-001) sont des repères de démonstration pour les évaluateurs.',
  'onboarding.picker.enter': 'Accéder à l\'espace',
  'onboarding.picker.role1.code': 'NURSE-001',
  'onboarding.picker.role1.title': 'Professionnel de Santé Exposé',
  'onboarding.picker.role1.desc': 'Déclaration d\'incident AES et suivi de ses dossiers propres.',
  'onboarding.picker.role2.code': 'ADMIN-001',
  'onboarding.picker.role2.title': 'Encadrement & Direction des Soins',
  'onboarding.picker.role2.desc': 'Examen administratif, demande de correction et validation.',
  'onboarding.picker.role3.code': 'OCC-001',
  'onboarding.picker.role3.title': 'Santé au Travail (SST)',
  'onboarding.picker.role3.desc': 'Prise en charge et suivi administratif des dossiers de coordination post-exposition.',
  'onboarding.picker.role4.code': 'QUAL-001',
  'onboarding.picker.role4.title': 'Cellule Qualité & Risques',
  'onboarding.picker.role4.desc': 'Surveillance épidémiologique agrégée et actions correctives (CAPA).',
  'onboarding.picker.role5.code': 'ADMIN-TECH',
  'onboarding.picker.role5.title': 'Administration Technique',
  'onboarding.picker.role5.desc': 'Diagnostics du prototype et réinitialisation des données de démonstration.',

  // ─── Phase 2E.1.4.3: Batch 4 Declaration List & Details ───
  'list.filter.all': 'Toutes',
  'list.filter.draft': 'Brouillons',
  'list.filter.submitted': 'Soumises',
  'list.filter.under_review': 'En révision',
  'list.filter.closed': 'Clôturées',
  'list.adminQueueShortcut': "File d'examen",
  'list.restrictedTitle': 'Accès restreint',
  'list.restrictedMessage': "Votre rôle ne vous autorise pas à accéder à la liste des déclarations.",
  'list.incidentType': "Type d'exposition",
  'list.title.admin': 'Toutes les déclarations',
  'details.tab.summary': 'Résumé',
  'details.tab.incident': 'Incident',
  'details.tab.measures': 'Mesures',
  'details.tab.status': 'Statut',
  'details.tab.followup': 'Suivi',
  'details.followup.noCoordination': 'Aucun suivi de santé au travail enregistré.',
  'details.followup.coordinationStatus': 'Statut du suivi',
  'details.followup.coordinationDate': 'Initié le',
  'details.followup.updatedAt': 'Mis à jour le',
  'details.followup.adminSummary': 'Résumé de coordination (administratif)',
  'details.followup.reason': 'Motif de coordination',
  'details.followup.acknowledgedAt': 'Pris en charge le',
  'details.followup.completedAt': 'Clôturé le',
  'details.restrictedAccess': 'Accès non autorisé',
  'details.notFound': 'Déclaration introuvable.',
  'details.reviewHistory': 'Historique des révisions',
  'details.reviewAction': "Réviser la déclaration",
  'details.createCoordination': 'Initier un suivi SST',
  'details.respondToCorrection': 'Répondre à la demande de correction',
  'details.correctionPending': 'Une correction est demandée pour cette déclaration.',
};

const en: TranslationMap = {
  // Extra keys
  'navigation.back': 'Back',
  'workspace.nav.title': 'AES Guardian Workspace',
  'prevention.create.acknowledgement.confirm': 'Confirm presentation',
  'prevention.create.acknowledgement.inProgress': 'Confirming presentation...',
  'prevention.create.acknowledgement.error': 'Error confirming presentation',
  'prevention.create.result.title': 'Prevention action created',
  'prevention.create.result.recovery': 'Recovery of created action',
  'prevention.create.uncertain': 'Uncertain creation - status pending',
  'prevention.create.reconcileAbsent': 'Action not found during reconciliation',
  'prevention.create.reference': 'Reference',
  'prevention.create.reconcile': 'Reconcile',
  'surveillance.filters.declarationCountLabel': 'Declaration count',
  'surveillance.status.empty': 'No surveillance data available',
  'app.name': 'AES Guardian',
  'app.loading': 'Loading…',
  'app.back': 'Back',
  'app.ok': 'OK',
  'app.offline': 'Offline — Local data available',
  'db.initializing': 'Initializing database…',
  'db.ready': 'Database ready',
  'db.error': 'Database error',

  'nav.declarations': 'AES Declarations',
  'nav.newDeclaration': 'New Declaration',
  'nav.declarationDetails': 'Declaration Details',
  'nav.back': 'Back',

  'list.title': 'My Declarations',
  'list.empty': 'No declarations',
  'list.emptySubtitle': 'Tap the button below to create your first declaration.',
  'list.newButton': 'New Declaration',
  'list.refNumber': 'Reference',
  'list.refUnavailable': 'Reference unavailable',
  'list.incidentDate': 'Incident Date',
  'list.status': 'Status',

  'form.title.new': 'New AES Declaration',
  'form.title.edit': 'Edit Draft',
  'form.unauthorized': 'Only the reporting professional can use this screen.',
  'form.incidentDate': 'Incident Date and Time',
  'form.incidentDate.placeholder': 'DD/MM/YYYY',
  'form.incidentType': 'Type of Exposure',
  'form.incidentType.placeholder': 'Select exposure type',
  'form.incidentType.percutaneous': 'Percutaneous accident (needlestick / cut)',
  'form.incidentType.percutaneous.desc': 'Needlestick injury, surgical blade cut, or contaminated cutaneous puncture',
  'form.incidentType.mucocutaneous': 'Mucocutaneous or cutaneous splash',
  'form.incidentType.mucocutaneous.desc': 'Splash of biological fluid onto mucous membrane (eye, mouth) or non-intact skin',
  'form.incidentType.sexual_assault': 'Sexual assault',
  'form.incidentType.sexual_assault.desc': 'Specific exposure circumstance requiring dedicated emergency protocol',
  'form.incidentType.other': 'Other (describe in circumstances)',
  'form.incidentType.other.desc': 'Other accidental occupational blood or bodily fluid exposure event',
  'form.circumstances': 'Circumstances of the Incident',
  'form.circumstances.placeholder': 'Describe the circumstances of the incident…',
  'form.exposureDescription': 'Nature of Exposure',
  'form.exposureDescription.placeholder': 'Describe the nature of the exposure…',
  'form.protectiveMeasures': 'Protective Measures Taken',
  'form.protectiveMeasures.placeholder': 'Indicate the measures taken…',
  'form.departmentCode': 'Department / Unit',
  'form.departmentCode.placeholder': 'Department code or name (optional)',
  'form.notes': 'Additional Notes',
  'form.notes.placeholder': 'Additional information…',
  'form.required': 'Required',
  'form.optional': 'Optional',
  'form.saveDraft': 'Save Draft',
  'form.submit': 'Submit Declaration',
  'form.saving': 'Saving…',
  'form.submitting': 'Submitting…',
  'form.savedDraft': 'Draft saved',
  'form.disclaimer': 'This declaration is for coordination purposes only. It does not constitute medical advice.',
  'form.step.counter': 'Step {step} of 5',
  'form.step1.title': 'General Information',
  'form.step1.subtitle': 'Date and location of the accidental blood exposure incident.',
  'form.step2.title': 'Exposure Characteristics',
  'form.step2.subtitle': 'Select the nature of the occupational exposure sustained.',
  'form.step3.title': 'Incident Circumstances',
  'form.step3.subtitle': 'Describe the procedure in progress, device involved, and nature of contact.',
  'form.step4.title': 'Protective Measures',
  'form.step4.subtitle': 'Description of measures taken following the exposure (free text).',
  'form.step4.advisory': 'Describe freely any measures you actually took following the exposure.',
  'form.step5.title': 'Summary & Attestation',
  'form.step5.subtitle': 'Review information accuracy before administrative transmission.',
  'form.step.next': 'Continue',
  'form.step.prev': 'Previous',
  'form.autoSaved': 'Draft synced',
  'form.autoSaveFailed': 'Save failed',
  'form.saveDraftError': 'Unable to save draft locally. Your changes remain preserved on screen.',
  'form.summary.title': 'Declaration Summary',
  'form.departmentCode.notSpecified': 'Not specified',
  'form.attestation.label': 'I certify on my honor the accuracy of the information provided above.',
  'form.attestation.subtitle': 'This attestation confirms local recording for OHS and administrative follow-up.',
  'form.attestation.required': 'Please certify the accuracy of the information to submit.',

  'validation.required': 'This field is required',
  'validation.incidentDateRequired': 'Incident date is required',
  'validation.incidentTypeRequired': 'Exposure type is required',
  'validation.incidentDateInvalid': 'Invalid date format (DD/MM/YYYY)',

  'status.draft': 'Draft',
  'status.submitted': 'Submitted',
  'status.under_review': 'Under Review',
  'status.correction_requested': 'Correction Requested',
  'status.resubmitted': 'Response Submitted',
  'status.closed': 'Closed',

  'details.title': 'Declaration',
  'details.refNumber': 'Reference Number',
  'details.status': 'Status',
  'details.incidentDate': 'Incident Date',
  'details.incidentType': 'Exposure Type',
  'details.circumstances': 'Circumstances',
  'details.exposureDescription': 'Nature of Exposure',
  'details.protectiveMeasures': 'Protective Measures',
  'details.departmentCode': 'Department',
  'details.notes': 'Notes',
  'details.createdAt': 'Created',
  'details.submittedAt': 'Submitted',
  'details.editDraft': 'Edit Draft',
  'details.submitDeclaration': 'Submit',
  'details.notSet': 'Not set',
  'details.readOnly': 'This declaration has been submitted and can no longer be edited.',

  'confirm.title': 'Declaration Submitted',
  'confirm.subtitle': 'Your declaration has been recorded locally.',
  'confirm.refNumber': 'Reference:',
  'confirm.message': 'Your declaration has been submitted for administrative review. Keep the reference number for follow-up.',
  'confirm.disclaimer': 'Note: this record is local and is not automatically transmitted. It is not a legally binding document.',
  'confirm.backToList': 'Back to My Declarations',

  'error.generic': 'An error occurred',
  'error.saveFailed': 'Save failed',
  'error.submitFailed': 'Submission failed',
  'error.loadFailed': 'Load failed',

  'role.exposed_professional': 'Exposed Professional',
  'role.admin_reviewer': 'Administrative Reviewer',
  'role.oh_professional': 'Occupational Health Professional',
  'role.quality_staff': 'Quality Staff',
  'role.tech_admin': 'Technical Administrator',

  // Phase 2C.3: Review queue & actions (EN)
  'nav.reviewQueue': 'Administrative Queue',
  'reviewQueue.title': 'Administrative Review Queue',
  'reviewQueue.empty': 'No pending declarations',
  'reviewQueue.emptySubtitle': 'All submitted declarations have been processed or none are pending.',
  'reviewQueue.filterAll': 'All',
  'reviewQueue.filterSubmitted': 'Submitted',
  'reviewQueue.filterUnderReview': 'Under Review',
  'reviewQueue.reviewerBadge': 'Administrative Review Session',
  'reviewQueue.submittedAt': 'Submitted:',
  'reviewQueue.declaredBy': 'Declaring Professional (synthetic):',
  'reviewQueue.openReview': 'Review Declaration',
  'reviewQueue.refresh': 'Refresh',
  'review.title': 'Administrative Review',
  'review.declarationRef': 'Declaration:',
  'review.selectOutcome': 'Administrative Outcome:',
  'review.outcome.acknowledged': 'Declaration Acknowledged',
  'review.outcome.acknowledgedDesc': 'Administrative record received, complete, and logged.',
  'review.outcome.transmission_verified': 'Transmission Verified',
  'review.outcome.transmission_verifiedDesc': 'Chain of transmission verified and occupational health informed.',
  'review.outcome.correction_requested': 'Correction / Supplement Requested',
  'review.outcome.correction_requestedDesc': 'Administrative information incomplete, routed to declarant without altering original.',
  'review.comments': 'Administrative Comments (optional)',
  'review.commentsPlaceholder': 'Administrative notes or transmission observations…',
  'review.correctionReason': 'Correction Reason (required)',
  'review.correctionReasonPlaceholder': 'Specify missing details or corrections needed…',
  'review.submitButton': 'Record Decision',
  'review.submitting': 'Recording…',
  'review.success': 'Administrative decision successfully recorded.',
  'review.confirmTitle': 'Confirm Decision',
  'review.confirmMessage': 'Are you sure you want to record this administrative decision? This action will be logged in the audit journal.',
  'review.confirmButton': 'Confirm',
  'review.cancelButton': 'Cancel',
  'review.historyTitle': 'Review History',
  'review.noHistory': 'No reviews recorded for this declaration.',
  'review.unauthorized': 'Access restricted strictly to the Administrative Reviewer role.',
  'review.notReviewable': 'This declaration is no longer available for administrative review.',
  'review.correctionReasonRequired': 'Correction reason is required when requesting a correction.',
  'review.readOnlyNotice': 'Submitted declarations are read-only. Requesting corrections records a reason without altering the original narrative.',

  // Phase 2C.3.1: Correction Response Workflow (EN)
  'reviewQueue.filterCorrectionRequested': 'Awaiting Declarant',
  'reviewQueue.filterResubmitted': 'Responses Received',
  'details.pendingCorrectionTitle': 'Correction Request Received',
  'details.pendingCorrectionAction': 'Respond to Correction Request',
  'correction.screenTitle': 'Correction Response',
  'correction.requestHeader': 'Administrative Reviewer Request',
  'correction.reasonLabel': 'Correction Reason:',
  'correction.commentsLabel': 'Reviewer Comments:',
  'correction.demoContext': 'Synthetic demonstration data only.',
  'correction.inputLabel': 'Your response / clarifications (required)',
  'correction.inputPlaceholder': 'Provide the requested details or clarifications here…',
  'correction.characterCount': '{count} characters',
  'correction.submitButton': 'Submit Response',
  'correction.submitting': 'Submitting…',
  'correction.confirmTitle': 'Confirm Submission',
  'correction.confirmMessage': 'Do you want to submit this response? Your declaration will be submitted for administrative re-review.',
  'correction.successTitle': 'Response Submitted',
  'correction.successMessage': 'Your response has been successfully recorded and the case is awaiting re-review.',
  'correction.unauthorized': 'Only the declaring professional who owns this declaration may respond.',
  'correction.errorRequired': 'Please enter your response before submitting.',
  'review.declarantResponseHeader': 'Declarant Response:',
  'review.rereviewButton': 'Record Re-Review',
  'reviewAction.declarationSummaryTitle': 'Declaration Summary (Read-Only)',
  'reviewAction.outcome.approvedEffect': 'Resulting status: Under review',
  'reviewAction.outcome.correctionEffect': 'Resulting status: Correction requested',
  'reviewAction.correctionReasonLabel': 'Reason: ',
  'reviewAction.commentsLabel': 'Notes: ',
  'reviewAction.unauthorizedNotice': 'This interface is strictly reserved for administrative reviewers (admin_reviewer).',

  // Phase 2C.4: Occupational-health coordination (EN)
  'oh.nav.queue': "OH Coordination Queue",
  'oh.nav.detail': "Coordination Detail",
  'oh.nav.create': "Create Coordination",
  'oh.queue.title': "Coordination Queue — Occupational Health",
  'oh.queue.empty': "No pending coordinations",
  'oh.queue.emptySubtitle': "There are no coordination records currently awaiting action.",
  'oh.queue.reviewerBadge': "Occupational Health Professional Session (Demo)",
  'oh.queue.reason': "Reason:",
  'oh.queue.openDetail': "View Detail",
  'oh.queue.refresh': "Refresh",
  'oh.create.title': "Create Coordination Record",
  'oh.create.reason': "Coordination Category",
  'oh.create.disclaimer': "This is a local coordination record for demonstration purposes only. It does not constitute an official referral to any medical service.",
  'oh.create.confirm': "Confirm Creation",
  'oh.create.confirmMessage': "Create this demonstration coordination record for the selected declaration?",
  'oh.create.button': "Create Coordination",
  'oh.create.submitting': "Creating…",
  'oh.create.success': "Coordination record created.",
  'oh.detail.title': "Coordination Detail",
  'oh.detail.noReference': 'Reference unavailable',
  'oh.detail.status': "Status",
  'oh.detail.acknowledge': "Acknowledge Receipt",
  'oh.detail.complete': "Mark Follow-Up Complete",
  'oh.detail.completeConfirm': "Confirm Completion",
  'oh.detail.completeConfirmMessage': "Mark this coordination follow-up as complete? This action cannot be undone.",
  'oh.detail.events': "Recorded Follow-Up Events",
  'oh.detail.noEvents': "No follow-up events recorded yet.",
  'oh.detail.addEvent': "Record Follow-Up Event",
  'oh.detail.coordinator': "Initiated by:",
  'oh.detail.declRef': "Declaration reference:",
  'oh.detail.reason': "Coordination reason:",
  'oh.detail.acknowledgedBy': "Acknowledged by:",
  'oh.detail.completedBy': "Completed by:",
  'oh.detail.disclaimer': "DEMONSTRATION PROTOTYPE — This local record is not an official referral. It does not establish a medical or institutional commitment.",
  'oh.event.title': "Record Follow-Up Event",
  'oh.event.category': "Event Category",
  'oh.event.date': "Event Date",
  'oh.event.datePlaceholder': 'YYYY-MM-DD',
  'oh.event.note': "Administrative Note (optional)",
  'oh.event.notePlaceholder': "Brief non-clinical coordination note…",
  'oh.event.submit': "Record Event",
  'oh.event.submitting': "Recording…",
  'oh.status.pending_acknowledgement': "Pending Acknowledgement",
  'oh.status.acknowledged': "Acknowledged",
  'oh.status.completed': "Follow-Up Complete",
  'oh.status.cancelled': "Cancelled",
  'oh.reason.routine_followup': "Routine Follow-Up",
  'oh.reason.serology_monitoring': "Coordinated Serology Monitoring",
  'oh.reason.specialized_evaluation': "Coordinated Specialist Evaluation",
  'oh.reason.other_coordination': "Other Administrative Coordination",
  'oh.event.contact_attempt_recorded': "Contact Attempt Recorded",
  'oh.event.contact_established': "Contact Established",
  'oh.event.appointment_coordinated': "Appointment Coordinated",
  'oh.event.consultation_recorded': "Consultation Recorded",
  'oh.event.follow_up_continued': "Follow-Up Continued",
  'oh.event.follow_up_completed': "Follow-Up Marked Complete",
  'oh.disclaimer.clinical': "This tool makes no clinical decisions. Coordination actions are recorded by an authorized occupational health professional.",
  'oh.error.unauthorized': "Access to this coordination action is not authorized.",
  'oh.error.alreadyActive': "An active coordination record already exists for this declaration.",
  'oh.error.noDeclaration': "Declaration not found.",
  'oh.decl.coordinationStatus': "Occupational Health Coordination Status:",
  'oh.decl.noActiveCoordination': "No active occupational health coordination for this declaration.",
  'oh.decl.createCoordination': "Create Coordination Record",
  // Phase 2E.1.6.1: OH Coordination UI Transformation (EN)
  'oh.queue.tabPending': "Pending Intake",
  'oh.queue.tabAcknowledged': "In Progress",
  'oh.queue.tabCompleted': "Completed",
  'oh.queue.emptyPending': "No coordinations awaiting intake.",
  'oh.queue.emptyAcknowledged': "No coordinations currently in progress.",
  'oh.queue.emptyCompleted': "No completed coordination records.",
  'oh.queue.totalRecords': "Total records:",
  'oh.detail.acknowledgedStatus': "Acknowledged",
  'oh.detail.completedStatus': "Follow-up closed",
  'oh.detail.createdAt': "Initiation date:",
  'oh.detail.updatedAt': "Last updated:",
  'oh.detail.exposedNotice': "This summary reflects the occupational health coordination status for your declaration.",
  'oh.detail.adminNotice': "Read-only administrative view of the coordination initiated for this declaration.",
  'oh.detail.timelineTitle': "Follow-up event timeline",
  'oh.detail.unauthorizedMessage': "You are not authorized to view details of this coordination record.",
  'oh.event.dateInvalid': "Invalid date format. Please use YYYY-MM-DD.",
  'oh.event.charCount': "characters",
  'oh.event.noteDescription': "Administrative non-clinical tracking note only (300 characters max).",
  'oh.create.reasonHelp': "Select the administrative reason justifying this coordination:",
  'oh.create.disclaimerDetail': "This action records an internal administrative coordination request. It does not replace emergency medical care or blood exposure protocols.",

  // Phase 2C.5: Surveillance Dashboard (EN)
  'surveillance.nav.title': "Surveillance Dashboard",
  'surveillance.title': "AES Surveillance & Aggregate Monitoring",
  'surveillance.disclaimer': "SYNTHETIC DEMONSTRATION DATA — This dashboard displays aggregate prototype indicators for technical demonstration. It does not represent validated institutional or official statistics.",
  'surveillance.unauthorized': "Access restricted to authorized personnel (Quality Staff, Admin Reviewer, Occupational Health).",
  'surveillance.roleBadge': "Surveillance & Quality Staff Session (Demo)",
  'surveillance.filters.title': "Surveillance Filters",
  'surveillance.filters.all': "All",
  'surveillance.filters.status': "Status:",
  'surveillance.filters.exposure': "Exposure Type:",
  'surveillance.filters.startDate': "From: YYYY-MM-DD",
  'surveillance.filters.endDate': "To: YYYY-MM-DD",
  'surveillance.filters.clear': "Clear Filters",
  'surveillance.overview.title': "Overview Indicators",
  'surveillance.overview.total': "Total Declarations",
  'surveillance.overview.draft': "Drafts",
  'surveillance.overview.submitted': "Submitted",
  'surveillance.overview.underReview': "Under Review",
  'surveillance.overview.correctionRequested': "Correction Requested",
  'surveillance.overview.resubmitted': "Resubmitted",
  'surveillance.overview.closed': "Closed",
  'surveillance.overview.activeOh': "Active OH Coordinations",
  'surveillance.overview.completedOh': "Completed OH Follow-ups",
  'surveillance.temporal.title': "Declaration Trend Over Time",
  'surveillance.temporal.empty': "No temporal data for the selected criteria.",
  'surveillance.exposure.title': "Exposure Category Distribution",
  'surveillance.exposure.empty': "No exposure records found.",
  'surveillance.status.title': "Declaration Status Distribution",
  'surveillance.admin.title': "Administrative Review Indicators",
  'surveillance.admin.totalReviews': "Total Administrative Reviews",
  'surveillance.admin.correctionRequests': "Correction Requests Issued",
  'surveillance.admin.correctionResponses': "Correction Responses Received",
  'surveillance.admin.outcomes': "Administrative Outcomes",
  'surveillance.oh.title': "Occupational Health Indicators",
  'surveillance.oh.status': "Coordination Statuses",
  'surveillance.oh.events': "Recorded Follow-up Events by Category",

  // Phase 2C.6: Prevention & Corrective-Action Management (EN)
  'prevention.nav.title': "Prevention & CAPA",
  'prevention.title': "Prevention & Corrective/Preventive Actions",
  'prevention.disclaimer': "Demonstration prototype — Synthetic data only. Does not represent validated institutional statistics.",
  'prevention.provisional.disclaimer': "⚠ Provisional categories — institutional validation required before any official use.",
  'prevention.unauthorized': "Access restricted to authorised staff (Quality, Admin Reviewer, Occupational Health).",
  'prevention.overview.title': "Action Overview",
  'prevention.overview.total': "Total Actions",
  'prevention.overview.proposed': "Proposed",
  'prevention.overview.in_progress': "In Progress",
  'prevention.overview.completed': "Completed",
  'prevention.overview.cancelled': "Cancelled",
  'prevention.overview.viewRegister': "View Register",
  'prevention.overview.newAction': "New Action",
  'prevention.register.title': "Action Register",
  'prevention.register.empty': "No actions recorded for these criteria.",
  'prevention.register.filterStatus': "Status",
  'prevention.register.filterType': "Type",
  'prevention.register.filterFactor': "Factor",
  'prevention.register.clearFilters': "Clear",
  'prevention.register.all': "All",
  'prevention.register.retry': "Retry",
  'prevention.register.viewDetails': "View action details",
  'prevention.create.title': "New CAPA Action",
  'prevention.create.subtitle': "Formulate a corrective or preventive measure",
  'prevention.create.actionTitle': "Action Title *",
  'prevention.create.description': "Detailed Description *",
  'prevention.create.action_type': "Measure Type *",
  'prevention.create.corrective': "Corrective",
  'prevention.create.preventive': "Preventive",
  'prevention.create.factor.label': "Contributing Factor (Provisional)",
  'prevention.create.factor.none': "— No Factor —",
  'prevention.create.factor.disclaimer': "⚠ Provisional categories — institutional validation required.",
  'prevention.create.rationale': "Rationale *",
  'prevention.create.target_date': "Target Date (optional, YYYY-MM-DD)",
  'prevention.create.surveillance_reference': "Surveillance Reference (optional)",
  'prevention.create.submit': "Save Action",
  'prevention.create.submitting': "Saving…",
  'prevention.create.success': "Action saved successfully.",
  'prevention.create.retry': "Retry",
  'prevention.create.error': "The action could not be saved. Your information remains available.",
  'prevention.create.denied': "Only quality staff may create CAPA actions.",
  'prevention.create.validation.title': "The title must contain at least 3 characters.",
  'prevention.create.validation.description': "The description must contain at least 5 characters.",
  'prevention.create.validation.rationale': "The rationale must contain at least 5 characters.",
  'prevention.create.validation.targetDate': "The target date must use YYYY-MM-DD format.",
  'prevention.create.validation.surveillanceReference': "The reference must be an aggregate observation, not an individual AES reference.",
  'prevention.create.placeholder.title': "Example: Provision of safety sharps containers",
  'prevention.create.placeholder.description': "Describe the proposed measure",
  'prevention.create.placeholder.rationale': "Explain the rationale for the measure",
  'prevention.create.placeholder.surveillanceReference': "Example: Observation Q3-2026",
  'prevention.detail.title': "Action Detail",
  'prevention.detail.subtitle': "Action information and authorized lifecycle actions",
  'prevention.detail.notFound': "This CAPA action could not be found.",
  'prevention.detail.loadError': "This action could not be loaded. Please retry.",
  'prevention.detail.retry': "Retry",
  'prevention.detail.actionInformation': "Action information",
  'prevention.detail.recordInformation': "Record information",
  'prevention.detail.lifecycleActions': "Lifecycle actions",
  'prevention.detail.referenceCode': "Reference",
  'prevention.detail.status.proposed': "Proposed",
  'prevention.detail.status.in_progress': "In Progress",
  'prevention.detail.status.completed': "Completed",
  'prevention.detail.status.cancelled': "Cancelled",
  'prevention.detail.type.corrective': "Corrective",
  'prevention.detail.type.preventive': "Preventive",
  'prevention.detail.factor': "Contributing Factor",
  'prevention.detail.rationale': "Rationale",
  'prevention.detail.targetDate': "Target Date",
  'prevention.detail.completedAt': "Completed On",
  'prevention.detail.completionNotes': "Completion Note",
  'prevention.detail.start_action': "Start",
  'prevention.detail.complete_action': "Complete",
  'prevention.detail.cancel_action': "Cancel",
  'prevention.detail.completion_note_prompt': "Completion note required (min. 3 characters)",
  'prevention.detail.completionNoteLabel': "Completion note",
  'prevention.detail.cancelNoteLabel': "Cancellation note (optional)",
  'prevention.detail.cancelConfirmation': "Confirm cancellation of this action?",
  'prevention.detail.confirmCancellation': "Confirm cancellation",
  'prevention.detail.keepAction': "Keep action",
  'prevention.detail.transitionError': "The update could not be confirmed. Refresh the action state before retrying.",
  'prevention.detail.refreshRetry': "Refresh action state",
  'prevention.detail.validation.completionNote': "The completion note must contain at least 3 characters.",
  'prevention.detail.auditEmpty': "No audit events have been recorded.",
  'prevention.detail.audit_history': "Change History",
  'prevention.detail.createdAt': "Created On",
  'prevention.detail.updatedAt': "Updated On",
  'prevention.factor.device_safety_design': "Safe device design",
  'prevention.factor.procedure_compliance': "Procedure compliance",
  'prevention.factor.workload_fatigue': "Workload / Fatigue",
  'prevention.factor.waste_disposal_container': "Sharps disposal container",
  'prevention.factor.protective_equipment': "Personal protective equipment",
  'prevention.factor.training_supervision': "Training / Supervision",
  'prevention.factor.environment_workspace': "Environment / Workspace",
  'prevention.factor.other_factor': "Other factor",
  'prevention.factor.none': "Not specified",

  // Phase 2C.7: Unified Demonstration Workspace (EN)
  'workspace.tagline': "Integrated Blood Exposure Incident (AES) Management Platform",
  'workspace.disclaimerTitle': "PFE Demonstration Prototype — Synthetic Data Only",
  'workspace.disclaimerText': "This prototype is designed exclusively for graduation defense (PFE). All data displayed is synthetic and locally generated. No real patient or hospital data is processed. Roles and workflows are simulated in local memory.",
  'workspace.roleSelectorTitle': "Demonstration Role Selector",
  'workspace.roleSelectorSubtitle': "Switch between the 5 roles to view permitted workflows and access boundaries.",
  'workspace.roleDesc.exposed': "Immediate incident reporting, viewing personal declarations, responding to administrative correction requests.",
  'workspace.roleDesc.admin': "Administrative review, requesting corrections, initiating Occupational Health coordination, viewing CAPA.",
  'workspace.roleDesc.oh': "Occupational health management, serological follow-up (HIV/HBV/HCV), follow-up events, SST closure.",
  'workspace.roleDesc.quality': "De-identified epidemiological surveillance, aggregate metrics review, CAPA action plan management.",
  'workspace.roleDesc.tech': "System maintenance, SQLite schema verification and local integrity. Clinical and personal data strictly prohibited.",
  'workspace.correctionActionRequired': "Pending Correction Request",
  'workspace.correctionActionDesc': "The administrative reviewer has requested a correction on one of your declarations. Please provide the required information.",
  'workspace.permittedModulesTitle': "Permitted Modules for this Role",
  'workspace.module.newDeclaration': "Report an AES Incident",
  'workspace.module.newDeclarationDesc': "Step-by-step reporting of a blood exposure incident",
  'workspace.module.myDeclarations': "My Declarations",
  'workspace.module.myDeclarationsDesc': "History and status of your personal incident reports",
  'workspace.module.adminQueue': "Administrative Review Queue",
  'workspace.module.adminQueueDesc': "Review submitted declarations, validate or request corrections",
  'workspace.module.allDeclarations': "Global Declaration Register",
  'workspace.module.allDeclarationsDesc': "Facility-wide administrative overview of all incident declarations",
  'workspace.module.ohQueue': "Occupational Health Queue",
  'workspace.module.ohQueueDesc': "Occupational medical coordination and serological follow-up for exposed staff",
  'workspace.module.surveillanceDashboard': "Epidemiological Surveillance Dashboard",
  'workspace.module.surveillanceDashboardDesc': "De-identified aggregate metrics, trends, exposure types, and filters",
  'workspace.module.preventionOverview': "Prevention & CAPA Overview",
  'workspace.module.preventionOverviewDesc': "Summary metrics for corrective and preventive actions",
  'workspace.module.preventionRegister': "CAPA Action Register",
  'workspace.module.preventionRegisterDesc': "Operational management, status transitions, and action completion",
  'workspace.module.preventionRegisterReadOnly': "Prevention Register (Read-Only)",
  'workspace.module.preventionRegisterReadOnlyDesc': "Consultation of the action register without edit rights",
  'workspace.module.preventionCreate': "Create a CAPA Action",
  'workspace.module.preventionCreateDesc': "Formulate a corrective or preventive action following an improvement observation",
  'workspace.notice.exposedRestrictions': "Boundary: You cannot access declarations of other staff, the quality dashboard, or CAPA management.",
  'workspace.notice.qualityRestrictions': "Privacy protection: You have access to de-identified aggregate indicators and the CAPA register, but no access to identifiable declarations or SST medical records.",
  'workspace.notice.techRestrictions': "Strict isolation: You have access to SQLite diagnostics and technical integrity tools, but no access to clinical or personal data.",
  'workspace.tech.sqliteIntegrity': "Local SQLite Diagnostics",
  'workspace.tech.engine': 'Engine',
  'workspace.tech.schemaVersion': "Schema Version",
  'workspace.tech.fkCheck': "Foreign Key Check (PRAGMA foreign_key_check)",
  'workspace.tech.fkOk': "0 violations detected",
  'workspace.badgePending': "pending",
  'workspace.badgeActive': "active",
  'workspace.badgeIncidents': "AES",
  'workspace.badgeActions': "actions",
  'workspace.scenarioTitle': "Guided Demonstration Scenario (PFE)",
  'workspace.scenarioSubtitle': "Follow these 6 steps to present the complete AES lifecycle to the committee:",
  'workspace.step1.title': "1. Incident Declaration",
  'workspace.step1.desc': "The healthcare professional reports a blood exposure accident immediately after occurrence.",
  'workspace.step2.title': "2. Administrative Review",
  'workspace.step2.desc': "The supervisor or HR officer reviews the report and validates or requests clarification.",
  'workspace.step3.title': "3. Clarification / Correction",
  'workspace.step3.desc': "The professional provides requested clarifications without corrupting the audit trail.",
  'workspace.step4.title': "4. Occupational Health Follow-Up",
  'workspace.step4.desc': "Occupational health manages confidential follow-up and serological monitoring.",
  'workspace.step5.title': "5. Quality Surveillance",
  'workspace.step5.desc': "The quality lead analyzes de-identified epidemiological patterns and indicators.",
  'workspace.step6.title': "6. CAPA Action Plan",
  'workspace.step6.desc': "Definition, monitoring, and completion of corrective actions to prevent recurrence.",
  'workspace.switchRole': "Switch to this role",
  'workspace.activeRoleIndicator': "Active Role",

  // ─── Phase 2D.1: Help Centre & Glossary ───
  'helpGlossary.title': "Help Centre & Glossary",
  'helpGlossary.subtitle': "Documentation, terminology, and reference guides for the demonstration",
  'helpGlossary.tabHelp': "Help Centre",
  'helpGlossary.tabGlossary': "AES Glossary",
  'helpGlossary.disclaimer': "This application is an academic demonstration prototype using synthetic data exclusively. It does not replace institutional protocols, professional medical advice, or official care procedures.",
  'helpGlossary.searchPlaceholder': "Search for a term or definition…",
  'helpGlossary.clearSearch': "Clear search",
  'helpGlossary.categoryAll': "All",
  'helpGlossary.categoryExposure': "Exposure",
  'helpGlossary.categoryDeclaration': "Declaration",
  'helpGlossary.categoryAdmin': "Administrative",
  'helpGlossary.categoryOH': "Occupational Health",
  'helpGlossary.categoryQuality': "Quality & CAPA",
  'helpGlossary.emptySearch': "No terms matched your search.",
  'helpGlossary.backToWorkspace': "Back to Workspace",

  // Help Sections (1 to 8)
  'help.section1.title': "1. Introduction to AES Guardian",
  'help.section1.content': "AES Guardian is an integrated demonstration prototype for reporting, administrative review, occupational-health coordination, and epidemiological surveillance of blood and body fluid exposures. Designed for an academic graduation project (PFE), it demonstrates a complete, secure workflow operating fully offline via native SQLite.",
  'help.section2.title': "2. Understanding the Declaration Workflow",
  'help.section2.content': "When a healthcare worker suffers an occupational exposure (needlestick, cut, splash), they immediately submit a digital declaration. The form records the timestamp, department, and factual circumstances without containing patient identifiers. Once submitted, the declaration can no longer be edited and enters the administrative verification queue.",
  'help.section3.title': "3. Understanding Administrative Review",
  'help.section3.content': "The HR administrator or nurse supervisor inspects incoming declarations for compliance. Three outcomes are supported: formal acknowledgment, verification of transmission to Occupational Health, or requesting clarification from the declarant. In case of correction, the declarant can submit a response without altering the original record.",
  'help.section4.title': "4. Understanding Occupational-Health Coordination",
  'help.section4.content': "The Occupational Health service ensures medical-occupational follow-up for the exposed worker. Follow-up milestones (contact attempt, consultation, serology monitoring, completion) are tracked as neutral administrative events without exposing private clinical narratives or diagnoses to the wider hospital.",
  'help.section5.title': "5. Understanding Epidemiological Surveillance",
  'help.section5.content': "The Quality Manager accesses de-identified statistical indicators: monthly incident counts, exposure type breakdowns, high-risk departments, and resolution rates. No access to individual healthcare worker identities is permitted within this view.",
  'help.section6.title': "6. Understanding CAPA Prevention Management",
  'help.section6.content': "Identified risk patterns feed into the Corrective and Preventive Action (CAPA) register. Each action targets a verified contributing factor (safety equipment, procedure compliance, waste disposal containers, training) to eliminate root causes and prevent recurrence.",
  'help.section7.title': "7. Understanding the 5 Synthetic Roles",
  'help.section7.content': "The application strictly compartmentalizes permissions: Exposed Professional (declaration and own records), Admin Reviewer (compliance and referral), OH Professional (confidential follow-up), Quality Staff (de-identified surveillance and CAPA), and Tech Admin (local database maintenance without healthcare data access).",
  'help.section8.title': "8. Prototype Privacy & Limitations",
  'help.section8.content': "This prototype runs strictly locally on-device using synthetic data. It is not a medical device, provides no diagnostic determinations, and offers no therapeutic or dosing recommendations.",

  // Glossary Terms (1 to 14)
  'glossary.term1.term': "AES (Blood & Body Fluid Exposure)",
  'glossary.term1.category': "Exposure",
  'glossary.term1.definition': "Any accidental contact with blood or biological fluids contaminated with blood, occurring via percutaneous injury (needlestick, cut) or projection onto a mucous membrane or broken skin.",
  'glossary.term2.term': "Percutaneous Exposure",
  'glossary.term2.category': "Exposure",
  'glossary.term2.definition': "Penetrating skin injury caused by a hollow-bore needle, trocar, scalpel blade, or any soiled sharp instrument.",
  'glossary.term3.term': "Mucocutaneous Exposure",
  'glossary.term3.category': "Exposure",
  'glossary.term3.definition': "Accidental splashing or contact of blood or bodily fluid onto mucous membranes, primarily ocular (eyes) or oral (mouth).",
  'glossary.term4.term': "Broken Skin Exposure",
  'glossary.term4.category': "Exposure",
  'glossary.term4.definition': "Skin area with pre-existing cuts, abrasion, dermatitis, or open wounds coming into contact with potentially contaminated biological fluid.",
  'glossary.term5.term': "Declaration",
  'glossary.term5.category': "Declaration",
  'glossary.term5.definition': "Initial digital record of the exposure submitted by the exposed professional, recording factual circumstances without disclosing patient personal data.",
  'glossary.term6.term': "Administrative Review",
  'glossary.term6.category': "Administrative",
  'glossary.term6.definition': "Compliance evaluation conducted by an HR administrator or supervisor to validate the declaration and initiate necessary operational follow-up.",
  'glossary.term7.term': "Occupational-Health Coordination",
  'glossary.term7.category': "Occupational Health",
  'glossary.term7.definition': "Confidential process ensuring regulatory and preventive follow-up of the exposed healthcare professional by occupational-health physicians.",
  'glossary.term8.term': "Serology Monitoring",
  'glossary.term8.category': "Occupational Health",
  'glossary.term8.definition': "Biological laboratory tests (notably HIV, HBV, HCV) used in occupational-health follow-up monitoring after a blood or body-fluid exposure. This application records the administrative milestones of such monitoring; it does not schedule or prescribe tests.",
  'glossary.term9.term': "Epidemiological Surveillance",
  'glossary.term9.category': "Quality & CAPA",
  'glossary.term9.definition': "Systematic, aggregated analysis of reported incidents to detect risk trends and guide organizational prevention policies.",
  'glossary.term10.term': "De-identification",
  'glossary.term10.category': "Quality & CAPA",
  'glossary.term10.definition': "Privacy safeguard ensuring that statistical reports decouple incident metrics from any direct or indirect worker identifying data.",
  'glossary.term11.term': "Contributing Factor",
  'glossary.term11.category': "Quality & CAPA",
  'glossary.term11.definition': "Organizational, procedural, equipment-related, or environmental condition that facilitated the occurrence or worsened the severity of an incident.",
  'glossary.term12.term': "CAPA (Corrective & Preventive Actions)",
  'glossary.term12.category': "Quality & CAPA",
  'glossary.term12.definition': "Quality management process aimed at eliminating root causes of systemic hazards to prevent incident recurrence.",
  'glossary.term13.term': "Follow-Up Event",
  'glossary.term13.category': "Occupational Health",
  'glossary.term13.definition': "Timestamped, neutral milestone tracking an occupational health coordination step without exposing private medical details.",
  'glossary.term14.term': "Audit Log",
  'glossary.term14.category': "Administrative",
  'glossary.term14.definition': "Chronological local record of system operations maintained during the prototype demonstration. Note: this record can be cleared by a demonstration data reset.",

  // ─── Phase 2D.1: Demonstrator Profile & Settings ───
  'profile.title': "Demonstrator Profile & Settings",
  'profile.subtitle': "Manage active synthetic account, system preferences, and local maintenance",
  'profile.accountSection': "Active Demonstration Account",
  'profile.roleSection': "Switch Synthetic Demonstration Role",
  'profile.permissionsSection': "Permissions & Access Boundaries",
  'profile.authorizedCapabilities': "Authorized Capabilities",
  'profile.restrictedCapabilities': "Strictly Prohibited Actions",
  'profile.demoAccountNotice': "In-memory synthetic demonstration account. No persistent session or credentials required.",
  'profile.languageSection': "Application Language",
  'profile.languageSelectorTitle': "Select runtime language:",
  'profile.rtlNotice': "Note: Complete right-to-left (RTL) mirror layout for Arabic will be finalized in an upcoming release.",
  'profile.navigationSection': "Documentation & Resources",
  'profile.helpCenterLink': "Help Centre & Guided Workflow",
  'profile.glossaryLink': "AES Terminology Glossary",
  'profile.guidedTourLink': "Guided tour and introduction",
  'profile.privacySection': "Privacy & Ethical Boundaries",
  'profile.privacyContent': "This prototype operates strictly with local synthetic data. No real personal or clinical information is stored. Surveillance data presented to Quality staff is de-identified by design.",
  'profile.aboutSection': "About the Prototype",
  'profile.appNameLabel': "Application: AES Guardian (Sanad Module)",
  'profile.dbEngineLabel': "Database: SQLite (@op-engineering/op-sqlite)",
  'profile.maintenanceSection': "Technical Maintenance (tech_admin)",
  'profile.error.techAdminOnly': "Only the technical administrator can perform this operation.",
  'profile.error.userIdMissing': "Cannot reset without an active account context.",

  // Role capability items for profile
  'profile.cap.declare': "Submit new AES declarations and manage drafts",
  'profile.cap.myDeclarations': "View status and history of own declarations",
  'profile.cap.respondCorrection': "Respond to administrative clarification requests",
  'profile.cap.adminReview': "Process administrative queue and record review decisions",
  'profile.cap.initiateOH': "Initiate referral coordination to Occupational Health",
  'profile.cap.ohCoordination': "Acknowledge and manage OH coordination cases",
  'profile.cap.ohFollowUp': "Record serology monitoring milestones and close cases",
  'profile.cap.surveillanceDashboard': "Consult de-identified aggregate surveillance metrics",
  'profile.cap.preventionRegister': "Consult the CAPA prevention register in read-only mode",
  'profile.cap.manageCapa': "Create, track, and close corrective and preventive actions",
  'profile.cap.techMaintenance': "Verify SQLite schema integrity and reset demonstration dataset",
  'profile.restr.noSurveillance': "Access to epidemiological surveillance dashboard denied",
  'profile.restr.noCapa': "Creating or managing CAPA actions not permitted",
  'profile.restr.noOtherDeclarations': "Viewing declarations filed by other workers strictly prohibited",
  'profile.restr.noClinicalContent': "Access to clinical notes or personal health records strictly prohibited",
  'profile.restr.noAdminQueue': "Access to administrative review queue denied",
  'profile.restr.noIdentifiableData': "Access to identifiable healthcare worker identities refused",

  // ─── Phase 2D.1: Secure Data Reset ───
  'reset.sectionTitle': "Synthetic Demonstration Data Reset",
  'reset.sectionDesc': "Maintenance action reserved exclusively for tech_admin. Clears user modifications and restores the pristine baseline demonstration dataset.",
  'reset.buttonLabel': "Reset Demonstration Data",
  'reset.dialog1Title': "Reset Demonstration Data?",
  'reset.dialog1Message': "This operation will erase all added declarations, reviews, follow-up events, and CAPA actions to restore the pristine baseline scenario (4 declarations, 5 CAPAs). This action cannot be undone.",
  'reset.dialog1Cancel': "Cancel",
  'reset.dialog1Continue': "Continue…",
  'reset.dialog2Title': "Final Confirmation",
  'reset.dialog2Message': "Are you absolutely sure you want to reset the local demonstration database now?",
  'reset.dialog2Cancel': "Cancel",
  'reset.dialog2Confirm': "Confirm Reset",
  'reset.inProgress': "Resetting demonstration database…",
  'reset.successTitle': "Reset Completed",
  'reset.successMessage': "The demonstration scenario has been restored.",
  'reset.errorTitle': "Reset Failed",
  'reset.errorMessage': "An error occurred during atomic reset execution:",

  // ─── Phase 2D.2: In-App Notifications (11 Canonical Events) ───
  'notification.declarationSubmitted.title': "New Declaration Submitted",
  'notification.declarationSubmitted.message': "Declaration {reference} has been registered and is pending administrative review.",
  'notification.reviewCompleted.title': "Administrative Review Completed",
  'notification.reviewCompleted.message': "The administrative review for your declaration {reference} has been completed.",
  'notification.correctionRequested.title': "Correction Requested",
  'notification.correctionRequested.message': "Clarifications are required for your declaration {reference}.",
  'notification.correctionSubmitted.title': "Correction Response Submitted",
  'notification.correctionSubmitted.message': "The declarant has submitted corrections for declaration {reference}.",
  'notification.ohCoordinationCreated.title': "New Occupational Health Case",
  'notification.ohCoordinationCreated.message': "A new occupational health coordination case has been opened for declaration {reference}.",
  'notification.ohCoordinationAcknowledged.title': "Occupational Health Case Acknowledged",
  'notification.ohCoordinationAcknowledged.message': "The occupational health service has acknowledged your case {reference}.",
  'notification.ohMilestoneRecorded.title': "Follow-Up Milestone Recorded",
  'notification.ohMilestoneRecorded.message': "A follow-up milestone has been recorded for your case {reference}.",
  'notification.ohCoordinationCompleted.title': "Occupational Health Case Closed",
  'notification.ohCoordinationCompleted.message': "The occupational health follow-up for your declaration {reference} is now closed.",
  'notification.capaCreated.title': "Prevention Action Created",
  'notification.capaCreated.message': "Prevention action {reference} has been registered in the CAPA register.",
  'notification.capaStatusChanged.title': "CAPA Status Updated",
  'notification.capaStatusChanged.message': "The status of prevention action {reference} has been updated.",
  'notification.capaFinalized.title': "Prevention Action Finalized",
  'notification.capaFinalized.message': "Prevention action {reference} has been finalized in the CAPA register.",

  // ─── Phase 2D.2G: Notification Centre UI ───
  'notificationCentre.title': "Notification Centre",
  'notificationCentre.empty': "No notifications",
  'notificationCentre.emptySubtitle': "You have no notifications at this time.",
  'notificationCentre.markAllRead': "Mark all as read",
  'notificationCentre.markAllReadConfirm': "Mark all notifications as read?",
  'notificationCentre.confirm': "Confirm",
  'notificationCentre.cancel': "Cancel",
  'notificationCentre.retry': "Retry",
  'notificationCentre.unread': "Unread",
  'notificationCentre.read': "Read",
  'notificationCentre.today': "Today",
  'notificationCentre.yesterday': "Yesterday",
  'notificationCentre.tapToOpen': "Tap to open",
  'notificationCentre.errorLoad': "Unable to load notifications.",
  'notificationCentre.errorNavigation': "Destination not found or access denied.",
  'notificationCentre.errorStale': "This notification may be outdated or you no longer have access.",
  'notificationCentre.techAdminRestricted': "Technical administrators do not have access to operational notifications.",
  'notificationCentre.a11y.unreadBadge': "Unread notifications",
  'notificationCentre.a11y.notificationItem': "Notification",
  'notificationCentre.a11y.markAllRead': "Mark all notifications as read",

  // ─── Phase 2E.1.2: Batch 2 Onboarding & Synthetic Demo Entry (EN) ───
  'splash.wordmark': 'AES Guardian',
  'splash.subtitle': 'Hospital Blood Exposure Governance',
  'splash.enter': 'Enter Workspace',
  'onboarding.lang.overline': 'SYSTEM LANGUAGE',
  'onboarding.lang.title': 'Choose your language',
  'onboarding.lang.subtitle': 'Select the display language for the hospital demonstration prototype.',
  'onboarding.continue': 'Continue',
  'onboarding.carousel.skip': 'Skip',
  'onboarding.carousel.start': 'Get Started',
  'onboarding.carousel.next': 'Next',
  'onboarding.carousel.slide1.title': 'Fast & Protected Declaration',
  'onboarding.carousel.slide1.desc': 'Structured 5-step incident declaration workflow immediately upon exposure, with local draft saving.',
  'onboarding.carousel.slide1.bullet1': 'Local draft preservation',
  'onboarding.carousel.slide1.bullet2': 'Structured 5-step guided form',
  'onboarding.carousel.slide1.bullet3': 'Guided resumption of in-progress drafts',
  'onboarding.carousel.slide2.title': 'Confidential OH Coordination',
  'onboarding.carousel.slide2.desc': 'Occupational health coordination tracking with role-based data minimization and protected medical notes.',
  'onboarding.carousel.slide2.bullet1': 'Follow-up notes reserved for occupational health',
  'onboarding.carousel.slide2.bullet2': 'Tracking of post-exposure coordination milestones',
  'onboarding.carousel.slide2.bullet3': 'Restricted status projection for the exposed professional',
  'onboarding.carousel.slide3.title': 'Surveillance & Prevention',
  'onboarding.carousel.slide3.desc': 'Aggregated statistical metrics without personal identifiers and local register of corrective and preventive actions (CAPA).',
  'onboarding.carousel.slide3.bullet1': 'Aggregated metrics without personal identifiers',
  'onboarding.carousel.slide3.bullet2': 'Structured register of preventive actions (CAPA)',
  'onboarding.carousel.slide3.bullet3': 'Strict role-based access partitioning',
  'onboarding.disclaimer.title': 'Warning — Demonstration Prototype',
  'onboarding.disclaimer.badge': 'ACADEMIC PFE PROTOCOL',
  'onboarding.disclaimer.p1': '1. This software is an academic graduation project (PFE) prototype. All data, incidents, personnel, and IDs are 100% synthetic.',
  'onboarding.disclaimer.p2': '2. No real medical data is stored or transmitted. The system operates strictly offline on a local SQLite database.',
  'onboarding.disclaimer.p3': '3. This application is not a certified medical device and does not perform autonomous clinical triage or drug prescription.',
  'onboarding.disclaimer.p4': '4. This prototype does not replace emergency medical care. In case of actual exposure, immediately follow your institution\'s emergency protocol and consult emergency medical services without delay.',
  'onboarding.disclaimer.checkbox': 'I understand the academic nature of the prototype and the synthetic nature of the data.',
  'onboarding.disclaimer.accept': 'Accept and Continue',
  'onboarding.picker.title': 'Demonstration Accounts',
  'onboarding.picker.subtitle': 'Select one of the 5 canonical roles to explore operational workflows and authorization boundaries.',
  'onboarding.picker.syntheticNotice': 'Local synthetic accounts with no password. Identifiers (e.g. NURSE-001) are demonstration codes for evaluators.',
  'onboarding.picker.enter': 'Enter Workspace',
  'onboarding.picker.role1.code': 'NURSE-001',
  'onboarding.picker.role1.title': 'Exposed Healthcare Professional',
  'onboarding.picker.role1.desc': 'AES incident declaration and tracking of own records.',
  'onboarding.picker.role2.code': 'ADMIN-001',
  'onboarding.picker.role2.title': 'Nurse Supervisor / Nursing Directorate',
  'onboarding.picker.role2.desc': 'Administrative review, correction requests, and validation.',
  'onboarding.picker.role3.code': 'OCC-001',
  'onboarding.picker.role3.title': 'Occupational Health (OH)',
  'onboarding.picker.role3.desc': 'Clinical follow-up and administrative management of post-exposure coordination.',
  'onboarding.picker.role4.code': 'QUAL-001',
  'onboarding.picker.role4.title': 'Quality & Risk Management',
  'onboarding.picker.role4.desc': 'Aggregated epidemiological surveillance and CAPA corrective actions.',
  'onboarding.picker.role5.code': 'ADMIN-TECH',
  'onboarding.picker.role5.title': 'Technical Administrator',
  'onboarding.picker.role5.desc': 'Prototype diagnostics and synthetic demonstration data reset.',

  // ─── Phase 2E.1.4.3: Batch 4 Declaration List & Details ───
  'list.filter.all': 'All',
  'list.filter.draft': 'Drafts',
  'list.filter.submitted': 'Submitted',
  'list.filter.under_review': 'Under Review',
  'list.filter.closed': 'Closed',
  'list.adminQueueShortcut': 'Review Queue',
  'list.restrictedTitle': 'Restricted Access',
  'list.restrictedMessage': 'Your role does not permit access to the declaration list.',
  'list.incidentType': 'Exposure Type',
  'list.title.admin': 'All Declarations',
  'details.tab.summary': 'Summary',
  'details.tab.incident': 'Incident',
  'details.tab.measures': 'Measures',
  'details.tab.status': 'Status',
  'details.tab.followup': 'Follow-up',
  'details.followup.noCoordination': 'No occupational health follow-up recorded.',
  'details.followup.coordinationStatus': 'Follow-up Status',
  'details.followup.coordinationDate': 'Initiated',
  'details.followup.updatedAt': 'Updated',
  'details.followup.adminSummary': 'Coordination Summary (Administrative)',
  'details.followup.reason': 'Coordination Reason',
  'details.followup.acknowledgedAt': 'Acknowledged',
  'details.followup.completedAt': 'Completed',
  'details.restrictedAccess': 'Unauthorized Access',
  'details.notFound': 'Declaration not found.',
  'details.reviewHistory': 'Review History',
  'details.reviewAction': 'Review Declaration',
  'details.createCoordination': 'Initiate OH Follow-up',
  'details.respondToCorrection': 'Respond to Correction Request',
  'details.correctionPending': 'A correction has been requested for this declaration.',
};

const ar: TranslationMap = {
  // Extra keys
  'navigation.back': 'رجوع',
  'workspace.nav.title': 'مساحة AES Guardian',
  'prevention.create.acknowledgement.confirm': 'تأكيد العرض',
  'prevention.create.acknowledgement.inProgress': 'جاري تأكيد العرض...',
  'prevention.create.acknowledgement.error': 'خطأ أثناء تأكيد العرض',
  'prevention.create.result.title': 'تم إنشاء إجراء الوقاية',
  'prevention.create.result.recovery': 'استرداد الإجراء المنشأ',
  'prevention.create.uncertain': 'إنشاء غير مؤكد - الحالة معلقة',
  'prevention.create.reconcileAbsent': 'لم يتم العثور على الإجراء أثناء المطابقة',
  'prevention.create.reference': 'المرجع',
  'prevention.create.reconcile': 'مطابقة',
  'surveillance.filters.declarationCountLabel': 'عدد التصريحات',
  'surveillance.status.empty': 'لا توجد بيانات مراقبة متاحة',
  // REQUIRES_VALIDATION: Arabic translations should be reviewed by a qualified professional.
  'app.name': 'حارس AES',
  'app.loading': '…جارٍ التحميل',
  'app.back': 'رجوع',
  'app.ok': 'حسنًا',
  'app.offline': 'غير متصل — البيانات المحلية متاحة',
  'db.initializing': '…جارٍ تهيئة قاعدة البيانات',
  'db.ready': 'قاعدة البيانات جاهزة',
  'db.error': 'خطأ في قاعدة البيانات',

  'nav.declarations': 'تصريحات AES',
  'nav.newDeclaration': 'تصريح جديد',
  'nav.declarationDetails': 'تفاصيل التصريح',
  'nav.back': 'رجوع',

  'list.title': 'تصريحاتي',
  'list.empty': 'لا توجد تصريحات',
  'list.emptySubtitle': 'اضغط على الزر أدناه لإنشاء أول تصريح.',
  'list.newButton': 'تصريح جديد',
  'list.refNumber': 'المرجع',
  'list.refUnavailable': 'المرجع غير متاح',
  'list.incidentDate': 'تاريخ الحادثة',
  'list.status': 'الحالة',

  'form.title.new': 'تصريح AES جديد',
  'form.title.edit': 'تعديل المسودة',
  'form.unauthorized': 'هذه الشاشة مخصصة للممارس الذي أبلغ عن الحادث.',
  'form.incidentDate': 'تاريخ ووقت الحادثة',
  'form.incidentDate.placeholder': 'يي/شش/سسسس',
  'form.incidentType': 'نوع التعرض',
  'form.incidentType.placeholder': 'اختر نوع التعرض',
  'form.incidentType.percutaneous': 'حادث جلدي (وخز إبرة / جرح)',
  'form.incidentType.percutaneous.desc': 'وخز إبرة، أو جرح بمشرط، أو اختراق جلدي ملوث',
  'form.incidentType.mucocutaneous': 'تناثر على الأغشية المخاطية أو الجلد',
  'form.incidentType.mucocutaneous.desc': 'تناثر سوائل بيولوجية على الأغشية المخاطية (العين، الفم) أو الجلد المصاب',
  'form.incidentType.sexual_assault': 'اعتداء جنسي',
  'form.incidentType.sexual_assault.desc': 'حالة تعرض خاصة تتطلب بروتوكول طوارئ مخصص',
  'form.incidentType.other': 'أخرى (يرجى الوصف في خانة الملابسات)',
  'form.incidentType.other.desc': 'حالة أخرى من حالات التعرض المهني العرضي للدم',
  'form.circumstances': 'ملابسات الحادثة',
  'form.circumstances.placeholder': '…صف ملابسات الحادثة',
  'form.exposureDescription': 'طبيعة التعرض',
  'form.exposureDescription.placeholder': '…صف طبيعة التعرض',
  'form.protectiveMeasures': 'التدابير الوقائية المتخذة',
  'form.protectiveMeasures.placeholder': '…أشر إلى التدابير المتخذة',
  'form.departmentCode': 'القسم / الوحدة',
  'form.departmentCode.placeholder': 'رمز القسم أو اسمه (اختياري)',
  'form.notes': 'ملاحظات إضافية',
  'form.notes.placeholder': '…معلومات إضافية',
  'form.required': 'مطلوب',
  'form.optional': 'اختياري',
  'form.saveDraft': 'حفظ المسودة',
  'form.submit': 'تقديم التصريح',
  'form.saving': '…جارٍ الحفظ',
  'form.submitting': '…جارٍ التقديم',
  'form.savedDraft': 'تم حفظ المسودة',
  'form.disclaimer': 'هذا التصريح مخصص لأغراض التنسيق فقط. لا يمثل استشارة طبية.',
  'form.step.counter': 'الخطوة {step} من 5',
  'form.step1.title': 'معلومات عامة',
  'form.step1.subtitle': 'تاريخ ومكان وقوع حادث التعرض المهني للدم.',
  'form.step2.title': 'خصائص التعرض',
  'form.step2.subtitle': 'حدد طبيعة التعرض المهني الذي حدث.',
  'form.step3.title': 'ملابسات الحادثة',
  'form.step3.subtitle': 'صف الإجراء الجاري، والأداة المستخدمة، وطبيعة الاتصال.',
  'form.step4.title': 'تدابير الوقاية',
  'form.step4.subtitle': 'وصف التدابير المتخذة إثر التعرض (نص حر).',
  'form.step4.advisory': 'صِف بحرية التدابير التي اتخذتها فعلياً بعد التعرض.',
  'form.step5.title': 'ملخص وإقرار',
  'form.step5.subtitle': 'تحقق من صحة المعلومات قبل الإرسال الإداري.',
  'form.step.next': 'متابعة',
  'form.step.prev': 'السابق',
  'form.autoSaved': 'تمت مزامنة المسودة',
  'form.autoSaveFailed': 'فشل الحفظ',
  'form.saveDraftError': 'تعذر حفظ المسودة محلياً. التعديلات ما زالت محفوظة على الشاشة.',
  'form.summary.title': 'ملخص التصريح',
  'form.departmentCode.notSpecified': 'غير محدد',
  'form.attestation.label': 'أقر بصحة المعلومات المصرح بها أعلاه.',
  'form.attestation.subtitle': 'يؤكد هذا الإقرار التسجيل المحلي للمتابعة الإدارية والصحة المهنية.',
  'form.attestation.required': 'يرجى الإقرار بصحة المعلومات لتقديم التصريح.',

  'validation.required': 'هذا الحقل مطلوب',
  'validation.incidentDateRequired': 'تاريخ الحادثة مطلوب',
  'validation.incidentTypeRequired': 'نوع التعرض مطلوب',
  'validation.incidentDateInvalid': 'صيغة التاريخ غير صالحة (يي/شش/سسسس)',

  'status.draft': 'مسودة',
  'status.submitted': 'مُقدَّم',
  'status.under_review': 'قيد المراجعة',
  'status.correction_requested': 'طلب تصحيح',
  'status.resubmitted': 'تم إرسال الرد',
  'status.closed': 'مغلق',

  'details.title': 'التصريح',
  'details.refNumber': 'الرقم المرجعي',
  'details.status': 'الحالة',
  'details.incidentDate': 'تاريخ الحادثة',
  'details.incidentType': 'نوع التعرض',
  'details.circumstances': 'الملابسات',
  'details.exposureDescription': 'طبيعة التعرض',
  'details.protectiveMeasures': 'التدابير الوقائية',
  'details.departmentCode': 'القسم',
  'details.notes': 'ملاحظات',
  'details.createdAt': 'تاريخ الإنشاء',
  'details.submittedAt': 'تاريخ التقديم',
  'details.editDraft': 'تعديل المسودة',
  'details.submitDeclaration': 'تقديم',
  'details.notSet': 'غير محدد',
  'details.readOnly': 'تم تقديم هذا التصريح ولا يمكن تعديله.',

  'confirm.title': 'تم تقديم التصريح',
  'confirm.subtitle': 'تم تسجيل تصريحك محليًا.',
  'confirm.refNumber': 'المرجع:',
  'confirm.message': 'تم تقديم تصريحك للمراجعة الإدارية. احتفظ بالرقم المرجعي للمتابعة.',
  'confirm.disclaimer': 'ملاحظة: هذا السجل محلي ولا يُرسَل تلقائيًا. وهو غير ملزم قانونيًا.',
  'confirm.backToList': 'العودة إلى تصريحاتي',

  'error.generic': 'حدث خطأ',
  'error.saveFailed': 'فشل الحفظ',
  'error.submitFailed': 'فشل التقديم',
  'error.loadFailed': 'فشل التحميل',

  'role.exposed_professional': 'المهني المعرَّض',
  'role.admin_reviewer': 'المراجع الإداري',
  'role.oh_professional': 'طبيب الصحة المهنية',
  'role.quality_staff': 'موظف الجودة',
  'role.tech_admin': 'المسؤول التقني',

  // Phase 2C.3: Review queue & actions (AR)
  'nav.reviewQueue': 'قائمة المراجعة الإدارية',
  'reviewQueue.title': 'مراجعة تصريحات AES',
  'reviewQueue.empty': 'لا توجد تصريحات معلقة',
  'reviewQueue.emptySubtitle': 'تمت معالجة جميع التصريحات المُقدَّمة أو لا توجد تصريحات في الانتظار.',
  'reviewQueue.filterAll': 'الكل',
  'reviewQueue.filterSubmitted': 'المُقدَّمة',
  'reviewQueue.filterUnderReview': 'قيد المراجعة',
  'reviewQueue.reviewerBadge': 'جلسة المراجعة الإدارية',
  'reviewQueue.submittedAt': 'تاريخ التقديم:',
  'reviewQueue.declaredBy': 'المصرّح (افتراضي):',
  'reviewQueue.openReview': 'مراجعة التصريح',
  'reviewQueue.refresh': 'تحديث',
  'review.title': 'المعالجة الإدارية',
  'review.declarationRef': 'التصريح:',
  'review.selectOutcome': 'القرار الإداري:',
  'review.outcome.acknowledged': 'تم استلام التصريح وتأكيده',
  'review.outcome.acknowledgedDesc': 'تم استلام الملف الإداري والتأكد من اكتماله وتسجيله.',
  'review.outcome.transmission_verified': 'تم التحقق من مسار الإرسال',
  'review.outcome.transmission_verifiedDesc': 'تم التحقق من مسار الإرسال وإبلاغ طب العمل.',
  'review.outcome.correction_requested': 'طلب تصحيح / استكمال',
  'review.outcome.correction_requestedDesc': 'البيانات الإدارية غير مكتملة، طلب استكمال دون تعديل التصريح الأصلي.',
  'review.comments': 'ملاحظات إدارية (اختياري)',
  'review.commentsPlaceholder': '…ملاحظات إدارية أو توجيهات',
  'review.correctionReason': 'سبب طلب التصحيح (مطلوب)',
  'review.correctionReasonPlaceholder': '…حدد البيانات الناقصة أو المطلوب تصحيحها',
  'review.submitButton': 'تسجيل القرار',
  'review.submitting': '…جارٍ التسجيل',
  'review.success': 'تم تسجيل القرار الإداري بنجاح.',
  'review.confirmTitle': 'تأكيد القرار',
  'review.confirmMessage': 'هل أنت متأكد من تسجيل هذا القرار الإداري؟ سيتم تقييد الإجراء في سجل التدقيق.',
  'review.confirmButton': 'تأكيد',
  'review.cancelButton': 'إلغاء',
  'review.historyTitle': 'سجل المراجعات',
  'review.noHistory': 'لا توجد مراجعات مسجلة لهذا التصريح.',
  'review.unauthorized': 'الوصول مقتصر حصريًا على المراجع الإداري.',
  'review.notReviewable': 'لم يعد هذا التصريح متاحاً للمراجعة الإدارية.',
  'review.correctionReasonRequired': 'سبب التصحيح مطلوب عند طلب تصحيح.',
  'review.readOnlyNotice': 'التصريحات المُقدَّمة للقراءة فقط. طلب التصحيح يسجل سببًا دون المساس بالبيانات الأصلية.',

  // Phase 2C.3.1: Correction Response Workflow (AR)
  'reviewQueue.filterCorrectionRequested': 'في انتظار المصرّح',
  'reviewQueue.filterResubmitted': 'ردود مستلمة',
  'details.pendingCorrectionTitle': 'تم استلام طلب التصحيح',
  'details.pendingCorrectionAction': 'الرد على طلب التصحيح',
  'correction.screenTitle': 'الرد على طلب التصحيح',
  'correction.requestHeader': 'طلب التصحيح من المراجع الإداري',
  'correction.reasonLabel': 'سبب طلب التصحيح:',
  'correction.commentsLabel': 'ملاحظات المراجع:',
  'correction.demoContext': 'بيانات تجريبية اصطناعية فقط.',
  'correction.inputLabel': 'ردّك / توضيحاتك (مطلوب)',
  'correction.inputPlaceholder': '…اكتب التفاصيل المطلوبة أو توضيحاتك هنا',
  'correction.characterCount': '{count} حرف',
  'correction.submitButton': 'إرسال الرد',
  'correction.submitting': '…جارٍ الإرسال',
  'correction.confirmTitle': 'تأكيد الإرسال',
  'correction.confirmMessage': 'هل تريد إرسال هذا الرد؟ سيُعاد تقديم تصريحك للمراجعة الإدارية مجدداً.',
  'correction.successTitle': 'تم إرسال الرد',
  'correction.successMessage': 'تم تسجيل ردّك بنجاح والملف الآن في انتظار إعادة المراجعة الإدارية.',
  'correction.unauthorized': 'المهني صاحب التصريح هو المخول الوحيد بالرد.',
  'correction.errorRequired': 'يرجى كتابة ردّك قبل الإرسال.',
  'review.declarantResponseHeader': 'رد المُصرّح:',
  'review.rereviewButton': 'تسجيل إعادة المراجعة',
  'reviewAction.declarationSummaryTitle': 'ملخص الإخطار (للقراءة فقط)',
  'reviewAction.outcome.approvedEffect': 'الحالة الناتجة: قيد المراجعة',
  'reviewAction.outcome.correctionEffect': 'الحالة الناتجة: طلب تصحيح',
  'reviewAction.correctionReasonLabel': 'السبب: ',
  'reviewAction.commentsLabel': 'ملاحظات: ',
  'reviewAction.unauthorizedNotice': 'هذه الواجهة مخصصة حصرياً للمراجعين الإداريين (admin_reviewer).',

  // Phase 2C.4: Occupational-health coordination (AR)
  'oh.nav.queue': "قائمة انتظار تنسيق الصحة المهنية",
  'oh.nav.detail': "تفاصيل التنسيق",
  'oh.nav.create': "إنشاء تنسيق",
  'oh.queue.title': "قائمة التنسيق — الصحة المهنية",
  'oh.queue.empty': "لا توجد تنسيقات معلقة",
  'oh.queue.emptySubtitle': "لا توجد حالياً سجلات تنسيق تنتظر اتخاذ إجراء.",
  'oh.queue.reviewerBadge': "جلسة أخصائي الصحة المهنية (تجريبي)",
  'oh.queue.reason': "السبب:",
  'oh.queue.openDetail': "عرض التفاصيل",
  'oh.queue.refresh': "تحديث",
  'oh.create.title': "إنشاء سجل تنسيق",
  'oh.create.reason': "فئة التنسيق",
  'oh.create.disclaimer': "هذا سجل تنسيق محلي لأغراض العرض التوضيحي فقط. لا يُعدّ إحالة رسمية إلى أي خدمة طبية.",
  'oh.create.confirm': "تأكيد الإنشاء",
  'oh.create.confirmMessage': "هل تريد إنشاء سجل التنسيق التجريبي لهذا الملف؟",
  'oh.create.button': "إنشاء التنسيق",
  'oh.create.submitting': "جارٍ الإنشاء…",
  'oh.create.success': "تم إنشاء سجل التنسيق.",
  'oh.detail.title': "تفاصيل التنسيق",
  'oh.detail.noReference': 'المرجع غير متاح',
  'oh.detail.status': "الحالة",
  'oh.detail.acknowledge': "تأكيد الاستلام",
  'oh.detail.complete': "وضع علامة اكتمال المتابعة",
  'oh.detail.completeConfirm': "تأكيد الإغلاق",
  'oh.detail.completeConfirmMessage': "هل تريد وضع علامة اكتمال متابعة هذا التنسيق؟ لا يمكن التراجع عن هذا الإجراء.",
  'oh.detail.events': "أحداث المتابعة المسجّلة",
  'oh.detail.noEvents': "لم يتم تسجيل أي أحداث متابعة حتى الآن.",
  'oh.detail.addEvent': "تسجيل حدث متابعة",
  'oh.detail.coordinator': "أُنشئ بواسطة:",
  'oh.detail.declRef': "مرجع التصريح:",
  'oh.detail.reason': "سبب التنسيق:",
  'oh.detail.acknowledgedBy': "تم الاستلام بواسطة:",
  'oh.detail.completedBy': "تم الإغلاق بواسطة:",
  'oh.detail.disclaimer': "نموذج أولي تجريبي — هذا السجل المحلي ليس إحالة رسمية ولا يُنشئ التزامًا طبيًا أو مؤسسيًا.",
  'oh.event.title': "تسجيل حدث متابعة",
  'oh.event.category': "فئة الحدث",
  'oh.event.date': "تاريخ الحدث",
  'oh.event.datePlaceholder': 'YYYY-MM-DD',
  'oh.event.note': "ملاحظة إدارية (اختياري)",
  'oh.event.notePlaceholder': "ملاحظة تنسيق إدارية مختصرة وغير سريرية…",
  'oh.event.submit': "تسجيل الحدث",
  'oh.event.submitting': "جارٍ التسجيل…",
  'oh.status.pending_acknowledgement': "في انتظار التأكيد",
  'oh.status.acknowledged': "تم التأكيد",
  'oh.status.completed': "اكتملت المتابعة",
  'oh.status.cancelled': "ملغى",
  'oh.reason.routine_followup': "متابعة روتينية",
  'oh.reason.serology_monitoring': "مراقبة مصلية منسقة",
  'oh.reason.specialized_evaluation': "تقييم متخصص منسق",
  'oh.reason.other_coordination': "تنسيق إداري آخر",
  'oh.event.contact_attempt_recorded': "تسجيل محاولة اتصال",
  'oh.event.contact_established': "تم الاتصال",
  'oh.event.appointment_coordinated': "تم تنسيق الموعد",
  'oh.event.consultation_recorded': "تم تسجيل الاستشارة",
  'oh.event.follow_up_continued': "المتابعة مستمرة",
  'oh.event.follow_up_completed': "تم تحديد المتابعة كمكتملة",
  'oh.disclaimer.clinical': "لا يتخذ هذا النظام أي قرارات سريرية. تُسجَّل إجراءات التنسيق بواسطة أخصائي صحة مهنية مفوّض.",
  'oh.error.unauthorized': "لا يوجد تفويض للوصول إلى هذا الإجراء.",
  'oh.error.alreadyActive': "يوجد بالفعل سجل تنسيق نشط لهذا الملف.",
  'oh.error.noDeclaration': "التصريح غير موجود.",
  'oh.decl.coordinationStatus': "حالة تنسيق الصحة المهنية:",
  'oh.decl.noActiveCoordination': "لا يوجد تنسيق صحة مهنية نشط لهذا الملف.",
  'oh.decl.createCoordination': "إنشاء سجل تنسيق",
  // Phase 2E.1.6.1: OH Coordination UI Transformation (AR)
  'oh.queue.tabPending': "قيد الانتظار",
  'oh.queue.tabAcknowledged': "قيد المتابعة",
  'oh.queue.tabCompleted': "مكتمل",
  'oh.queue.emptyPending': "لا توجد ملفات تنسيق بانتظار استلامها.",
  'oh.queue.emptyAcknowledged': "لا توجد ملفات تنسيق قيد المتابعة حالياً.",
  'oh.queue.emptyCompleted': "لا توجد سجلات تنسيق مكتملة.",
  'oh.queue.totalRecords': "إجمالي السجلات:",
  'oh.detail.acknowledgedStatus': "تم الاستلام",
  'oh.detail.completedStatus': "تم إنهاء المتابعة",
  'oh.detail.createdAt': "تاريخ البدء:",
  'oh.detail.updatedAt': "آخر تحديث:",
  'oh.detail.exposedNotice': "يلخص هذا القسم حالة تنسيق الصحة المهنية المرتبطة ببلاغكم.",
  'oh.detail.adminNotice': "عرض إداري للقراءة فقط للتنسيق الذي تم بدؤه لهذا البلاغ.",
  'oh.detail.timelineTitle': "سجل أحداث المتابعة",
  'oh.detail.unauthorizedMessage': "ليس لديك الصلاحية للاطلاع على تفاصيل سجل التنسيق هذا.",
  'oh.event.dateInvalid': "صيغة التاريخ غير صالحة. يرجى استخدام صيغة YYYY-MM-DD.",
  'oh.event.charCount': "حرف",
  'oh.event.noteDescription': "ملاحظة إدارية للتتبع غير السريري فقط (بحد أقصى 300 حرف).",
  'oh.create.reasonHelp': "حدد السبب الإداري الموجب لهذا التنسيق:",
  'oh.create.disclaimerDetail': "يسجل هذا الإجراء طلب تنسيق إداري داخلي. ولا يغني عن رعاية طبية عاجلة أو بروتوكول التعرض للدم.",

  // Phase 2C.5: Surveillance Dashboard (AR)
  'surveillance.nav.title': "لوحة بيانات المراقبة",
  'surveillance.title': "مراقبة وتتبع حوادث AES الإجمالية",
  'surveillance.disclaimer': "بيانات عرض توضيحي اصطناعية — تعرض لوحة البيانات هذه مؤشرات إجمالية لأغراض العرض التقني فقط، ولا تمثل إحصائيات مؤسسية أو رسمية معتمدة.",
  'surveillance.unauthorized': "الوصول مقتصر حصريًا على الموظفين المصرح لهم (فريق الجودة، المراجع الإداري، طب العمل).",
  'surveillance.roleBadge': "جلسة موظف المراقبة والجودة (تجريبي)",
  'surveillance.filters.title': "تصفية المراقبة",
  'surveillance.filters.all': "الكل",
  'surveillance.filters.status': "الحالة:",
  'surveillance.filters.exposure': "نوع التعرض:",
  'surveillance.filters.startDate': "من: YYYY-MM-DD",
  'surveillance.filters.endDate': "إلى: YYYY-MM-DD",
  'surveillance.filters.clear': "إلغاء التصفية",
  'surveillance.overview.title': "المؤشرات العامة",
  'surveillance.overview.total': "إجمالي التصريحات",
  'surveillance.overview.draft': "مسودات",
  'surveillance.overview.submitted': "مُقدَّمة",
  'surveillance.overview.underReview': "قيد المراجعة",
  'surveillance.overview.correctionRequested': "طلب تصحيح",
  'surveillance.overview.resubmitted': "مُعاد تقديمها",
  'surveillance.overview.closed': "مغلقة",
  'surveillance.overview.activeOh': "تنسيقات طب العمل النشطة",
  'surveillance.overview.completedOh': "متابعات طب العمل المكتملة",
  'surveillance.temporal.title': "التوزيع الزمني للتصريحات",
  'surveillance.temporal.empty': "لا توجد بيانات زمنية في النطاق المحدد.",
  'surveillance.exposure.title': "التوزيع حسب نوع التعرض",
  'surveillance.exposure.empty': "لا توجد سجلات تعرض.",
  'surveillance.status.title': "التوزيع حسب حالة التصريح",
  'surveillance.admin.title': "مؤشرات المراجعة الإدارية",
  'surveillance.admin.totalReviews': "إجمالي المراجعات الإدارية",
  'surveillance.admin.correctionRequests': "طلبات التصحيح الصادرة",
  'surveillance.admin.correctionResponses': "ردود التصحيح المستلمة",
  'surveillance.admin.outcomes': "القرارات الإدارية",
  'surveillance.oh.title': "مؤشرات الصحة المهنية",
  'surveillance.oh.status': "حالات التنسيق",
  'surveillance.oh.events': "أحداث المتابعة المسجلة حسب الفئة",

  // Phase 2C.6: Prevention & Corrective-Action Management (AR)
  'prevention.nav.title': "الوقاية والإجراءات التصحيحية",
  'prevention.title': "الوقاية والإجراءات التصحيحية / الوقائية",
  'prevention.disclaimer': "نموذج أولي للعرض — بيانات اصطناعية فقط. لا تمثل إحصائيات مؤسسية معتمدة.",
  'prevention.provisional.disclaimer': "⚠ فئات مؤقتة — يلزم التحقق المؤسسي قبل أي استخدام رسمي.",
  'prevention.unauthorized': "الوصول مقتصر على الموظفين المصرح لهم (الجودة، المراجع الإداري، طب العمل).",
  'prevention.overview.title': "نظرة عامة على الإجراءات",
  'prevention.overview.total': "إجمالي الإجراءات",
  'prevention.overview.proposed': "مقترحة",
  'prevention.overview.in_progress': "قيد التنفيذ",
  'prevention.overview.completed': "مكتملة",
  'prevention.overview.cancelled': "ملغاة",
  'prevention.overview.viewRegister': "عرض السجل",
  'prevention.overview.newAction': "إجراء جديد",
  'prevention.register.title': "سجل الإجراءات",
  'prevention.register.empty': "لا توجد إجراءات مسجلة لهذه المعايير.",
  'prevention.register.filterStatus': "الحالة",
  'prevention.register.filterType': "النوع",
  'prevention.register.filterFactor': "العامل",
  'prevention.register.clearFilters': "مسح",
  'prevention.register.all': "الكل",
  'prevention.register.retry': "إعادة المحاولة",
  'prevention.register.viewDetails': "عرض تفاصيل الإجراء",
  'prevention.create.title': "إجراء CAPA جديد",
  'prevention.create.subtitle': "صياغة إجراء تصحيحي أو وقائي",
  'prevention.create.actionTitle': "عنوان الإجراء *",
  'prevention.create.description': "وصف تفصيلي *",
  'prevention.create.action_type': "نوع الإجراء *",
  'prevention.create.corrective': "تصحيحي",
  'prevention.create.preventive': "وقائي",
  'prevention.create.factor.label': "العامل المساهم (مؤقت)",
  'prevention.create.factor.none': "— بدون عامل —",
  'prevention.create.factor.disclaimer': "⚠ فئات مؤقتة — يلزم التحقق المؤسسي.",
  'prevention.create.rationale': "المبرر *",
  'prevention.create.target_date': "التاريخ المستهدف (اختياري، YYYY-MM-DD)",
  'prevention.create.surveillance_reference': "مرجع المراقبة (اختياري)",
  'prevention.create.submit': "حفظ الإجراء",
  'prevention.create.submitting': "جارٍ الحفظ…",
  'prevention.create.success': "تم حفظ الإجراء بنجاح.",
  'prevention.create.retry': "إعادة المحاولة",
  'prevention.create.error': "تعذر حفظ الإجراء. تظل بياناتك محفوظة في النموذج.",
  'prevention.create.denied': "يُسمح لفريق الجودة فقط بإنشاء إجراءات CAPA.",
  'prevention.create.validation.title': "يجب أن يحتوي العنوان على 3 أحرف على الأقل.",
  'prevention.create.validation.description': "يجب أن يحتوي الوصف على 5 أحرف على الأقل.",
  'prevention.create.validation.rationale': "يجب أن يحتوي المبرر على 5 أحرف على الأقل.",
  'prevention.create.validation.targetDate': "يجب أن يكون التاريخ المستهدف بصيغة YYYY-MM-DD.",
  'prevention.create.validation.surveillanceReference': "يجب أن يكون المرجع ملاحظة مراقبة مجمعة دون مرجع AES فردي.",
  'prevention.create.placeholder.title': "مثال: توفير حاويات آمنة للأدوات الحادة",
  'prevention.create.placeholder.description': "صف الإجراء المقترح",
  'prevention.create.placeholder.rationale': "اشرح مبرر الإجراء المقترح",
  'prevention.create.placeholder.surveillanceReference': "مثال: ملاحظة T3-2026",
  'prevention.detail.title': "تفاصيل الإجراء",
  'prevention.detail.subtitle': "معلومات الإجراء والإجراءات المسموح بها ضمن دورة الحياة",
  'prevention.detail.notFound': "تعذر العثور على إجراء CAPA هذا.",
  'prevention.detail.loadError': "تعذر تحميل هذا الإجراء. أعد المحاولة.",
  'prevention.detail.retry': "إعادة المحاولة",
  'prevention.detail.actionInformation': "معلومات الإجراء",
  'prevention.detail.recordInformation': "معلومات السجل",
  'prevention.detail.lifecycleActions': "إجراءات دورة الحياة",
  'prevention.detail.referenceCode': "المرجع",
  'prevention.detail.status.proposed': "مقترح",
  'prevention.detail.status.in_progress': "قيد التنفيذ",
  'prevention.detail.status.completed': "مكتمل",
  'prevention.detail.status.cancelled': "ملغى",
  'prevention.detail.type.corrective': "تصحيحي",
  'prevention.detail.type.preventive': "وقائي",
  'prevention.detail.factor': "العامل المساهم",
  'prevention.detail.rationale': "المبرر",
  'prevention.detail.targetDate': "التاريخ المستهدف",
  'prevention.detail.completedAt': "اكتمل في",
  'prevention.detail.completionNotes': "ملاحظة الإغلاق",
  'prevention.detail.start_action': "بدء",
  'prevention.detail.complete_action': "إغلاق",
  'prevention.detail.cancel_action': "إلغاء",
  'prevention.detail.completion_note_prompt': "ملاحظة الإغلاق مطلوبة (3 أحرف على الأقل)",
  'prevention.detail.completionNoteLabel': "ملاحظة الإغلاق",
  'prevention.detail.cancelNoteLabel': "ملاحظة الإلغاء (اختيارية)",
  'prevention.detail.cancelConfirmation': "هل تريد تأكيد إلغاء هذا الإجراء؟",
  'prevention.detail.confirmCancellation': "تأكيد الإلغاء",
  'prevention.detail.keepAction': "الاحتفاظ بالإجراء",
  'prevention.detail.transitionError': "تعذر تأكيد التحديث. حدّث حالة الإجراء قبل إعادة المحاولة.",
  'prevention.detail.refreshRetry': "تحديث حالة الإجراء",
  'prevention.detail.validation.completionNote': "يجب أن تحتوي ملاحظة الإغلاق على 3 أحرف على الأقل.",
  'prevention.detail.auditEmpty': "لم يتم تسجيل أحداث تدقيق.",
  'prevention.detail.audit_history': "سجل التغييرات",
  'prevention.detail.createdAt': "أُنشئ في",
  'prevention.detail.updatedAt': "تم التحديث في",
  'prevention.factor.device_safety_design': "تصميم جهاز آمن",
  'prevention.factor.procedure_compliance': "الامتثال للإجراءات",
  'prevention.factor.workload_fatigue': "عبء العمل / التعب",
  'prevention.factor.waste_disposal_container': "حاوية التخلص من النفايات الحادة",
  'prevention.factor.protective_equipment': "معدات الحماية الشخصية",
  'prevention.factor.training_supervision': "التدريب / الإشراف",
  'prevention.factor.environment_workspace': "البيئة / مكان العمل",
  'prevention.factor.other_factor': "عامل آخر",
  'prevention.factor.none': "غير محدد",

  // Phase 2C.7: Unified Demonstration Workspace (AR)
  // REQUIRES_VALIDATION: Arabic translations should be reviewed by a qualified professional.
  'workspace.tagline': "منصة متكاملة لإدارة حوادث التعرض للدم والملوثات الحيوية",
  'workspace.disclaimerTitle': "نموذج تجريبي لمشروع التخرج — بيانات اصطناعية فقط",
  'workspace.disclaimerText': "هذا النموذج مخصص حصرياً للعرض التوضيحي لمشروع التخرج. جميع البيانات المعروضة اصطناعية وتم إنشاؤها محلياً. لا تتم معالجة أي بيانات حقيقية للمرضى أو المستشفيات. يتم محاكاة الأدوار وسير العمل في الذاكرة المحلية.",
  'workspace.roleSelectorTitle': "محدد الأدوار التجريبي",
  'workspace.roleSelectorSubtitle': "قم بالتبديل بين الأدوار الـ 5 لمعاينة المسارات المصرح بها وحدود الوصول.",
  'workspace.roleDesc.exposed': "الإبلاغ الفوري عن حادث تعرض، مراجعة البلاغات الشخصية، والرد على طلبات التصحيح الإدارية.",
  'workspace.roleDesc.admin': "المراجعة الإدارية، طلب التصحيح، بدء التنسيق مع طب العمل، والاطلاع على إجراءات CAPA.",
  'workspace.roleDesc.oh': "المتابعة الطبية المهنية، الفحوصات المصلية (HIV/HBV/HCV)، تسجيل أحداث المتابعة، وإغلاق الملف.",
  'workspace.roleDesc.quality': "الترصد الوبائي مجهول الهوية، مراجعة المؤشرات التجميعية، وإدارة خطة إجراءات الوقاية CAPA.",
  'workspace.roleDesc.tech': "صيانة النظام، التحقق من مخطط SQLite والسلامة الفنية المحلية. يمنع الوصول للبيانات السريرية والشخصية.",
  'workspace.correctionActionRequired': "طلب تصحيح بانتظار الرد",
  'workspace.correctionActionDesc': "طلب المراجع الإداري تصحيحاً على أحد بلاغاتك. يرجى استكمال البيانات المطلوبة.",
  'workspace.permittedModulesTitle': "الوحدات المصرح بها لهذا الدور",
  'workspace.module.newDeclaration': "تسجيل بلاغ حادث تعرض (AES)",
  'workspace.module.newDeclarationDesc': "تسجيل خطوة بخطوة لحادث تعرض مهني للدم",
  'workspace.module.myDeclarations': "بلاغاتي المسجلة",
  'workspace.module.myDeclarationsDesc': "سجل وحالة بلاغاتك الشخصية عن الحوادث",
  'workspace.module.adminQueue': "قائمة المراجعة الإدارية",
  'workspace.module.adminQueueDesc': "مراجعة البلاغات المقدمة، الاعتماد أو طلب تصحيح",
  'workspace.module.allDeclarations': "السجل العام للبلاغات",
  'workspace.module.allDeclarationsDesc': "نظرة إدارية شاملة على جميع بلاغات الحوادث بالمنشأة",
  'workspace.module.ohQueue': "قائمة طب العمل (SST)",
  'workspace.module.ohQueueDesc': "التنسيق الطبي المهني والمتابعة المصلية للكوادر المعرضة",
  'workspace.module.surveillanceDashboard': "لوحة الترصد الوبائي",
  'workspace.module.surveillanceDashboardDesc': "مؤشرات تجميعية مجهولة الهوية، اتجاهات، أنواع التعرض وفلاتر التحليل",
  'workspace.module.preventionOverview': "نظرة عامة على الوقاية وCAPA",
  'workspace.module.preventionOverviewDesc': "مؤشرات ملخصة للإجراءات التصحيحية والوقائية",
  'workspace.module.preventionRegister': "سجل إجراءات CAPA",
  'workspace.module.preventionRegisterDesc': "الإدارة التشغيلية، مراحل الحالة، واستكمال الإجراءات",
  'workspace.module.preventionRegisterReadOnly': "سجل الوقاية (للقراءة فقط)",
  'workspace.module.preventionRegisterReadOnlyDesc': "الاطلاع على سجل الإجراءات دون صلاحيات التعديل",
  'workspace.module.preventionCreate': "إنشاء إجراء تصحيحي/وقائي",
  'workspace.module.preventionCreateDesc': "صياغة إجراء تصحيحي أو وقائي بناءً على ملاحظة تحسين",
  'workspace.notice.exposedRestrictions': "عزل الصلاحيات: لا يمكنك الوصول إلى بلاغات الزملاء الآخرين أو لوحة تحكم الجودة أو إدارة CAPA.",
  'workspace.notice.qualityRestrictions': "حماية الخصوصية: يمكنك الوصول إلى المؤشرات المجمعة وسجل CAPA، دون الوصول للبلاغات الاسمية أو الملفات الطبية.",
  'workspace.notice.techRestrictions': "عزل تقني صارم: يمكنك الوصول لأدوات تشخيص SQLite وسلامة النظام فقط دون أي وصول للبيانات السريرية.",
  'workspace.tech.sqliteIntegrity': "تشخيص قاعدة بيانات SQLite المحلية",
  'workspace.tech.engine': 'المحرك',
  'workspace.tech.schemaVersion': "إصدار المخطط",
  'workspace.tech.fkCheck': "فحص المفاتيح الخارجية (PRAGMA foreign_key_check)",
  'workspace.tech.fkOk': "تم اكتشاف 0 انتهاك",
  'workspace.badgePending': "قيد الانتظار",
  'workspace.badgeActive': "نشطة",
  'workspace.badgeIncidents': "حوادث",
  'workspace.badgeActions': "إجراءات",
  'workspace.scenarioTitle': "سيناريو العرض التوضيحي الإرشادي (PFE)",
  'workspace.scenarioSubtitle': "اتبع هذه الخطوات الـ 6 لعرض دورة الحياة الكاملة لحادث التعرض أمام لجنة التحكيم:",
  'workspace.step1.title': "1. الإبلاغ عن الحادث",
  'workspace.step1.desc': "يقوم الممارس الصحي بتسجيل بلاغ حادث التعرض للدم فور وقوعه.",
  'workspace.step2.title': "2. المراجعة الإدارية",
  'workspace.step2.desc': "يقوم المشرف أو مسؤول الموارد البشرية بمراجعة البلاغ واعتماده أو طلب توضيحات.",
  'workspace.step3.title': "3. استكمال التصحيحات",
  'workspace.step3.desc': "يقوم الممارس باستكمال البيانات المطلوبة دون الإخلال بسجل التدقيق.",
  'workspace.step4.title': "4. المتابعة بطب العمل",
  'workspace.step4.desc': "يتولى طب العمل التنسيق السري والمتابعة المصلية الدورية.",
  'workspace.step5.title': "5. ترصد الجودة",
  'workspace.step5.desc': "يحلل مسؤول الجودة المؤشرات الوبائية التجميعية ومصادر الخطر.",
  'workspace.step6.title': "6. خطة إجراءات الوقاية",
  'workspace.step6.desc': "تحديد وتنفيذ وإغلاق الإجراءات التصحيحية والوقائية لمنع التكرار.",
  'workspace.switchRole': "التبديل إلى هذا الدور",
  'workspace.activeRoleIndicator': "الدور النشط",

  // ─── Phase 2D.1: Help Centre & Glossary ───
  'helpGlossary.title': "مركز المساعدة والمسرد",
  'helpGlossary.subtitle': "المصادر التوثيقية والتعريفات ودليل العرض التوضيحي",
  'helpGlossary.tabHelp': "مركز المساعدة",
  'helpGlossary.tabGlossary': "مسرد مصطلحات AES",
  'helpGlossary.disclaimer': "هذا التطبيق نموذج أولي للعرض الأكاديمي يستخدم بيانات تركيبية حصرياً. وهو لا يغني عن البروتوكولات المؤسسية أو استشارة الممارسين المؤهلين أو الإجراءات الرسمية للتكفل.",
  'helpGlossary.searchPlaceholder': "البحث عن مصطلح أو تعريف…",
  'helpGlossary.clearSearch': "مسح البحث",
  'helpGlossary.categoryAll': "الكل",
  'helpGlossary.categoryExposure': "التعرض",
  'helpGlossary.categoryDeclaration': "الإبلاغ",
  'helpGlossary.categoryAdmin': "إداري",
  'helpGlossary.categoryOH': "طب العمل",
  'helpGlossary.categoryQuality': "الجودة والوقاية",
  'helpGlossary.emptySearch': "لم يتم العثور على مصطلحات تطابق بحثك.",
  'helpGlossary.backToWorkspace': "العودة للمساحة",

  // Help Sections (1 to 8)
  'help.section1.title': "1. مقدمة حول نظام AES Guardian",
  'help.section1.content': "نظام AES Guardian نموذج تجريبي متكامل للإبلاغ والمراجعة الإدارية والتنسيق مع طب العمل والترصد الوبائي لحوادث التعرض للدم في المستشفيات. صُمم ضمن مشروع تخرج أكاديمي (PFE)، ويعرض مسار عمل مستمر وآمن يعمل محلياً بالكامل دون اتصال بالإنترنت عبر SQLite.",
  'help.section2.title': "2. فهم مسار الإبلاغ عن الحادث",
  'help.section2.content': "عند تعرض الممارس الصحي لحادث (وخز إبرة، جرح، تناثر سوائل بيولوجية)، يقوم فوراً بتسجيل بلاغ رقمي يوثق التوقيت والقسم والظروف الموضوعية دون إدراج بيانات تعريفية للمرضى. وبعد الإرسال يصبح البلاغ غير قابل للتعديل ويدخل قائمة الفحص.",
  'help.section3.title': "3. فهم المراجعة الإدارية",
  'help.section3.content': "يقوم المشرف أو مسؤول الموارد البشرية بفحص البلاغ إدارياً، ولديه 3 خيارات: تأكيد الاستلام رسمياً، أو تأكيد التحويل لطب العمل، أو طلب استيضاحات وتصحيحات من الممارس دون المساس بالسجل الأولي.",
  'help.section4.title': "4. فهم التنسيق مع طب العمل",
  'help.section4.content': "يتولى فريق طب العمل المتابعة المهنية والصحية للممارس المعرض. وتُسجل محطات المتابعة (التواصل، الاستشارة، المتابعة المصلية، الإغلاق) كأحداث إدارية محايدة لحماية السرية الطبية التامة.",
  'help.section5.title': "5. فهم الترصد الوبائي",
  'help.section5.content': "يطلع مسؤول الجودة على مؤشرات إحصائية مجمعة مجردة من الهوية: معدلات الحوادث الشهرية، توزيع أنواع التعرض، الأقسام الأكثر تعرضاً، ونسب إنجاز الملفات، دون أي إمكانية للوصول لأسماء المصابين.",
  'help.section6.title': "6. فهم خطة الوقاية والإجراءات التصحيحية (CAPA)",
  'help.section6.content': "تغذي مؤشرات الترصد سجل الإجراءات التصحيحية والوقائية. يستهدف كل إجراء عاملاً مساهماً محدداً (تصميم الأدوات، الالتزام بالبروتوكولات، حاويات النفايات الحادة، التدريب) للقضاء على أسباب الخطر ومنع التكرار.",
  'help.section7.title': "7. فهم الأدوار التركيبية الخمسة",
  'help.section7.content': "يطبق النظام فصلاً صارماً للصلاحيات: الممارس المعرض (الإبلاغ وملفاته فقط)، المشرف الإداري (الفحص والتوجيه)، طب العمل (المتابعة السرية)، الجودة (المؤشرات والوقاية)، والمسؤول التقني (صيانة قاعدة البيانات المحلية دون أي وصول سريري).",
  'help.section8.title': "8. الخصوصية وحدود النموذج التجريبي",
  'help.section8.content': "يعمل هذا النموذج محلياً وبشكل معزول باستخدام بيانات تركيبية. ولا يُعد جهازاً طبياً ولا يقدم تشخيصات أو وصفات علاجية أو جرعات دوائية.",

  // Glossary Terms (1 to 14)
  'glossary.term1.term': "AES (حادث التعرض للدم)",
  'glossary.term1.category': "التعرض",
  'glossary.term1.definition': "أي تلامس عرضي مع دم أو سائل بيولوجي ملوث بالدم، ناتج عن وخز إبرة أو جرح أو تناثر على الأغشية المخاطية أو الجلد المصاب.",
  'glossary.term2.term': "التعرض الجلدي النافذ",
  'glossary.term2.category': "التعرض",
  'glossary.term2.definition': "إصابة جلدية نافذة ناجمة عن إبرة مجوفة أو مشرط جراحي أو أي أداة حادة ملوثة بمادة بيولوجية.",
  'glossary.term3.term': "التعرض المخاطي",
  'glossary.term3.category': "التعرض",
  'glossary.term3.definition': "تلامس عرضي ناتج عن تناثر سوائل بيولوجية على الأغشية المخاطية، خاصة العينين أو الفم.",
  'glossary.term4.term': "الجلد غير السليم",
  'glossary.term4.category': "التعرض",
  'glossary.term4.definition': "منطقة جلدية بها جروح مسبقة أو حروق أو التهابات تلامست مع سائل بيولوجي محتمل التلوث.",
  'glossary.term5.term': "البلاغ (Déclaration)",
  'glossary.term5.category': "الإبلاغ",
  'glossary.term5.definition': "التسجيل الرقمي الأولي للحادث من قِبل الممارس المعرض لتوثيق الظروف الموضوعية دون إفشاء أسرار المرضى.",
  'glossary.term6.term': "المراجعة الإدارية",
  'glossary.term6.category': "إداري",
  'glossary.term6.definition': "فحص المطابقة والقبول الذي يجريه المشرف أو إدارة الموارد البشرية لاعتماد البلاغ وتوجيهه للمسار المناسب.",
  'glossary.term7.term': "التنسيق مع طب العمل",
  'glossary.term7.category': "طب العمل",
  'glossary.term7.definition': "مسار المرافقة والمتابعة الوقائية والقانونية للممارس المعرض تحت إشراف طبيب العمل.",
  'glossary.term8.term': "المتابعة المصلية (Sérologie)",
  'glossary.term8.category': "طب العمل",
  'glossary.term8.definition': "فحوص مخبرية بيولوجية (لفيروسات الكبد B وC ونقص المناعة البشرية) تُستخدم ضمن المتابعة الطبية المهنية عقب التعرض. يسجّل هذا التطبيق المحطات الإدارية لهذه المتابعة دون أن يحدد أي جدول زمني للفحوص أو يصفها.",
  'glossary.term9.term': "الترصد الوبائي",
  'glossary.term9.category': "الجودة والوقاية",
  'glossary.term9.definition': "جمع وتحليل تجميعي منظم لبيانات الحوادث لرصد مؤشرات الخطر وتوجيه سياسات السلامة المهنية.",
  'glossary.term10.term': "تجريد الهوية (Dé-identification)",
  'glossary.term10.category': "الجودة والوقاية",
  'glossary.term10.definition': "إجراء لحماية الخصوصية يفصل المؤشرات الإحصائية عن أي بيانات تعريفية مباشرة أو غير مباشرة للممارس.",
  'glossary.term11.term': "العامل المساهم",
  'glossary.term11.category': "الجودة والوقاية",
  'glossary.term11.definition': "ظرف تنظيمي أو مادي أو بشري أو بيئي ساعد في وقوع الحادث أو فاقم من خطورته.",
  'glossary.term12.term': "إجراءات CAPA (تصحيحية ووقائية)",
  'glossary.term12.category': "الجودة والوقاية",
  'glossary.term12.definition': "منهجية جودة منظمة تهدف لإزالة الأسباب الجذرية للمخاطر المتكررة ومنع حدوثها مجدداً.",
  'glossary.term13.term': "حدث المتابعة",
  'glossary.term13.category': "طب العمل",
  'glossary.term13.definition': "محطة زمنية إدارية محايدة توثق مرحلة تم إنجازها في مسار التكفل بطب العمل.",
  'glossary.term14.term': "سجل التدقيق (Audit Log)",
  'glossary.term14.category': "إداري",
  'glossary.term14.definition': "سجل زمني محلي يوثق عمليات النظام أثناء العرض التوضيحي. ملاحظة: يمكن مسح هذا السجل عند إعادة تعيين بيانات العرض.",

  // ─── Phase 2D.1: Demonstrator Profile & Settings ───
  'profile.title': "ملف وإعدادات العارض",
  'profile.subtitle': "إدارة الحساب التركيبي وتفضيلات النظام والصيانة المحلية",
  'profile.accountSection': "الحساب التركيبي النشط",
  'profile.roleSection': "تبديل الدور التركيبي",
  'profile.permissionsSection': "الصلاحيات والحدود",
  'profile.authorizedCapabilities': "المهام المصرح بها",
  'profile.restrictedCapabilities': "القيود المشددة",
  'profile.demoAccountNotice': "حساب تركيبي محاكى في الذاكرة المحلية. لا يلزم تسجيل دخول أو كلمة مرور للعرض التوضيحي.",
  'profile.languageSection': "لغة التطبيق",
  'profile.languageSelectorTitle': "اختر لغة الواجهة:",
  'profile.rtlNotice': "ملاحظة: سيتم استكمال الدعم الكامل لاتجاه اليمين إلى اليسار (RTL) في تحديث مستقبلي.",
  'profile.navigationSection': "التوثيق والمصادر",
  'profile.helpCenterLink': "مركز المساعدة ومسار العمل",
  'profile.glossaryLink': "مسرد مصطلحات الحوادث",
  'profile.guidedTourLink': "جولة تعريفية",
  'profile.privacySection': "الخصوصية والحدود الأخلاقية",
  'profile.privacyContent': "يتعامل هذا النموذج حصرياً مع بيانات تركيبية محلية. لا تُحفظ أي بيانات حقيقية للمرضى أو الكوادر. مؤشرات الترصد مجردة من الهوية افتراضياً.",
  'profile.aboutSection': "عن النموذج التجريبي",
  'profile.appNameLabel': "التطبيق: AES Guardian (وحدة مساند)",
  'profile.dbEngineLabel': "قاعدة البيانات: SQLite (@op-engineering/op-sqlite)",
  'profile.maintenanceSection': "الصيانة التقنية (tech_admin)",
  'profile.error.techAdminOnly': "هذا الإجراء متاح للمسؤول التقني فقط.",
  'profile.error.userIdMissing': "تعذرت إعادة الضبط لعدم توفر سياق الحساب النشط.",

  // Role capability items for profile
  'profile.cap.declare': "الإبلاغ عن حادث جديد وحفظ المسودات",
  'profile.cap.myDeclarations': "الاطلاع على حالة وتاريخ البلاغات الخاصة",
  'profile.cap.respondCorrection': "الرد على طلبات الاستيضاح والتصحيح الإداري",
  'profile.cap.adminReview': "معالجة قائمة الانتظار واعتماد قرارات المراجعة الإدارية",
  'profile.cap.initiateOH': "إحالة البلاغ إلى مسار التنسيق بطب العمل",
  'profile.cap.ohCoordination': "استلام ملفات التنسيق وإدارة مراحل المتابعة",
  'profile.cap.ohFollowUp': "تسجيل محطات المراقبة المصلية وإغلاق الملفات",
  'profile.cap.surveillanceDashboard': "الاطلاع على مؤشرات الترصد الوبائي التجميعية المجردة من الهوية",
  'profile.cap.preventionRegister': "الاطلاع على سجل إجراءات الوقاية (CAPA) للقراءة فقط",
  'profile.cap.manageCapa': "إنشاء ومتابعة وإغلاق الإجراءات التصحيحية والوقائية",
  'profile.cap.techMaintenance': "فحص سلامة مخطط SQLite وإعادة ضبط بيانات العرض",
  'profile.restr.noSurveillance': "حظر الوصول للوحة مؤشرات الترصد الوبائي",
  'profile.restr.noCapa': "غير مصرح بإنشاء أو تعديل إجراءات الوقاية",
  'profile.restr.noOtherDeclarations': "يُمنع منعاً باتاً الاطلاع على بلاغات الزملاء الآخرين",
  'profile.restr.noClinicalContent': "يُمنع الوصول إلى الملاحظات أو البيانات الصحية الشخصية",
  'profile.restr.noAdminQueue': "حظر الوصول لقائمة المراجعة الإدارية",
  'profile.restr.noIdentifiableData': "حظر الوصول لبيانات التعريف الشخصية للممارسين",

  // ─── Phase 2D.1: Secure Data Reset ───
  'reset.sectionTitle': "إعادة ضبط بيانات العرض التجريبي",
  'reset.sectionDesc': "إجراء صيانة مخصص حصرياً للمسؤول التقني. يتيح حذف التعديلات واستعادة السيناريو المعياري كاملاً.",
  'reset.buttonLabel': "إعادة ضبط بيانات العرض التجريبي",
  'reset.dialog1Title': "إعادة ضبط البيانات؟",
  'reset.dialog1Message': "سيؤدي هذا الإجراء لحذف كافة البلاغات والمراجعات والمتابعات والإجراءات المضافة واستعادة السيناريو القياسي الأصلي (4 بلاغات، 5 إجراءات). هذا الإجراء لا يمكن التراجع عنه.",
  'reset.dialog1Cancel': "إلغاء",
  'reset.dialog1Continue': "متابعة…",
  'reset.dialog2Title': "تأكيد نهائي",
  'reset.dialog2Message': "هل أنت متأكد تماماً من رغبتك في إعادة ضبط قاعدة البيانات المحلية الآن؟",
  'reset.dialog2Cancel': "إلغاء",
  'reset.dialog2Confirm': "تأكيد إعادة الضبط",
  'reset.inProgress': "جارٍ إعادة ضبط قاعدة البيانات…",
  'reset.successTitle': "تمت إعادة الضبط بنجاح",
  'reset.successMessage': "تمت استعادة سيناريو العرض التجريبي.",
  'reset.errorTitle': "فشل إعادة الضبط",
  'reset.errorMessage': "حدث خطأ أثناء تنفيذ عملية إعادة الضبط المعاملاتية:",

  // ─── Phase 2D.2: In-App Notifications (11 Canonical Events) ───
  'notification.declarationSubmitted.title': "تم تقديم بلاغ جديد",
  'notification.declarationSubmitted.message': "تم تسجيل البلاغ {reference} وهو في انتظار المراجعة الإدارية.",
  'notification.reviewCompleted.title': "اكتملت المراجعة الإدارية",
  'notification.reviewCompleted.message': "تم الانتهاء من المراجعة الإدارية للبلاغ {reference}.",
  'notification.correctionRequested.title': "طلب تصحيح أو استيضاح",
  'notification.correctionRequested.message': "يرجى تقديم استيضاحات إضافية حول البلاغ {reference}.",
  'notification.correctionSubmitted.title': "تم تقديم الرد على التصحيح",
  'notification.correctionSubmitted.message': "قام صاحب البلاغ بتقديم عناصر التصحيح المطلوبة للملف {reference}.",
  'notification.ohCoordinationCreated.title': "ملف جديد للتنسيق بطب العمل",
  'notification.ohCoordinationCreated.message': "تم فتح ملف تنسيق جديد بطب العمل للبلاغ {reference}.",
  'notification.ohCoordinationAcknowledged.title': "تأكيد استلام ملف طب العمل",
  'notification.ohCoordinationAcknowledged.message': "تم تأكيد استلام وبدء متابعة ملفكم {reference} من قبل مصلحة طب العمل.",
  'notification.ohMilestoneRecorded.title': "تسجيل محطة متابعة بطب العمل",
  'notification.ohMilestoneRecorded.message': "تم تسجيل وتأكيد محطة متابعة جديدة لملفكم {reference}.",
  'notification.ohCoordinationCompleted.title': "إغلاق ملف متابعة طب العمل",
  'notification.ohCoordinationCompleted.message': "تم إغلاق ملف متابعة طب العمل المرتبط بالبلاغ {reference} بنجاح.",
  'notification.capaCreated.title': "إنشاء إجراء وقائي جديد",
  'notification.capaCreated.message': "تم تسجيل الإجراء الوقائي {reference} في سجل إجراءات الوقاية (CAPA).",
  'notification.capaStatusChanged.title': "تحديث حالة إجراء الوقاية",
  'notification.capaStatusChanged.message': "تم تحديث حالة الإجراء الوقائي {reference} في السجل.",
  'notification.capaFinalized.title': "اكتمال إجراء الوقاية",
  'notification.capaFinalized.message': "تم إتمام وإغلاق الإجراء الوقائي {reference} في سجل (CAPA).",

  // ─── Phase 2D.2G: Notification Centre UI ───
  'notificationCentre.title': "مركز الإشعارات",
  'notificationCentre.empty': "لا توجد إشعارات",
  'notificationCentre.emptySubtitle': "ليس لديك أي إشعارات في الوقت الحالي.",
  'notificationCentre.markAllRead': "تحديد الكل كمقروء",
  'notificationCentre.markAllReadConfirm': "هل تريد تحديد جميع الإشعارات كمقروءة؟",
  'notificationCentre.confirm': "تأكيد",
  'notificationCentre.cancel': "إلغاء",
  'notificationCentre.retry': "إعادة المحاولة",
  'notificationCentre.unread': "غير مقروء",
  'notificationCentre.read': "مقروء",
  'notificationCentre.today': "اليوم",
  'notificationCentre.yesterday': "أمس",
  'notificationCentre.tapToOpen': "اضغط للفتح",
  'notificationCentre.errorLoad': "تعذّر تحميل الإشعارات.",
  'notificationCentre.errorNavigation': "الوجهة غير موجودة أو تم رفض الوصول.",
  'notificationCentre.errorStale': "قد يكون هذا الإشعار قديمًا أو لم يعد لديك حق الوصول إليه.",
  'notificationCentre.techAdminRestricted': "لا يملك مسؤولو النظام التقنيون صلاحية الوصول إلى إشعارات العمليات.",
  'notificationCentre.a11y.unreadBadge': "إشعارات غير مقروءة",
  'notificationCentre.a11y.notificationItem': "إشعار",
  'notificationCentre.a11y.markAllRead': "تحديد جميع الإشعارات كمقروءة",

  // ─── Phase 2E.1.2: Batch 2 Onboarding & Synthetic Demo Entry (AR) ───
  'splash.wordmark': 'حارس AES',
  'splash.subtitle': 'حوكمة حوادث التعرض للدم في المستشفيات',
  'splash.enter': 'الدخول إلى النظام',
  'onboarding.lang.overline': 'لغة النظام',
  'onboarding.lang.title': 'اختر لغة النظام',
  'onboarding.lang.subtitle': 'حدد لغة العرض للنموذج الأولي للمستشفى.',
  'onboarding.continue': 'متابعة',
  'onboarding.carousel.skip': 'تخطي',
  'onboarding.carousel.start': 'البدء',
  'onboarding.carousel.next': 'التالي',
  'onboarding.carousel.slide1.title': 'إبلاغ سريع ومحمي عن الحوادث',
  'onboarding.carousel.slide1.desc': 'إبلاغ منظم في 5 خطوات إرشادية فور وقوع حادث تعرض للدم، مع حفظ محلي للمسودة.',
  'onboarding.carousel.slide1.bullet1': 'حفظ محلي للمسودات',
  'onboarding.carousel.slide1.bullet2': 'نموذج منظم في 5 خطوات إرشادية',
  'onboarding.carousel.slide1.bullet3': 'استئناف ميسر للمسودة قيد الإنجاز',
  'onboarding.carousel.slide2.title': 'متابعة تنسيق سرية مع طب العمل',
  'onboarding.carousel.slide2.desc': 'متابعة التنسيق مع طب العمل مع تقليل البيانات المعروضة للأدوار الأخرى وحماية الملاحظات الطبية.',
  'onboarding.carousel.slide2.bullet1': 'ملاحظات المتابعة مخصصة لطب العمل',
  'onboarding.carousel.slide2.bullet2': 'تتبع مراحل وإجراءات التنسيق بعد التعرض',
  'onboarding.carousel.slide2.bullet3': 'إسقاط مقيد لحالة الملف للمهني المعرَّض',
  'onboarding.carousel.slide3.title': 'المراقبة والوقاية المستمرة',
  'onboarding.carousel.slide3.desc': 'مؤشرات إحصائية تجميعية بدون بيانات تعريفية وسجل محلي لإجراءات الوقاية والتصحيح (CAPA).',
  'onboarding.carousel.slide3.bullet1': 'مؤشرات مجمعة بدون بيانات تعريف شخصية',
  'onboarding.carousel.slide3.bullet2': 'سجل منظم لإجراءات الوقاية والتصحيح (CAPA)',
  'onboarding.carousel.slide3.bullet3': 'فصل صارم للصلاحيات وفقاً للدور النشط',
  'onboarding.disclaimer.title': 'تحذير — نموذج أولي للعرض التوضيحي',
  'onboarding.disclaimer.badge': 'بروتوكول أكاديمي لمشروع التخرج',
  'onboarding.disclaimer.p1': '1. هذا البرنامج نموذج أولي للبحث الأكاديمي (مشروع تخرج). جميع البيانات والحوادث والموظفين والأرقام اصطناعية 100%.',
  'onboarding.disclaimer.p2': '2. لا يتم تخزين أو نقل أي بيانات طبية حقيقية. يعمل النظام محلياً بالكامل دون اتصال بالإنترنت عبر قاعدة بيانات SQLite.',
  'onboarding.disclaimer.p3': '3. لا يُعتبر هذا التطبيق جهازاً طبياً معتمداً ولا يقوم بأي فرز سريري تلقائي أو وصفات دوائية.',
  'onboarding.disclaimer.p4': '4. هذا النموذج الأولي لا يحل محل الرعاية الطبية الطارئة. في حال حدوث تعرض فعلي، اتبع فوراً بروتوكول الطوارئ بمؤسستك واستشر الخدمات الطبية المستعجلة دون تأخير.',
  'onboarding.disclaimer.checkbox': 'لقد فهمت الطبيعة الأكاديمية للنموذج الأولي والطابع الاصطناعي للبيانات.',
  'onboarding.disclaimer.accept': 'قبول ومتابعة',
  'onboarding.picker.title': 'حسابات العرض التجريبي',
  'onboarding.picker.subtitle': 'اختر أحد الأدوار الخمسة المعتمدة لمعاينة مسارات العمل وحدود الصلاحيات.',
  'onboarding.picker.syntheticNotice': 'حسابات اصطناعية محلية بدون كلمة مرور. الرموز التعريفية (مثل NURSE-001) هي إشارات توضيحية للمقيّمين.',
  'onboarding.picker.enter': 'الدخول إلى مساحة العمل',
  'onboarding.picker.role1.code': 'NURSE-001',
  'onboarding.picker.role1.title': 'المهني الصحي المعرَّض',
  'onboarding.picker.role1.desc': 'إبلاغ عن حادث تعرض ومتابعة الملفات الخاصة.',
  'onboarding.picker.role2.code': 'ADMIN-001',
  'onboarding.picker.role2.title': 'إشراف التمريض وإدارة الرعاية',
  'onboarding.picker.role2.desc': 'المراجعة الإدارية وطلب التصحيح والتحقق.',
  'onboarding.picker.role3.code': 'OCC-001',
  'onboarding.picker.role3.title': 'الصحة والطب المهني (SST)',
  'onboarding.picker.role3.desc': 'المتابعة الطبية وإدارة ملفات التنسيق بعد التعرض.',
  'onboarding.picker.role4.code': 'QUAL-001',
  'onboarding.picker.role4.title': 'خلية الجودة وإدارة المخاطر',
  'onboarding.picker.role4.desc': 'المراقبة الوبائية التجميعية وخطة الإجراءات الوقائية.',
  'onboarding.picker.role5.code': 'ADMIN-TECH',
  'onboarding.picker.role5.title': 'الإدارة التقنية',
  'onboarding.picker.role5.desc': 'تشخيص النموذج وإعادة تعيين بيانات العرض التوضيحي.',

  // ─── Phase 2E.1.4.3: Batch 4 Declaration List & Details ───
  'list.filter.all': 'الكل',
  'list.filter.draft': 'المسودات',
  'list.filter.submitted': 'المقدمة',
  'list.filter.under_review': 'قيد المراجعة',
  'list.filter.closed': 'مغلقة',
  'list.adminQueueShortcut': 'طابور المراجعة',
  'list.restrictedTitle': 'وصول مقيد',
  'list.restrictedMessage': 'دورك لا يسمح لك بالوصول إلى قائمة التصريحات.',
  'list.incidentType': 'نوع التعرض',
  'list.title.admin': 'جميع التصريحات',
  'details.tab.summary': 'ملخص',
  'details.tab.incident': 'الحادثة',
  'details.tab.measures': 'التدابير',
  'details.tab.status': 'الحالة',
  'details.tab.followup': 'المتابعة',
  'details.followup.noCoordination': 'لا توجد متابعة صحة مهنية مسجلة.',
  'details.followup.coordinationStatus': 'حالة المتابعة',
  'details.followup.coordinationDate': 'بدأ في',
  'details.followup.updatedAt': 'آخر تحديث',
  'details.followup.adminSummary': 'ملخص التنسيق (إداري)',
  'details.followup.reason': 'سبب التنسيق',
  'details.followup.acknowledgedAt': 'تم الاعتراف في',
  'details.followup.completedAt': 'مكتمل في',
  'details.restrictedAccess': 'وصول غير مصرح به',
  'details.notFound': 'التصريح غير موجود.',
  'details.reviewHistory': 'سجل المراجعات',
  'details.reviewAction': 'مراجعة التصريح',
  'details.createCoordination': 'بدء متابعة الصحة المهنية',
  'details.respondToCorrection': 'الرد على طلب التصحيح',
  'details.correctionPending': 'تم طلب تصحيح لهذا التصريح.',
};

export let currentLocale: SupportedLocale = DEFAULT_LOCALE;

type LocaleListener = (locale: SupportedLocale) => void;
const localeListeners = new Set<LocaleListener>();

/**
 * Set active runtime locale. Notifies all active subscribers.
 */
export function setLocale(locale: SupportedLocale): void {
  if (SUPPORTED_LOCALES.includes(locale)) {
    currentLocale = locale;
    localeListeners.forEach((listener) => {
      try {
        listener(locale);
      } catch (err) {
        console.warn('[Localization] Listener error:', err);
      }
    });
  }
}

/** Get current runtime locale */
export function getLocale(): SupportedLocale {
  return currentLocale;
}

/** Subscribe to locale changes */
export function subscribeLocale(listener: LocaleListener): () => void {
  localeListeners.add(listener);
  return () => {
    localeListeners.delete(listener);
  };
}

/**
 * React hook that returns the active runtime locale and triggers a component re-render when it changes.
 */
export function useLocale(): SupportedLocale {
  const [locale, setLocaleState] = useState<SupportedLocale>(currentLocale);
  useEffect(() => {
    return subscribeLocale((newLocale) => setLocaleState(newLocale));
  }, []);
  return locale;
}

export function useLayoutDirection(): LayoutDirection {
  return resolveLayoutDirection(useLocale());
}

export async function initializeLocale(): Promise<void> {
  try {
    const AsyncStorage = require('@react-native-async-storage/async-storage').default;
    const savedLocale = await AsyncStorage.getItem(LOCALE_STORAGE_KEY);
    if (SUPPORTED_LOCALES.includes(savedLocale as SupportedLocale)) {
      setLocale(savedLocale as SupportedLocale);
    }
  } catch (err) {
    console.error('[Localization] Failed to load saved locale:', err);
  }
}

export const translations: Record<SupportedLocale, TranslationMap> = { fr, en, ar };

/** Translate a key for the given locale, falling back to current locale or French. */
export function t(key: TranslationKey, locale?: SupportedLocale): string {
  const activeLocale = locale ?? currentLocale;
  return translations[activeLocale]?.[key] ?? translations[DEFAULT_LOCALE]?.[key] ?? key;
}

// ─── Phase 2D.2E: In-App Notification Localization & Formatting ───────────────

export interface NotificationFormatOptions {
  locale?: SupportedLocale;
  params?: Record<string, string | number | null | undefined>;
}

export interface FormattedNotification {
  title: string;
  message: string;
}

/**
 * Formats a single notification text template with fallback and interpolation.
 *
 * Rules:
 * 1. Checks active locale dictionary (or requested locale).
 * 2. If missing, undefined, or empty, falls back to French (DEFAULT_LOCALE).
 * 3. If key is completely absent from all dictionaries, returns the raw key (documented fallback).
 * 4. Interpolates `{paramName}` tokens safely.
 * 5. Missing or null/undefined parameters are replaced with an empty string and adjacent
 *    whitespace is normalized, guaranteeing no 'undefined', 'null', or malformed braces remain.
 */
export function formatNotificationText(
  key: string,
  params?: Record<string, string | number | null | undefined>,
  locale?: SupportedLocale,
): string {
  const activeLocale = locale ?? currentLocale;
  const dict = translations[activeLocale] as Record<string, string> | undefined;
  const fallbackDict = translations[DEFAULT_LOCALE] as Record<string, string>;

  let text = dict?.[key];
  if (!text || text.trim() === '') {
    text = fallbackDict?.[key];
  }
  if (!text || text.trim() === '') {
    return key;
  }

  // Safely interpolate parameters
  return text
    .replace(/\{([a-zA-Z0-9_]+)\}/g, (_match, paramName) => {
      const val = params?.[paramName];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        return String(val);
      }
      return '';
    })
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1')
    .trim();
}

/**
 * Pure notification formatting function for in-app notification records.
 * Localizes title and message using active application locale (or explicit locale option),
 * interpolating entity_reference as `{reference}` along with any custom parameters.
 *
 * Fully decoupled from React components, hooks, and SQLite database operations.
 */
export function formatNotification(
  notification: {
    title_key: string;
    message_key: string;
    entity_reference?: string | null;
  },
  options?: NotificationFormatOptions,
): FormattedNotification {
  const locale = options?.locale ?? currentLocale;
  const combinedParams: Record<string, string | number | null | undefined> = {
    reference: notification.entity_reference ?? undefined,
    entity_reference: notification.entity_reference ?? undefined,
    ...(options?.params ?? {}),
  };

  const title = formatNotificationText(notification.title_key, combinedParams, locale);
  const message = formatNotificationText(notification.message_key, combinedParams, locale);

  return { title, message };
}
