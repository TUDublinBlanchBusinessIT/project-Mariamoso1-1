import { useAuth } from '@/Context/Authcontext';
import { Button } from '@/components/ui/button';
import { Container } from '@/components/ui/container';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput as RNTextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { pickImage, showImageSourcePicker } from '@/lib/imageUtils';
import { createUserProfile, uploadProfilePicture } from '@/lib/userService';

const RELATIONSHIP_OPTIONS = ['Parent', 'Relative', 'Guardian'] as const;

export default function CompleteProfileScreen() {
  const { user, refreshProfile } = useAuth();
  const router = useRouter();
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<'Parent' | 'Relative' | 'Guardian'>('Parent');
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showRelationshipPicker, setShowRelationshipPicker] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);

  const handlePickImage = async () => {
    const source = await showImageSourcePicker();
    if (!source) return;

    const uri = await pickImage(source);
    if (uri) {
      setProfileImage(uri);
    }
  };

  const handleComplete = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    if (!profileImage) {
      Alert.alert('Error', 'Please select a profile picture');
      return;
    }

    if (!user) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    try {
      // Upload profile picture
      const photoURL = await uploadProfilePicture(user.uid, profileImage);

      // Create user profile
      await createUserProfile(user.uid, user.email || '', {
        name: name.trim(),
        relationship,
        photoURL,
      });

      // Refresh profile in context
      await refreshProfile();

      Alert.alert('Success', 'Profile completed!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') },
      ]);
    } catch (error) {
      console.error('Error completing profile:', error);
      Alert.alert('Error', 'Failed to complete profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <View style={styles.scrollContent}>
        {/* Logo Section */}
        <View style={styles.logoSection}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        {/* Card */}
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>Complete Your Profile</Text>
            <Text style={styles.subtitle}>
              We've added new profile features! Please complete your profile to continue.
            </Text>
          </View>

          <View style={styles.form}>
            {/* Name Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name *</Text>
              <View style={[styles.inputWrapper, nameFocused && styles.inputWrapperFocused]}>
                <RNTextInput
                  style={styles.input}
                  placeholder="John Doe"
                  placeholderTextColor="#999"
                  value={name}
                  onChangeText={setName}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                />
              </View>
            </View>

            {/* Email (Read-only) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email Address</Text>
              <View style={[styles.inputWrapper, styles.inputWrapperDisabled]}>
                <RNTextInput
                  style={[styles.input, styles.inputDisabled]}
                  value={user?.email || ''}
                  editable={false}
                />
                <MaterialCommunityIcons name="lock" size={16} color="#999" />
              </View>
            </View>

            {/* Relationship Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Relationship *</Text>
              <TouchableOpacity
                style={styles.inputWrapper}
                onPress={() => setShowRelationshipPicker(true)}
              >
                <Text style={styles.relationshipText}>{relationship}</Text>
                <MaterialCommunityIcons name="chevron-down" size={20} color="#999" />
              </TouchableOpacity>
            </View>

            {/* Profile Picture Picker */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Profile Picture *</Text>
              <TouchableOpacity style={styles.imagePickerButton} onPress={handlePickImage}>
                {profileImage ? (
                  <Image source={{ uri: profileImage }} style={styles.profileImagePreview} />
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <MaterialCommunityIcons name="camera" size={32} color="#999" />
                    <Text style={styles.imagePlaceholderText}>Tap to add photo</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>

            {/* Complete Button */}
            <Button label="Complete Profile" onPress={handleComplete} loading={loading} />
          </View>
        </View>

        {/* Security Message */}
        <View style={styles.securityMessage}>
          <MaterialCommunityIcons name="shield-check" size={16} color="#43a28f" />
          <Text style={styles.securityText}>Your data is encrypted and secure</Text>
        </View>
      </View>

      {/* Relationship Picker Modal */}
      <Modal visible={showRelationshipPicker} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.relationshipPickerContainer}>
            <View style={styles.relationshipPickerHeader}>
              <Text style={styles.relationshipPickerTitle}>Select Relationship</Text>
              <TouchableOpacity onPress={() => setShowRelationshipPicker(false)}>
                <Text style={styles.relationshipPickerClose}>Done</Text>
              </TouchableOpacity>
            </View>
            {RELATIONSHIP_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.relationshipOption,
                  relationship === option && styles.relationshipOptionSelected,
                ]}
                onPress={() => {
                  setRelationship(option);
                  setShowRelationshipPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.relationshipOptionText,
                    relationship === option && styles.relationshipOptionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 24,
    justifyContent: 'flex-start',
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 16,
  },
  logo: {
    width: 100,
    height: 100,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  inputWrapperFocused: {
    borderColor: '#43a28f',
    backgroundColor: '#f9fffe',
  },
  inputWrapperDisabled: {
    backgroundColor: '#f5f5f5',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    padding: 0,
  },
  inputDisabled: {
    color: '#999',
  },
  relationshipText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  imagePickerButton: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fff',
    overflow: 'hidden',
    height: 120,
  },
  profileImagePreview: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9f9f9',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
  },
  securityMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: 'rgba(67, 162, 143, 0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  securityText: {
    fontSize: 12,
    color: '#666',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  relationshipPickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 16,
  },
  relationshipPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  relationshipPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  relationshipPickerClose: {
    fontSize: 16,
    color: '#43a28f',
    fontWeight: '600',
  },
  relationshipOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  relationshipOptionSelected: {
    backgroundColor: '#f0f7ff',
  },
  relationshipOptionText: {
    fontSize: 16,
    color: '#333',
  },
  relationshipOptionTextSelected: {
    color: '#43a28f',
    fontWeight: '600',
  },
});
