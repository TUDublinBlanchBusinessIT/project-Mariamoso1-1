import { Container } from '@/components/ui/container';
import { useAuth } from '@/Context/Authcontext';
import { addVisit } from '@/lib/visitService';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useCallback, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Modal,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const STATUS_OPTIONS = ['scheduled', 'completed', 'missed', 'substituted', 'delayed'] as const;

export default function AddVisitScreen() {
  const { user } = useAuth();
  const [caregiverName, setCaregiverName] = useState('');
  const [scheduledDate, setScheduledDate] = useState(new Date());
  const [scheduledTime, setScheduledTime] = useState(new Date());
  const [status, setStatus] = useState<'scheduled' | 'completed' | 'missed' | 'substituted' | 'delayed'>('scheduled');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setScheduledDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setScheduledTime(selectedTime);
    }
  };

  const formatDate = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleSubmit = useCallback(async () => {
    if (!caregiverName.trim()) {
      Alert.alert('Error', 'Please enter caregiver name');
      return;
    }

    if (!user?.uid) {
      Alert.alert('Error', 'User not authenticated');
      return;
    }

    setLoading(true);
    try {
      await addVisit(user.uid, {
        caregiverName: caregiverName.trim(),
        scheduledDate: formatDate(scheduledDate),
        scheduledTime: formatTime(scheduledTime),
        status,
        notes: notes.trim() || undefined,
      });

      Alert.alert('Success', 'Visit created successfully!');
      // Reset form
      setCaregiverName('');
      setScheduledDate(new Date());
      setScheduledTime(new Date());
      setStatus('scheduled');
      setNotes('');
    } catch (error) {
      Alert.alert('Error', 'Failed to create visit. Please try again.');
      console.error('Error creating visit:', error);
    } finally {
      setLoading(false);
    }
  }, [caregiverName, scheduledDate, scheduledTime, status, notes, user?.uid]);

  return (
    <Container>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Add New Visit</Text>
          <Text style={styles.subtitle}>Log a new caregiver visit</Text>
        </View>

        {/* Caregiver Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Caregiver Name *</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter caregiver name"
            value={caregiverName}
            onChangeText={setCaregiverName}
            placeholderTextColor="#999"
          />
        </View>

        {/* Scheduled Date */}
        <View style={styles.section}>
          <Text style={styles.label}>Scheduled Date *</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <MaterialIcons name="calendar-today" size={20} color="#007AFF" />
            <Text style={styles.dateButtonText}>{formatDate(scheduledDate)}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={scheduledDate}
              mode="date"
              display="spinner"
              onChange={handleDateChange}
            />
          )}
        </View>

        {/* Scheduled Time */}
        <View style={styles.section}>
          <Text style={styles.label}>Scheduled Time *</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowTimePicker(true)}>
            <MaterialIcons name="access-time" size={20} color="#007AFF" />
            <Text style={styles.dateButtonText}>{formatTime(scheduledTime)}</Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              value={scheduledTime}
              mode="time"
              display="spinner"
              onChange={handleTimeChange}
            />
          )}
        </View>

        {/* Status */}
        <View style={styles.section}>
          <Text style={styles.label}>Status</Text>
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowStatusPicker(true)}>
            <MaterialIcons name="check-circle-outline" size={20} color="#007AFF" />
            <Text style={styles.dateButtonText}>{status}</Text>
          </TouchableOpacity>
          <Modal visible={showStatusPicker} transparent animationType="slide">
            <View style={styles.modalOverlay}>
              <View style={styles.statusPickerContainer}>
                <View style={styles.statusPickerHeader}>
                  <Text style={styles.statusPickerTitle}>Select Status</Text>
                  <TouchableOpacity onPress={() => setShowStatusPicker(false)}>
                    <Text style={styles.statusPickerClose}>Done</Text>
                  </TouchableOpacity>
                </View>
                {STATUS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option}
                    style={[
                      styles.statusOption,
                      status === option && styles.statusOptionSelected,
                    ]}
                    onPress={() => {
                      setStatus(option);
                      setShowStatusPicker(false);
                    }}>
                    <Text
                      style={[
                        styles.statusOptionText,
                        status === option && styles.statusOptionTextSelected,
                      ]}>
                      {option}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Modal>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Notes (Optional)</Text>
          <TextInput
            style={[styles.input, styles.notesInput]}
            placeholder="Add any notes about this visit"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            placeholderTextColor="#999"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <MaterialIcons name="add-circle" size={20} color="white" />
              <Text style={styles.submitButtonText}>Create Visit</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.spacer} />
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 32,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  notesInput: {
    textAlignVertical: 'top',
    paddingVertical: 12,
    height: 100,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f9f9f9',
    gap: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  statusPickerContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingVertical: 16,
  },
  statusPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  statusPickerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  statusPickerClose: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  statusOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statusOptionSelected: {
    backgroundColor: '#f0f7ff',
  },
  statusOptionText: {
    fontSize: 16,
    color: '#333',
  },
  statusOptionTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 16,
    gap: 8,
    marginTop: 32,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  spacer: {
    height: 40,
  },
});

