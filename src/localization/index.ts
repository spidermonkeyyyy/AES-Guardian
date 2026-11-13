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

export type SupportedLocale = 'fr' | 'en' | 'ar';
export const SUPPORTED_LOCALES: SupportedLocale[] = ['fr', 'en', 'ar'];
export const DEFAULT_LOCALE: SupportedLocale = 'fr';

export function isRTL(locale: SupportedLocale): boolean {
  return locale === 'ar';
}

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  fr: 'Français',
  en: 'English',
  ar: 'العربية',
};

// ─── Translation keys ─────────────────────────────────────────────────────────

export type TranslationKey =
  // App
  | 'app.name'
  | 'app.loading'
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
  | 'list.incidentDate'
  | 'list.status'
  // Declaration form
  | 'form.title.new'
  | 'form.title.edit'
  | 'form.incidentDate'
  | 'form.incidentDate.placeholder'
  | 'form.incidentType'
  | 'form.incidentType.placeholder'
  | 'form.incidentType.percutaneous'
  | 'form.incidentType.mucocutaneous'
  | 'form.incidentType.sexual_assault'
  | 'form.incidentType.other'
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
  | 'correction.inputLabel'
  | 'correction.inputPlaceholder'
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
  | 'prevention.create.title'
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
  | 'prevention.detail.title'
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
  | 'prevention.detail.audit_history'
  | 'prevention.detail.createdAt'
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
  | 'workspace.activeRoleIndicator';

// ─── Translations ─────────────────────────────────────────────────────────────

type TranslationMap = Record<TranslationKey, string>;

const fr: TranslationMap = {
  'app.name': 'AES Guardian',
  'app.loading': 'Chargement…',
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
  'list.incidentDate': 'Date de l\'incident',
  'list.status': 'Statut',

  'form.title.new': 'Nouvelle déclaration AES',
  'form.title.edit': 'Modifier le brouillon',
  'form.incidentDate': 'Date et heure de l\'incident',
  'form.incidentDate.placeholder': 'JJ/MM/AAAA',
  'form.incidentType': 'Type d\'exposition',
  'form.incidentType.placeholder': 'Sélectionner le type d\'exposition',
  'form.incidentType.percutaneous': 'Accident percutané (piqûre / coupure)',
  'form.incidentType.mucocutaneous': 'Projection muqueuse ou cutanée',
  'form.incidentType.sexual_assault': 'Agression sexuelle',
  'form.incidentType.other': 'Autre (préciser dans les circonstances)',
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
  'correction.inputLabel': 'Votre réponse / précisions (obligatoire)',
  'correction.inputPlaceholder': 'Apportez ici les précisions ou compléments demandés…',
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
  'prevention.create.title': "Nouvelle Action CAPA",
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
  'prevention.detail.title': "Détail de l'Action",
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
  'prevention.detail.audit_history': "Historique des modifications",
  'prevention.detail.createdAt': "Créée le",
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
  'workspace.tech.engine': "Moteur : SQLite (expo-sqlite / op-sqlite)",
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
};

const en: TranslationMap = {
  'app.name': 'AES Guardian',
  'app.loading': 'Loading…',
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
  'list.incidentDate': 'Incident Date',
  'list.status': 'Status',

  'form.title.new': 'New AES Declaration',
  'form.title.edit': 'Edit Draft',
  'form.incidentDate': 'Incident Date and Time',
  'form.incidentDate.placeholder': 'DD/MM/YYYY',
  'form.incidentType': 'Type of Exposure',
  'form.incidentType.placeholder': 'Select exposure type',
  'form.incidentType.percutaneous': 'Percutaneous accident (needlestick / cut)',
  'form.incidentType.mucocutaneous': 'Mucocutaneous or cutaneous splash',
  'form.incidentType.sexual_assault': 'Sexual assault',
  'form.incidentType.other': 'Other (describe in circumstances)',
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
  'correction.inputLabel': 'Your response / clarifications (required)',
  'correction.inputPlaceholder': 'Provide the requested details or clarifications here…',
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
  'prevention.create.title': "New CAPA Action",
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
  'prevention.detail.title': "Action Detail",
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
  'prevention.detail.audit_history': "Change History",
  'prevention.detail.createdAt': "Created On",
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
  'workspace.tech.engine': "Engine: SQLite (expo-sqlite / op-sqlite)",
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
};

const ar: TranslationMap = {
  // REQUIRES_VALIDATION: Arabic translations should be reviewed by a qualified professional.
  'app.name': 'حارس AES',
  'app.loading': '…جارٍ التحميل',
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
  'list.incidentDate': 'تاريخ الحادثة',
  'list.status': 'الحالة',

  'form.title.new': 'تصريح AES جديد',
  'form.title.edit': 'تعديل المسودة',
  'form.incidentDate': 'تاريخ ووقت الحادثة',
  'form.incidentDate.placeholder': 'يي/شش/سسسس',
  'form.incidentType': 'نوع التعرض',
  'form.incidentType.placeholder': 'اختر نوع التعرض',
  'form.incidentType.percutaneous': 'حادث جلدي (وخز إبرة / جرح)',
  'form.incidentType.mucocutaneous': 'تناثر على الأغشية المخاطية أو الجلد',
  'form.incidentType.sexual_assault': 'اعتداء جنسي',
  'form.incidentType.other': 'أخرى (يرجى الوصف في خانة الملابسات)',
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
  'correction.inputLabel': 'ردّك / توضيحاتك (مطلوب)',
  'correction.inputPlaceholder': '…اكتب التفاصيل المطلوبة أو توضيحاتك هنا',
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
  'prevention.create.title': "إجراء CAPA جديد",
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
  'prevention.detail.title': "تفاصيل الإجراء",
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
  'prevention.detail.audit_history': "سجل التغييرات",
  'prevention.detail.createdAt': "أُنشئ في",
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
  'workspace.tech.engine': "المحرك: SQLite (expo-sqlite / op-sqlite)",
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
};

export const translations: Record<SupportedLocale, TranslationMap> = { fr, en, ar };

/** Translate a key for the given locale, falling back to French. */
export function t(key: TranslationKey, locale: SupportedLocale = DEFAULT_LOCALE): string {
  return translations[locale]?.[key] ?? translations[DEFAULT_LOCALE][key] ?? key;
}
