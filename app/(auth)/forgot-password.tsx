import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, TextInput as RNTextInput, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    setLoading(true);
    try {
      Alert.alert('Success', 'Password reset link sent to your email');
      router.back();
    } catch {
      Alert.alert('Error', 'Failed to send reset link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <View style={styles.content}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Forgot Password?</Text>
        </View>

        <View style={styles.form}>
          <Text style={styles.description}>Enter your email address and we&apos;ll send you a link to reset your password.</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <RNTextInput
              style={styles.input}
              placeholder="Enter your email"
              placeholderTextColor="#999"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
            />
          </View>

          <Button label="Send Reset Link" onPress={handleReset} loading={loading} />
        </View>
      </View>
    </Container>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  header: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 30,
    backgroundColor: '#f5f5f5',
  },
  backButton: {
    marginBottom: 16,
  },
  backText: {
    fontSize: 16,
    color: '#0052CC',
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  form: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 0,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#e8f2f7',
  },
});
