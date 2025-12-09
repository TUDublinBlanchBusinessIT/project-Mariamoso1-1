import { db, storage } from '@/config/firebaseConfig';
import { doc, getDoc, setDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { compressImage, getImageExtension } from './imageUtils';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  relationship: 'Parent' | 'Relative' | 'Guardian';
  photoURL?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export interface ProfileData {
  name: string;
  relationship: 'Parent' | 'Relative' | 'Guardian';
  photoURL?: string;
}

/**
 * Create a new user profile in Firestore
 */
export const createUserProfile = async (
  uid: string,
  email: string,
  profileData: ProfileData
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);
    const now = Timestamp.now();

    await setDoc(userRef, {
      uid,
      email,
      name: profileData.name,
      relationship: profileData.relationship,
      photoURL: profileData.photoURL || null,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
};

/**
 * Get user profile from Firestore
 */
export const getUserProfile = async (uid: string): Promise<UserProfile | null> => {
  try {
    const userRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      return userSnap.data() as UserProfile;
    }

    return null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    throw error;
  }
};

/**
 * Update user profile in Firestore
 */
export const updateUserProfile = async (
  uid: string,
  updates: Partial<ProfileData>
): Promise<void> => {
  try {
    const userRef = doc(db, 'users', uid);

    await updateDoc(userRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw error;
  }
};

/**
 * Upload profile picture to Firebase Storage
 * @param uid - User ID
 * @param imageUri - Local image URI
 * @returns Download URL from Firebase Storage
 */
export const uploadProfilePicture = async (
  uid: string,
  imageUri: string
): Promise<string> => {
  try {
    // Compress image first
    const compressedUri = await compressImage(imageUri);

    // Convert URI to blob
    const response = await fetch(compressedUri);
    const blob = await response.blob();

    // Create storage reference
    const timestamp = Date.now();
    const extension = getImageExtension(imageUri);
    const fileName = `${timestamp}.${extension}`;
    const storageRef = ref(storage, `profile-pictures/${uid}/${fileName}`);

    // Upload blob
    await uploadBytes(storageRef, blob);

    // Get download URL
    const downloadURL = await getDownloadURL(storageRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading profile picture:', error);
    throw error;
  }
};

/**
 * Delete profile picture from Firebase Storage
 * @param photoURL - Firebase Storage URL
 */
export const deleteProfilePicture = async (photoURL: string): Promise<void> => {
  try {
    if (!photoURL) return;

    // Extract storage path from URL
    const storageRef = ref(storage, photoURL);
    await deleteObject(storageRef);
  } catch (error) {
    console.error('Error deleting profile picture:', error);
    // Don't throw - deletion failure shouldn't block other operations
  }
};

/**
 * Get user initials from name
 * @param name - User's full name
 * @returns Initials (e.g., "John Doe" -> "JD")
 */
export const getUserInitials = (name: string): string => {
  if (!name) return '?';

  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }

  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};
