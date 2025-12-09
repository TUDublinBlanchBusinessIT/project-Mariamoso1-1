import { Container } from '@/components/ui/container';
import { StyleSheet, Text, View } from 'react-native';

export default function AlertsScreen() {
  return (
    <Container>
      <View style={styles.container}>
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.description}>Notification alerts (substitution, delays) will be displayed here</Text>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: '#666',
  },
});
