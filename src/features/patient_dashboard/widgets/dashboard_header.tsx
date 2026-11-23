import React from 'react';
import { Text, View } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

const DashboardHeader = () => {
  const { colors } = useTheme();
  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });
  return (
    <View style={{
      backgroundColor: colors.background,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    }}>
      <Text style={{ margin: 0, fontSize: 20, color: colors.foreground }}>
        Accueil — {today}
      </Text>
    </View>
  );
};
export default DashboardHeader;