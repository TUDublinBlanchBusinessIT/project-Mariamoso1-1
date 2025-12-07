import { useAuth } from '@/Context/Authcontext';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { TextInput } from '@/components/ui/textinput';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, error } = useAuth();
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch {
      Alert.alert('Login Failed', error || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>Care Connect</Text>
          <Text style={styles.subtitle}>Guardian</Text>
          <Text style={styles.description}>Track domiciliary care visits</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
          />

          <TextInput
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error && <Text style={styles.errorMessage}>{error}</Text>}

          <Button label="Login" onPress={handleLogin} loading={loading} />

          <View style={styles.footer}>
            <Text style={styles.footerText}>Don&apos;t have an account? </Text>
            <Button
              label="Sign Up"
              onPress={() => router.push('/(auth)/signup')}
              variant="secondary"
            />
          </View>
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#007AFF',
  },
  subtitle: {
    fontSize: 28,
    fontWeight: '600',
    color: '#333',
    marginTop: 4,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginTop: 12,
  },
  form: {
    marginBottom: 40,
  },
  errorMessage: {
    color: '#FF3B30',
    fontSize: 14,
    marginBottom: 12,
    textAlign: 'center',
  },
  footer: {
    marginTop: 16,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: '#666',
  },
});
