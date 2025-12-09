import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Alert } from 'react-native';

/**
 * Pick an image from camera or gallery
 * @param source - 'camera' or 'gallery'
 * @returns image URI or null if cancelled/failed
 */
export const pickImage = async (source: 'camera' | 'gallery'): Promise<string | null> => {
  try {
    // Request permission
    const permissionResult = source === 'camera'
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert(
        'Permission Required',
        `Please grant permission to access your ${source === 'camera' ? 'camera' : 'photos'}.`
      );
      return null;
    }

    // Launch picker
    const result = source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
        })
      : await ImagePicker.launchImageLibraryAsync({
          quality: 0.8,
          allowsEditing: true,
          aspect: [1, 1],
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
        });

    if (result.canceled) {
      return null;
    }

    return result.assets[0].uri;
  } catch (error) {
    console.error('Error picking image:', error);
    Alert.alert('Error', 'Failed to pick image. Please try again.');
    return null;
  }
};

/**
 * Compress and resize an image
 * @param uri - Original image URI
 * @returns Compressed image URI
 */
export const compressImage = async (uri: string): Promise<string> => {
  try {
    const manipResult = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 800, height: 800 } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return manipResult.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    // Return original URI if compression fails
    return uri;
  }
};

/**
 * Get file extension from URI
 * @param uri - Image URI
 * @returns File extension (e.g., 'jpg', 'png')
 */
export const getImageExtension = (uri: string): string => {
  const match = uri.match(/\.([^.]+)$/);
  return match ? match[1].toLowerCase() : 'jpg';
};

/**
 * Show image source picker (camera or gallery)
 * @returns 'camera' | 'gallery' | null
 */
export const showImageSourcePicker = (): Promise<'camera' | 'gallery' | null> => {
  return new Promise((resolve) => {
    Alert.alert(
      'Select Photo',
      'Choose photo source',
      [
        {
          text: 'Camera',
          onPress: () => resolve('camera'),
        },
        {
          text: 'Gallery',
          onPress: () => resolve('gallery'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => resolve(null),
        },
      ],
      { cancelable: true, onDismiss: () => resolve(null) }
    );
  });
};
