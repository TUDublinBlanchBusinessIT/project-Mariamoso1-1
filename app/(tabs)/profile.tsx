import { useAuth } from '@/Context/Authcontext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { pickImage, showImageSourcePicker, getUserInitials } from '@/lib/imageUtils';
import {  updateUserProfile, uploadProfilePicture, deleteProfilePicture } from '@/lib/userService';

const RELATIONSHIP_OPTIONS = ['Parent', 'Relative', 'Guardian'] as const;

export default function ProfileScreen() {
  const { user, userProfile, logout, refreshProfile } = useAuth();

  const [editedName, setEditedName] = useState(userProfile?.name || '');
  const [editedRelationship, setEditedRelationship] = useState<'Parent' | 'Relative' | 'Guardian'>(
    userProfile?.relationship || 'Parent'
  );
  const [newProfileImage, setNewProfileImage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [showRelationshipPicker, setShowRelationshipPicker] = useState(false);

  const handlePickImage = async () => {
    const source = await showImageSourcePicker();
    if (!source) return;

    const uri = await pickImage(source);
    if (uri) {
      setNewProfileImage(uri);
    }
  };

  const handleSave = async () => {
    if (!editedName.trim()) {
      Alert.alert('Error', 'Name cannot be empty');
      return;
    }

    if (!user) return;

    setSaving(true);
    try {
      let photoURL = userProfile?.photoURL;

      // If image changed, upload new one and delete old one
      if (newProfileImage) {
        // Delete old photo if exists
        if (photoURL) {
          await deleteProfilePicture(photoURL);
        }

        // Upload new photo
        photoURL = await uploadProfilePicture(user.uid, newProfileImage);
      }

      // Update profile
      await updateUserProfile(user.uid, {
        name: editedName.trim(),
        relationship: editedRelationship,
        photoURL,
      });

      // Refresh profile in context
      await refreshProfile();

      // Reset edited image
      setNewProfileImage(null);

      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logout();
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
      },
    ]);
  };

  const displayImage = newProfileImage || userProfile?.photoURL;
  const userInitials = userProfile?.name ? getUserInitials(userProfile.name) : '?';

  if (!userProfile) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#43a28f" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Manage your account</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Profile Picture Section */}
        <View style={styles.profilePictureSection}>
          <View style={styles.profilePictureContainer}>
            {displayImage ? (
              <Image source={{ uri: displayImage }} style={styles.profilePicture} />
            ) : (
              <View style={styles.profilePicturePlaceholder}>
                <Text style={styles.profilePictureInitials}>{userInitials}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.cameraButton} onPress={handlePickImage}>
              <MaterialCommunityIcons name="camera" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
          <Text style={styles.profileName}>{userProfile.name}</Text>
          <Text style={styles.profileRelationship}>{userProfile.relationship}</Text>
        </View>

        {/* Edit Form */}
        <View style={styles.formSection}>
          {/* Name */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Full Name</Text>
            <View style={styles.inputWrapper}>
              <MaterialCommunityIcons name="account" size={20} color="#999" />
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                value={editedName}
                onChangeText={setEditedName}
              />
            </View>
          </View>

          {/* Email (Read-only) */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputWrapper, styles.inputWrapperDisabled]}>
              <MaterialCommunityIcons name="email" size={20} color="#999" />
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={user?.email || ''}
                editable={false}
              />
              <MaterialCommunityIcons name="lock" size={16} color="#999" />
            </View>
            <Text style={styles.helperText}>Email cannot be changed</Text>
          </View>

          {/* Relationship */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Relationship</Text>
            <TouchableOpacity
              style={styles.inputWrapper}
              onPress={() => setShowRelationshipPicker(true)}
            >
              <MaterialCommunityIcons name="account-group" size={20} color="#999" />
              <Text style={styles.inputText}>{editedRelationship}</Text>
              <MaterialCommunityIcons name="chevron-down" size={20} color="#999" />
            </TouchableOpacity>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <MaterialCommunityIcons name="check" size={20} color="#fff" />
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Sign Out Button */}
          <TouchableOpacity style={styles.signOutButton} onPress={handleLogout}>
            <MaterialCommunityIcons name="logout" size={20} color="#FF3B30" />
            <Text style={styles.signOutButtonText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.bottomSpacing} />
      </ScrollView>

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
                  editedRelationship === option && styles.relationshipOptionSelected,
                ]}
                onPress={() => {
                  setEditedRelationship(option);
                  setShowRelationshipPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.relationshipOptionText,
                    editedRelationship === option && styles.relationshipOptionTextSelected,
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  profilePictureSection: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  profilePictureContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  profilePicture: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#43a28f',
  },
  profilePicturePlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#43a28f',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#43a28f',
  },
  profilePictureInitials: {
    fontSize: 48,
    fontWeight: '700',
    color: '#fff',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#43a28f',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  profileName: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  profileRelationship: {
    fontSize: 14,
    color: '#666',
  },
  formSection: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
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
  inputText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  helperText: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    marginLeft: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#43a28f',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  signOutButtonText: {
    color: '#FF3B30',
    fontSize: 16,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
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
