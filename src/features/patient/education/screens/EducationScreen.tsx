import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../../../../theme/ThemeContext';

const EducationScreen: React.FC<{ onSmokingCessation?: () => void; onRehabilitation?: () => void; onEducationalContent?: () => void }> = ({ onSmokingCessation, onRehabilitation, onEducationalContent }) => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.header}>Éducation du patient</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Programme de rééducation</Text>
        <Text style={styles.cardBody}>Votre programme personnalisé est disponible. Consultez vos exercices et suivez votre progression.</Text>
      </View>

      <TouchableOpacity style={styles.card} onPress={onSmokingCessation ? onSmokingCessation : undefined}>
        <Text style={styles.cardTitle}>Sevrage tabagique</Text>
        <Text style={styles.cardBody}>Suivez votre consommation de cigarettes et les déclencheurs. Notez chaque entrée quotidienne.</Text>
        <Text style={styles.cardLink}>Ouvrir →</Text>
      </TouchableOpacity>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Contenu éducatif</Text>
        <Text style={styles.cardBody}>Articles validés sur la santé respiratoire, le sevrage, et la rééducation. Note : le contenu est un placeholder et sera remplacé par la version validée.</Text>
      </View>

      <TouchableOpacity style={styles.button}>
        <Text style={styles.buttonText}>Voir mon programme</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

function createStyles(colors: any) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  header: { fontSize: 24, fontWeight: 'bold', color: colors.primary, marginBottom: 16 },
  card: { backgroundColor: colors.primaryForeground, borderRadius: 8, padding: 16, marginBottom: 12, elevation: 1 },
  cardTitle: { fontSize: 18, fontWeight: '600', color: colors.primary, marginBottom: 6 },
  cardBody: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
  button: { backgroundColor: colors.primary, borderRadius: 6, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  buttonText: { color: colors.primaryForeground, fontSize: 16, fontWeight: '600' },
  cardLink: { color: colors.primary, fontSize: 14, fontWeight: '600', marginTop: 4 },
});
}

export default EducationScreen;