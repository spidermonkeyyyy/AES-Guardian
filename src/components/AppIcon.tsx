import React from 'react';
import {
  StyleProp,
  TextStyle,
  View,
  ViewStyle,
} from 'react-native';
import {
  HugeiconsIcon,
  IconSvgElement,
} from '@hugeicons/react-native';
import ArrowDown01Icon from '@hugeicons/core-free-icons/ArrowDown01Icon';
import ArrowLeft01Icon from '@hugeicons/core-free-icons/ArrowLeft01Icon';
import ArrowRight01Icon from '@hugeicons/core-free-icons/ArrowRight01Icon';
import ArrowUp01Icon from '@hugeicons/core-free-icons/ArrowUp01Icon';
import ChevronDownIcon from '@hugeicons/core-free-icons/ChevronDownIcon';
import ChevronLeftIcon from '@hugeicons/core-free-icons/ChevronLeftIcon';
import ChevronRightIcon from '@hugeicons/core-free-icons/ChevronRightIcon';
import ChevronUpIcon from '@hugeicons/core-free-icons/ChevronUpIcon';
import Home01Icon from '@hugeicons/core-free-icons/Home01Icon';
import Activity01Icon from '@hugeicons/core-free-icons/Activity01Icon';
import MessageCircleIcon from '@hugeicons/core-free-icons/MessageCircleIcon';
import MessageSquareIcon from '@hugeicons/core-free-icons/MessageSquareIcon';
import Package01Icon from '@hugeicons/core-free-icons/Package01Icon';
import UserIcon from '@hugeicons/core-free-icons/UserIcon';
import UserGroupIcon from '@hugeicons/core-free-icons/UserGroupIcon';
import UserSwitchIcon from '@hugeicons/core-free-icons/UserSwitchIcon';
import Notification03Icon from '@hugeicons/core-free-icons/Notification03Icon';
import AlertCircleIcon from '@hugeicons/core-free-icons/AlertCircleIcon';
import Alert01Icon from '@hugeicons/core-free-icons/Alert01Icon';
import CheckmarkCircle01Icon from '@hugeicons/core-free-icons/CheckmarkCircle01Icon';
import Tick01Icon from '@hugeicons/core-free-icons/Tick01Icon';
import Shield01Icon from '@hugeicons/core-free-icons/Shield01Icon';
import ShieldCheckIcon from '@hugeicons/core-free-icons/ShieldCheckIcon';
import MailSend01Icon from '@hugeicons/core-free-icons/MailSend01Icon';
import Clock01Icon from '@hugeicons/core-free-icons/Clock01Icon';
import ClipboardIcon from '@hugeicons/core-free-icons/ClipboardIcon';
import ClipboardListIcon from '@hugeicons/core-free-icons/ClipboardListIcon';
import Moon01Icon from '@hugeicons/core-free-icons/Moon01Icon';
import Sun01Icon from '@hugeicons/core-free-icons/Sun01Icon';
import Settings01Icon from '@hugeicons/core-free-icons/Settings01Icon';
import Search01Icon from '@hugeicons/core-free-icons/Search01Icon';
import Medicine01Icon from '@hugeicons/core-free-icons/Medicine01Icon';
import HeartIcon from '@hugeicons/core-free-icons/HeartIcon';
import FilterIcon from '@hugeicons/core-free-icons/FilterIcon';
import GlobeIcon from '@hugeicons/core-free-icons/GlobeIcon';
import SmartPhone01Icon from '@hugeicons/core-free-icons/SmartPhone01Icon';
import Logout01Icon from '@hugeicons/core-free-icons/Logout01Icon';
import CopyIcon from '@hugeicons/core-free-icons/CopyIcon';
import InformationCircleIcon from '@hugeicons/core-free-icons/InformationCircleIcon';
import HelpCircleIcon from '@hugeicons/core-free-icons/HelpCircleIcon';
import QuestionIcon from '@hugeicons/core-free-icons/QuestionIcon';
import Book01Icon from '@hugeicons/core-free-icons/Book01Icon';
import BookOpen01Icon from '@hugeicons/core-free-icons/BookOpen01Icon';
import Calendar01Icon from '@hugeicons/core-free-icons/Calendar01Icon';
import JusticeScale01Icon from '@hugeicons/core-free-icons/JusticeScale01Icon';
import Target01Icon from '@hugeicons/core-free-icons/Target01Icon';
import Add01Icon from '@hugeicons/core-free-icons/Add01Icon';
import StethoscopeIcon from '@hugeicons/core-free-icons/StethoscopeIcon';
import LockIcon from '@hugeicons/core-free-icons/LockIcon';
import SecurityWarningIcon from '@hugeicons/core-free-icons/SecurityWarningIcon';
import Video01Icon from '@hugeicons/core-free-icons/Video01Icon';
import Delete01Icon from '@hugeicons/core-free-icons/Delete01Icon';
import Cancel01Icon from '@hugeicons/core-free-icons/Cancel01Icon';
import File01Icon from '@hugeicons/core-free-icons/File01Icon';
import FileAddIcon from '@hugeicons/core-free-icons/FileAddIcon';
import FileEditIcon from '@hugeicons/core-free-icons/FileEditIcon';
import DocumentValidationIcon from '@hugeicons/core-free-icons/DocumentValidationIcon';
import Chart02Icon from '@hugeicons/core-free-icons/Chart02Icon';
import Task01Icon from '@hugeicons/core-free-icons/Task01Icon';
import Mail01Icon from '@hugeicons/core-free-icons/Mail01Icon';
import SparklesIcon from '@hugeicons/core-free-icons/SparklesIcon';
import DashboardSquare01Icon from '@hugeicons/core-free-icons/DashboardSquare01Icon';
import PlayIcon from '@hugeicons/core-free-icons/PlayIcon';
import {
  getLayoutRowDirection,
  LayoutDirection,
  useLayoutDirection,
} from '../localization';
import { useTheme } from '../theme/ThemeContext';
import AppText from './AppText';

export const iconSizes = {
  xs: 12,
  sm: 16,
  md: 20,
  lg: 24,
  xl: 32,
  display: 48,
} as const;

export const iconStrokeWidths = {
  compact: 1.5,
  standard: 1.75,
  strong: 2,
} as const;

export const appIconRegistry = {
  'arrow-left': ArrowLeft01Icon,
  'arrow-right': ArrowRight01Icon,
  'arrow-up': ArrowUp01Icon,
  'arrow-down': ArrowDown01Icon,
  'chevron-left': ChevronLeftIcon,
  'chevron-right': ChevronRightIcon,
  'chevron-up': ChevronUpIcon,
  'chevron-down': ChevronDownIcon,
  home: Home01Icon,
  activity: Activity01Icon,
  'message-circle': MessageCircleIcon,
  'message-square': MessageSquareIcon,
  package: Package01Icon,
  user: UserIcon,
  users: UserGroupIcon,
  'user-switch': UserSwitchIcon,
  bell: Notification03Icon,
  'alert-circle': AlertCircleIcon,
  'alert-triangle': SecurityWarningIcon,
  check: Tick01Icon,
  'check-circle': CheckmarkCircle01Icon,
  'shield-check': ShieldCheckIcon,
  shield: Shield01Icon,
  send: MailSend01Icon,
  clock: Clock01Icon,
  clipboard: ClipboardIcon,
  'clipboard-list': ClipboardListIcon,
  moon: Moon01Icon,
  sun: Sun01Icon,
  sliders: Settings01Icon,
  settings: Settings01Icon,
  search: Search01Icon,
  disc: Medicine01Icon,
  heart: HeartIcon,
  'log-out': Logout01Icon,
  copy: CopyIcon,
  info: InformationCircleIcon,
  filter: FilterIcon,
  globe: GlobeIcon,
  'help-circle': HelpCircleIcon,
  question: QuestionIcon,
  smartphone: SmartPhone01Icon,
  layout: DashboardSquare01Icon,
  mail: Mail01Icon,
  medical: StethoscopeIcon,
  document: File01Icon,
  'document-add': FileAddIcon,
  'document-edit': FileEditIcon,
  report: DocumentValidationIcon,
  chart: Chart02Icon,
  'bar-chart-2': Chart02Icon,
  scale: JusticeScale01Icon,
  target: Target01Icon,
  add: Add01Icon,
  book: Book01Icon,
  'book-open': BookOpen01Icon,
  calendar: Calendar01Icon,
  lock: LockIcon,
  warning: Alert01Icon,
  'security-warning': SecurityWarningIcon,
  video: Video01Icon,
  delete: Delete01Icon,
  cancel: Cancel01Icon,
  play: PlayIcon,
  sparkles: SparklesIcon,
  task: Task01Icon,
} satisfies Record<string, IconSvgElement>;

const directionalIcons = {
  back: { ltr: appIconRegistry['arrow-left'], rtl: appIconRegistry['arrow-right'] },
  forward: { ltr: appIconRegistry['arrow-right'], rtl: appIconRegistry['arrow-left'] },
  'back-chevron': { ltr: appIconRegistry['chevron-left'], rtl: appIconRegistry['chevron-right'] },
  'forward-chevron': { ltr: appIconRegistry['chevron-right'], rtl: appIconRegistry['chevron-left'] },
} satisfies Record<string, Record<LayoutDirection, IconSvgElement>>;

export type AppIconName = keyof typeof appIconRegistry | keyof typeof directionalIcons | (string & {});

export function resolveAppIcon(
  name: string,
  direction: LayoutDirection,
): IconSvgElement {
  if (name in directionalIcons) {
    return directionalIcons[name as keyof typeof directionalIcons][direction];
  }
  if (name in appIconRegistry) {
    return appIconRegistry[name as keyof typeof appIconRegistry];
  }
  return appIconRegistry['help-circle'];
}

export interface AppIconProps {
  name: AppIconName;
  size?: number | keyof typeof iconSizes;
  color?: string;
  strokeWidth?: number | keyof typeof iconStrokeWidths;
  accessibilityLabel?: string;
  decorative?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

export const AppIcon: React.FC<AppIconProps> = ({
  name,
  size = 'md',
  color,
  strokeWidth = 'standard',
  accessibilityLabel,
  decorative,
  style,
  testID,
}) => {
  const { colors } = useTheme();
  const direction = useLayoutDirection();
  const isDecorative = decorative ?? !accessibilityLabel;

  return (
    <HugeiconsIcon
      icon={resolveAppIcon(name, direction)}
      size={typeof size === 'number' ? size : iconSizes[size]}
      color={color ?? colors.foreground}
      strokeWidth={
        typeof strokeWidth === 'number' ? strokeWidth : iconStrokeWidths[strokeWidth]
      }
      accessible={!isDecorative}
      accessibilityLabel={isDecorative ? undefined : accessibilityLabel}
      accessibilityRole={isDecorative ? undefined : 'image'}
      importantForAccessibility={isDecorative ? 'no-hide-descendants' : 'auto'}
      style={style}
      testID={testID ?? `app-icon-${name}`}
    />
  );
};

export interface AppIconLabelProps {
  name: AppIconName;
  children: React.ReactNode;
  size?: number | keyof typeof iconSizes;
  color?: string;
  textStyle?: StyleProp<TextStyle>;
  style?: StyleProp<ViewStyle>;
}

export const AppIconLabel: React.FC<AppIconLabelProps> = ({
  name,
  children,
  size = 'sm',
  color,
  textStyle,
  style,
}) => {
  const direction = useLayoutDirection();
  const { colors } = useTheme();

  return (
    <View
      style={[
        {
          flexDirection: getLayoutRowDirection(direction),
          alignItems: 'center',
          gap: 6,
        },
        style,
      ]}
    >
      <AppIcon name={name} size={size} color={color} />
      <AppText style={[{ color: colors.foreground }, textStyle]}>{children}</AppText>
    </View>
  );
};

export default AppIcon;
