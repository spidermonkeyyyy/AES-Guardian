import type { SupportedLocale } from './index';

export type DemoNarrativeField =
  | 'circumstances'
  | 'exposure_description'
  | 'protective_measures_taken'
  | 'notes'
  | 'correction_reason'
  | 'review_comments';

type NarrativeTranslations = Partial<Record<SupportedLocale, string>>;

const DEMO_NARRATIVE_TRANSLATIONS: Record<
  string,
  Partial<Record<DemoNarrativeField, NarrativeTranslations>>
> = {
  'AES-2026-DEMO-01': {
    circumstances: {
      fr: "Piqûre accidentelle lors du recapuchonnage d'une aiguille usagée après prélèvement veineux.",
      en: 'Accidental needlestick while recapping a used needle after venous sampling.',
      ar: 'إصابة وخز إبرية عرضية أثناء إعادة تغطية إبرة مستعملة بعد أخذ عينة وريدية.',
    },
    exposure_description: {
      fr: 'Aiguille creuse de calibre 21G souillée de sang veineux. Perforation du gant en latex.',
      en: '21G hollow needle contaminated with venous blood. Perforation of the latex glove.',
      ar: 'إبرة مجوفة مقاس 21G ملوثة بالدم الوريدي. ثقب قفاز اللاتكس.',
    },
    protective_measures_taken: {
      fr: 'Gants simples en latex portés. Collecteur pour objets piquants/tranchants situé à distance.',
      en: 'Single latex gloves worn. Sharp-object container located at a distance.',
      ar: 'ارتداء قفازات لاتكس مفردة. وعاء الأدوات الحادة موجود في مكان بعيد.',
    },
    notes: {
      fr: 'Déclaration immédiate transmise pour examen administratif.',
      en: 'Immediate declaration sent for administrative review.',
      ar: 'تم إرسال البلاغ الفوري للمراجعة الإدارية.',
    },
  },
  'AES-2026-DEMO-02': {
    circumstances: {
      fr: "Projection oculaire de liquide biologique lors d'une aspiration chez un patient agité en réanimation.",
      en: 'Ocular splash of biological fluid during suctioning of an agitated patient in intensive care.',
      ar: 'رشاح سائل بيولوجي في العين أثناء شفط السوائل لمريض مضطرب في وحدة العناية المركزة.',
    },
    exposure_description: {
      fr: 'Projection au niveau de l’œil droit sans barrière de protection faciale.',
      en: 'Splash to the right eye without a facial protection barrier.',
      ar: 'رشّ في العين اليمنى دون حاجز للحماية الوجهية.',
    },
    protective_measures_taken: {
      fr: 'Masque chirurgical et gants portés. Absence de lunettes de protection.',
      en: 'Surgical mask and gloves worn. Protective eyewear was not used.',
      ar: 'تم ارتداء كمامة جراحية وقفازات. ولم تُستخدم نظارات واقية.',
    },
    notes: {
      fr: 'Attente de précisions suite à revue administrative.',
      en: 'Awaiting clarification following administrative review.',
      ar: 'بانتظار توضيحات بعد المراجعة الإدارية.',
    },
    correction_reason: {
      fr: 'Veuillez préciser le délai effectif du rinçage oculaire immédiat au sérum physiologique et les mesures prises sur place.',
      en: 'Please specify the actual delay before immediate ocular rinsing with saline solution and the measures taken on site.',
      ar: 'يرجى تحديد المدة الفعلية لشطف العين فورًا بمحلول ملحي والتدابير المتخذة في الموقع.',
    },
    review_comments: {
      fr: 'Examen administratif initial : rinçage non précisé.',
      en: 'Initial administrative review: rinsing was not specified.',
      ar: 'المراجعة الإدارية الأولية: لم يُذكر الشطف بشكل واضح.',
    },
  },
  'AES-2026-DEMO-03': {
    circumstances: {
      fr: "Blessure avec trocart de perfusion lors d'une pose de voie veineuse périphérique en urgence.",
      en: 'Injury with a perfusion trocar while establishing peripheral venous access in emergency care.',
      ar: 'إصابة باستخدام مدخل تسريب أثناء وضع وريد طرفي في الطوارئ.',
    },
    exposure_description: {
      fr: 'Perforation face palmaire de l’index gauche avec trocart souillé.',
      en: 'Contaminated trocar perforation to the palm side of the left index finger.',
      ar: 'ثقب بسطح راحة إصبع السبابة الأيسر باستخدام مدخل ملوّث.',
    },
    protective_measures_taken: {
      fr: 'Gants en latex.',
      en: 'Latex gloves worn.',
      ar: 'قفازات لاتكس.',
    },
    notes: {
      fr: 'Dossier transmis au service de Santé au Travail pour prise en charge.',
      en: 'Record transmitted to Occupational Health for follow-up.',
      ar: 'تم تحويل الملف إلى قسم الصحة المهنية للمتابعة.',
    },
    review_comments: {
      fr: 'Déclaration administrativement recevable. Transmission SST initiée.',
      en: 'Declaration administratively admissible. Occupational Health transmission initiated.',
      ar: 'البلاغ مقبول إداريًا. تم بدء التحويل إلى الصحة المهنية.',
    },
  },
  'AES-2026-DEMO-04': {
    circumstances: {
      fr: "Coupure superficielle avec une lame de bistouri lors du déballage d'un plateau d'instruments.",
      en: 'Superficial cut with a scalpel blade while unpacking an instrument tray.',
      ar: 'جرح سطحي بواسطة شفرة مشرط أثناء تفريغ صينية أدوات.',
    },
    exposure_description: {
      fr: 'Plaie superficielle éminence thénar main droite.',
      en: 'Superficial wound on the thenar eminence of the right hand.',
      ar: 'جرح سطحي في منطقة الناصية الكَبّة لليد اليمنى.',
    },
    protective_measures_taken: {
      fr: 'Double paire de gants chirurgicaux.',
      en: 'Double pair of surgical gloves worn.',
      ar: 'ارتداء زوجين من القفازات الجراحية.',
    },
    notes: {
      fr: 'Dossier clos après suivi sérologique complet.',
      en: 'Record closed after complete serological follow-up.',
      ar: 'أُغلق الملف بعد متابعة مصلية كاملة.',
    },
  },
};

export function resolveDemoNarrative(
  reference: string | null | undefined,
  field: DemoNarrativeField,
  value: string | null | undefined,
  locale: SupportedLocale,
): string {
  if (!reference || !value) return value ?? '';
  const translations = DEMO_NARRATIVE_TRANSLATIONS[reference]?.[field];
  const exactFrenchSeed = translations?.fr;
  if (!exactFrenchSeed || value !== exactFrenchSeed) return value;
  return translations[locale] ?? value;
}
