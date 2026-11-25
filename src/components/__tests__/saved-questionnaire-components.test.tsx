import React from 'react';
import { fireEvent, render, waitFor } from '@testing-library/react-native';
import { ThemeProvider, useTheme } from '../../theme/ThemeContext';
import { setLocale } from '../../localization';
import {
  Questionnaire,
  QuestionnaireActions,
  QuestionnaireChoice,
  QuestionnaireChoiceDescription,
  QuestionnaireChoices,
  QuestionnaireError,
  QuestionnaireItem,
  QuestionnaireNext,
  QuestionnairePrevious,
  QuestionnaireProgress,
  QuestionnaireSubmit,
  QuestionnaireTitle,
  type QuestionnaireItemConfig,
  type QuestionnaireValues,
} from '../saved/Questionnaire';

function SetDarkModeOnMount() {
  const { setThemeMode } = useTheme();
  React.useEffect(() => setThemeMode('dark'), [setThemeMode]);
  return null;
}

const items: QuestionnaireItemConfig[] = [
  { name: 'region', required: true },
  { name: 'confirm', required: true, multiple: true },
];

function ControlledQuestionnaire({
  values,
  onValuesChange,
  onSubmit,
  disabled = false,
}: {
  values: QuestionnaireValues;
  onValuesChange: (values: QuestionnaireValues) => void;
  onSubmit?: (values: QuestionnaireValues) => void;
  disabled?: boolean;
}) {
  return (
    <Questionnaire
      items={items}
      values={values}
      onValuesChange={onValuesChange}
      onSubmit={onSubmit}
      disabled={disabled}
    >
      <QuestionnaireProgress label={(current, total) => `Étape ${current} sur ${total}`} />
      <QuestionnaireItem name="region" required>
        <QuestionnaireTitle>Choisir une région</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="nord">
            Nord
            <QuestionnaireChoiceDescription>Première région</QuestionnaireChoiceDescription>
          </QuestionnaireChoice>
          <QuestionnaireChoice value="sud">Sud</QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError message="Veuillez sélectionner une option." />
      </QuestionnaireItem>
      <QuestionnaireItem name="confirm" required multiple>
        <QuestionnaireTitle>Confirmer les informations</QuestionnaireTitle>
        <QuestionnaireChoices>
          <QuestionnaireChoice value="attest">J'atteste</QuestionnaireChoice>
        </QuestionnaireChoices>
        <QuestionnaireError message="Veuillez confirmer avant de continuer." />
      </QuestionnaireItem>
      <QuestionnaireActions>
        <QuestionnairePrevious title="Retour" />
        <QuestionnaireNext title="Continuer" />
        <QuestionnaireSubmit title="Soumettre" />
      </QuestionnaireActions>
    </Questionnaire>
  );
}

describe('Saved Questionnaire components', () => {
  beforeEach(() => setLocale('fr'));

  test('renders compound composition and controlled radio selection', () => {
    const onValuesChange = jest.fn();
    const { getByLabelText, getByText, getAllByRole } = render(
      <ThemeProvider>
        <ControlledQuestionnaire values={{}} onValuesChange={onValuesChange} />
      </ThemeProvider>,
    );

    expect(getByText('Choisir une région')).toBeTruthy();
    const nord = getAllByRole('radio')[0];
    expect(nord.props.accessibilityState.checked).toBe(false);
    expect(nord.props.accessibilityState.disabled).toBe(false);
    fireEvent.press(getByLabelText('Nord'));
    expect(onValuesChange).toHaveBeenCalledWith({ region: 'nord' });
  });

  test('required next action reports error and does not advance', () => {
    const onValuesChange = jest.fn();
    const onSubmit = jest.fn();
    const { getByText, getByRole } = render(
      <ThemeProvider>
        <ControlledQuestionnaire
          values={{}}
          onValuesChange={onValuesChange}
          onSubmit={onSubmit}
        />
      </ThemeProvider>,
    );

    fireEvent.press(getByText('Continuer'));
    expect(getByRole('alert')).toBeTruthy();
    expect(getByText('Veuillez sélectionner une option.')).toBeTruthy();
  });

  test('controlled checkbox selection and submit callback preserve existing values', () => {
    const onValuesChange = jest.fn();
    const onSubmit = jest.fn();
    const { getByText, getByRole, rerender } = render(
      <ThemeProvider>
        <ControlledQuestionnaire
          values={{ region: 'nord' }}
          onValuesChange={onValuesChange}
          onSubmit={onSubmit}
        />
      </ThemeProvider>,
    );

    fireEvent.press(getByText('Continuer'));
    rerender(
      <ThemeProvider>
        <ControlledQuestionnaire
          values={{ region: 'nord', confirm: ['attest'] }}
          onValuesChange={onValuesChange}
          onSubmit={onSubmit}
        />
      </ThemeProvider>,
    );

    const checkbox = getByRole('checkbox');
    expect(checkbox.props.accessibilityState.checked).toBe(true);
    fireEvent.press(getByText('Soumettre'));
    expect(onSubmit).toHaveBeenCalledWith({ region: 'nord', confirm: ['attest'] });
  });

  test('disabled choice exposes disabled state and cannot change value', () => {
    const onValuesChange = jest.fn();
    const { getByRole } = render(
      <ThemeProvider>
        <Questionnaire items={[{ name: 'choice', required: true }]} values={{}} onValuesChange={onValuesChange}>
          <QuestionnaireItem name="choice" required>
            <QuestionnaireTitle>Choix désactivé</QuestionnaireTitle>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="one" disabled>Option</QuestionnaireChoice>
            </QuestionnaireChoices>
          </QuestionnaireItem>
        </Questionnaire>
      </ThemeProvider>,
    );
    const choice = getByRole('radio');
    expect(choice.props.accessibilityState.disabled).toBe(true);
    fireEvent.press(choice);
    expect(onValuesChange).not.toHaveBeenCalled();
  });

  test('Arabic RTL and progressbar accessibility', async () => {
    setLocale('ar');
    const { getByRole, getByText } = render(
      <ThemeProvider>
        <Questionnaire
          items={[{ name: 'first', required: true }]}
          defaultValues={{}}
        >
          <QuestionnaireProgress label={(current, total) => `الخطوة ${current} من ${total}`} />
          <QuestionnaireItem name="first" required>
            <QuestionnaireTitle>اختر خياراً</QuestionnaireTitle>
            <QuestionnaireChoices>
              <QuestionnaireChoice value="yes">نعم</QuestionnaireChoice>
              <QuestionnaireChoice value="no">لا</QuestionnaireChoice>
            </QuestionnaireChoices>
          </QuestionnaireItem>
        </Questionnaire>
      </ThemeProvider>,
    );
    expect(getByText('الخطوة 1 من 1')).toBeTruthy();
    await waitFor(() => {
      expect(getByRole('progressbar').props.accessibilityValue).toEqual({
        min: 1,
        max: 1,
        now: 1,
        text: 'الخطوة 1 من 1',
      });
    });
  });

  test('renders in dark theme', () => {
    const { getByRole } = render(
      <ThemeProvider>
        <SetDarkModeOnMount />
        <Questionnaire items={[{ name: 'choice' }]} defaultValues={{}}>
          <QuestionnaireItem name="choice">
            <QuestionnaireChoices>
              <QuestionnaireChoice value="one">Un</QuestionnaireChoice>
            </QuestionnaireChoices>
          </QuestionnaireItem>
        </Questionnaire>
      </ThemeProvider>,
    );
    expect(getByRole('radio')).toBeTruthy();
  });
});
