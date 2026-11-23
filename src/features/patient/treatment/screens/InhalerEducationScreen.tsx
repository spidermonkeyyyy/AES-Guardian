import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../../../theme/ThemeContext';

const InhalerEducationScreen: React.FC = () => {
  const { colors } = useTheme();
  const styles = createStyles(colors);
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Technique d&rsquo;inhalation</Text>
      <Text style={styles.subtitle}>Pour votre traitement inhalé (ex: Ventoline / Turbuhaler)</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>1. Préparation</Text>
        <Text style={styles.cardBody}>Assurez-vous que l&rsquo;inhalateur est en position correcte. Vérifiez le nombre de doses restantes.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>2. Expiration</Text>
        <Text style={styles.cardBody}>Expirez doucement par la bouche pour vider vos poumons avant l&rsquo;inhalation.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>3. Inhalation</Text>
        <Text style={styles.cardBody}>Placez l&rsquo;embout dans la bouche, fermez les lèvres, et inspirez lentement tout en actionnant l&rsquo;inhalateur.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>4. Retention</Text>
        <Text style={styles.cardBody}>Retenez votre souffle pendant 5-10 secondes pour permettre au médicament de se déposer.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>5. Expiration</Text>
        <Text style={styles.cardBody}>Expirez lentement par la bouche ou le nez. Nettoyez l&rsquo;embout après utilisation.</Text>
      </View>

      <Text style={styles.disclaimer}>
        Ce contenu est éducatif. Votre équipe soignante valide votre protocole personnel.
      </Text>
    </ScrollView>
  );
};

function createStyles(colors: any) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16 },
  title: { fontSize: 22, fontWeight: '700', color: colors.primary, marginBottom: 4 },
  subtitle: { fontSize: 14, color: colors.mutedForeground, marginBottom: 16 },
  card: { backgroundColor: colors.primaryForeground, borderRadius: 8, padding: 16, marginBottom: 10 },
  cardTitle: { fontSize: 16, fontWeight: '600', color: colors.primary, marginBottom: 4 },
  cardBody: { fontSize: 14, color: colors.foreground, lineHeight: 20 },
  disclaimer: { fontSize: 12, color: colors.mutedForeground, fontStyle: 'italic', marginTop: 8, textAlign: 'center' },
});
}

export default InhalerEducationScreen;