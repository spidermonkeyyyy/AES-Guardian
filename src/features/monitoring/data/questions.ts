import { MonitoringQuestion, QuestionType, QuestionOption } from '../../../types/monitoring-question';

export const MONITORING_QUESTIONS: MonitoringQuestion[] = [
  {
    id: 'dyspnea',
    type: QuestionType.singleChoice,
    title: "Comment évaluez-vous votre essoufflement aujourd'hui ?",
    description: "Échelle d'évaluation clinique mMRC",
    order: 1,
    required: true,
    options: [
      { id: 'mmrc_0', label: 'Niveau 0', description: "Je suis essoufflé uniquement lors d'efforts importants (ex. courir)." },
      { id: 'mmrc_1', label: 'Niveau 1', description: 'Je suis essoufflé lorsque je marche rapidement à plat ou en montant une côte.' },
      { id: 'mmrc_2', label: 'Niveau 2', description: 'Je dois ralentir sur du plat ou m\'arrêter pour respirer après 100 mètres.' },
      { id: 'mmrc_3', label: 'Niveau 3', description: 'Je dois m\'arrêter pour reprendre mon souffle après quelques minutes de marche.' },
      { id: 'mmrc_4', label: 'Niveau 4', description: 'Je suis trop essoufflé pour quitter la maison ou lors de l\'habillage.' },
    ],
  },
  {
    id: 'cough',
    type: QuestionType.singleChoice,
    title: 'Avez-vous davantage toussé aujourd\'hui ?',
    description: 'Comparaison par rapport à votre niveau habituel',
    order: 2,
    required: true,
    options: [
      { id: 'cough_normal', label: 'Pas plus que d\'habitude', description: 'La quinte de toux reste identique.' },
      { id: 'cough_mild', label: 'Un peu plus que d\'habitude', description: 'Augmentation légère de la fréquence des toux.' },
      { id: 'cough_severe', label: 'Beaucoup plus que d\'habitude', description: 'Toux persistante ou invalidante au cours de la journée.' },
    ],
  },
  {
    id: 'sputum',
    type: QuestionType.singleChoice,
    title: 'Avez-vous remarqué un changement dans vos expectorations ?',
    description: 'Quantité et aspect des crachats',
    order: 3,
    required: true,
    options: [
      { id: 'sputum_normal', label: 'Pas de changement', description: 'Aspect et volume habituels.' },
      { id: 'sputum_amount', label: 'Quantité augmentée', description: 'Volume des sécrétions plus important.' },
      { id: 'sputum_color', label: 'Aspect ou couleur modifiée', description: 'Secrétions devenues purulentes (jaunâtres / verdâtres).' },
    ],
  },
  {
    id: 'spo2',
    type: QuestionType.numericInput,
    title: 'Votre saturation en oxygène (SpO₂)',
    description: 'Indiquez la valeur mesurée avec votre oxymètre de pouls.',
    order: 4,
    unit: '%',
    minValue: 70,
    maxValue: 100,
    required: false,
    options: [],
  },
];
