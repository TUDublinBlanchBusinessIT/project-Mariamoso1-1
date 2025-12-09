import { Container } from '@/components/ui/container';
import { useAuth } from '@/Context/Authcontext';
import { deleteVisit, getUserVisits, updateVisit, checkAndFlagMissedVisits } from '@/lib/visitService';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

interface Visit {
  id: string;
  caregiverName: string;
  scheduledDate: string;
  scheduledTime: string;
  actualArrival?: string;
  status: 'scheduled' | 'completed' | 'missed' | 'substituted' | 'delayed';
  notes?: string;
  userId: string;
  timestamp: number;
  acknowledged?: boolean;
}

const STATUS_OPTIONS = ['scheduled', 'completed', 'missed', 'substituted', 'delayed'] as const;

export default function VisitsScreen() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editingVisit, setEditingVisit] = useState<Visit | null>(null);

  // Edit form states
  const [editCaregiverName, setEditCaregiverName] = useState('');
  const [editScheduledDate, setEditScheduledDate] = useState(new Date());
  const [editScheduledTime, setEditScheduledTime] = useState(new Date());
  const [editStatus, setEditStatus] = useState<'scheduled' | 'completed' | 'missed' | 'substituted' | 'delayed'>('scheduled');
  const [editNotes, setEditNotes] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showStatusPicker, setShowStatusPicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadVisits();
    }, [user?.uid])
  );

  const loadVisits = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check and auto-flag missed visits first
      await checkAndFlagMissedVisits(user.uid);

      const data = await getUserVisits(user.uid);
      const mappedVisits: Visit[] = data.map((doc: any) => ({
        id: doc.id || '',
        caregiverName: doc.caregiverName || '',
        scheduledDate: doc.scheduledDate || '',
        scheduledTime: doc.scheduledTime || '',
        actualArrival: doc.actualArrival,
        status: doc.status || 'scheduled',
        notes: doc.notes,
        userId: doc.userId || '',
        timestamp: doc.timestamp || Date.now(),
      }));

      // Sort by date (most recent first)
      mappedVisits.sort((a, b) => {
        const dateA = new Date(a.scheduledDate).getTime();
        const dateB = new Date(b.scheduledDate).getTime();
        return dateB - dateA;
      });

      setVisits(mappedVisits);
    } catch (error) {
      console.error('Error loading visits:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadVisits();
    setRefreshing(false);
  }, [user?.uid]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return '#34C759';
      case 'scheduled':
        return '#43a28f';
      case 'missed':
        return '#FF3B30';
      case 'substituted':
        return '#FF9500';
      case 'delayed':
        return '#FF3B30';
      default:
        return '#999';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return 'check-circle';
      case 'scheduled':
        return 'clock-outline';
      case 'missed':
        return 'alert-circle';
      case 'substituted':
        return 'account-switch';
      case 'delayed':
        return 'alert-circle';
      default:
        return 'information';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const formatDateForInput = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const formatTimeForInput = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleEdit = (visit: Visit) => {
    setEditingVisit(visit);
    setEditCaregiverName(visit.caregiverName);

    // Parse date
    const [year, month, day] = visit.scheduledDate.split('-').map(Number);
    setEditScheduledDate(new Date(year, month - 1, day));

    // Parse time
    const [hours, minutes] = visit.scheduledTime.split(':').map(Number);
    const timeDate = new Date();
    timeDate.setHours(hours, minutes);
    setEditScheduledTime(timeDate);

    setEditStatus(visit.status);
    setEditNotes(visit.notes || '');
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (!editCaregiverName.trim()) {
      Alert.alert('Error', 'Please enter caregiver name');
      return;
    }

    if (!editingVisit?.id) return;

    try {
      await updateVisit(editingVisit.id, {
        caregiverName: editCaregiverName.trim(),
        scheduledDate: formatDateForInput(editScheduledDate),
        scheduledTime: formatTimeForInput(editScheduledTime),
        status: editStatus,
        notes: editNotes.trim() || undefined,
      });

      Alert.alert('Success', 'Visit updated successfully');
      setEditModalVisible(false);
      await loadVisits();
    } catch (error) {
      Alert.alert('Error', 'Failed to update visit');
      console.error('Error updating visit:', error);
    }
  };

  const handleDelete = (visitId: string, caregiverName: string) => {
    Alert.alert(
      'Delete Visit',
      `Are you sure you want to delete the visit with ${caregiverName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteVisit(visitId);
              Alert.alert('Success', 'Visit deleted successfully');
              await loadVisits();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete visit');
              console.error('Error deleting visit:', error);
            }
          },
        },
      ]
    );
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setEditScheduledDate(selectedDate);
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setEditScheduledTime(selectedTime);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Visit History</Text>
        <Text style={styles.subtitle}>All caregiver visits</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#43a28f" />
            <Text style={styles.loadingText}>Loading visits...</Text>
          </View>
        ) : visits.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="calendar-blank" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No visits found</Text>
            <Text style={styles.emptySubtext}>Create your first visit to get started</Text>
          </View>
        ) : (
          <View style={styles.visitsList}>
            {visits.map((visit) => (
              <View key={visit.id} style={styles.visitCard}>
                <View style={styles.visitHeader}>
                  <View style={styles.visitInfo}>
                    <Text style={styles.caregiverName}>{visit.caregiverName}</Text>
                    <View style={styles.dateTimeRow}>
                      <MaterialCommunityIcons name="calendar" size={14} color="#666" />
                      <Text style={styles.dateText}>{formatDate(visit.scheduledDate)}</Text>
                      <MaterialCommunityIcons name="clock-outline" size={14} color="#666" style={{ marginLeft: 12 }} />
                      <Text style={styles.timeText}>{visit.scheduledTime}</Text>
                    </View>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(visit.status) },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={getStatusIcon(visit.status)}
                      size={14}
                      color="#fff"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.statusText}>
                      {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                    </Text>
                  </View>
                </View>

                {visit.actualArrival && (
                  <View style={styles.arrivalInfo}>
                    <MaterialCommunityIcons name="check-circle" size={16} color="#34C759" />
                    <Text style={styles.arrivalText}>Arrived at {visit.actualArrival}</Text>
                  </View>
                )}

                {visit.notes && (
                  <View style={styles.notesContainer}>
                    <MaterialCommunityIcons name="note-text" size={14} color="#666" />
                    <Text style={styles.notesText}>{visit.notes}</Text>
                  </View>
                )}

                {/* Action Buttons */}
                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.editButton}
                    onPress={() => handleEdit(visit)}
                  >
                    <MaterialIcons name="edit" size={18} color="#007AFF" />
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteButton}
                    onPress={() => handleDelete(visit.id, visit.caregiverName)}
                  >
                    <MaterialIcons name="delete" size={18} color="#FF3B30" />
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Edit Modal */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setEditModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Visit</Text>
            <TouchableOpacity onPress={handleSaveEdit}>
              <Text style={styles.modalSaveText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Caregiver Name */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Caregiver Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Enter caregiver name"
                value={editCaregiverName}
                onChangeText={setEditCaregiverName}
                placeholderTextColor="#999"
              />
            </View>

            {/* Scheduled Date */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Scheduled Date *</Text>
              <TouchableOpacity style={styles.modalDateButton} onPress={() => setShowDatePicker(true)}>
                <MaterialIcons name="calendar-today" size={20} color="#007AFF" />
                <Text style={styles.modalDateText}>{formatDateForInput(editScheduledDate)}</Text>
              </TouchableOpacity>
              {showDatePicker && (
                <DateTimePicker
                  value={editScheduledDate}
                  mode="date"
                  display="spinner"
                  onChange={handleDateChange}
                />
              )}
            </View>

            {/* Scheduled Time */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Scheduled Time *</Text>
              <TouchableOpacity style={styles.modalDateButton} onPress={() => setShowTimePicker(true)}>
                <MaterialIcons name="access-time" size={20} color="#007AFF" />
                <Text style={styles.modalDateText}>{formatTimeForInput(editScheduledTime)}</Text>
              </TouchableOpacity>
              {showTimePicker && (
                <DateTimePicker
                  value={editScheduledTime}
                  mode="time"
                  display="spinner"
                  onChange={handleTimeChange}
                />
              )}
            </View>

            {/* Status */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Status</Text>
              <TouchableOpacity style={styles.modalDateButton} onPress={() => setShowStatusPicker(true)}>
                <MaterialIcons name="check-circle-outline" size={20} color="#007AFF" />
                <Text style={styles.modalDateText}>{editStatus}</Text>
              </TouchableOpacity>
              <Modal visible={showStatusPicker} transparent animationType="slide">
                <View style={styles.statusModalOverlay}>
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
                          editStatus === option && styles.statusOptionSelected,
                        ]}
                        onPress={() => {
                          setEditStatus(option);
                          setShowStatusPicker(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.statusOptionText,
                            editStatus === option && styles.statusOptionTextSelected,
                          ]}
                        >
                          {option}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              </Modal>
            </View>

            {/* Notes */}
            <View style={styles.modalSection}>
              <Text style={styles.modalLabel}>Notes (Optional)</Text>
              <TextInput
                style={[styles.modalInput, styles.modalNotesInput]}
                placeholder="Add any notes about this visit"
                value={editNotes}
                onChangeText={setEditNotes}
                multiline
                numberOfLines={4}
                placeholderTextColor="#999"
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f9f9f9',
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#999',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bbb',
    marginTop: 8,
    textAlign: 'center',
  },
  visitsList: {
    padding: 16,
  },
  visitCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  visitInfo: {
    flex: 1,
  },
  caregiverName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
    marginBottom: 6,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: '#666',
  },
  timeText: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    flexDirection: 'row',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  arrivalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 6,
  },
  arrivalText: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '500',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  bottomSpacing: {
    height: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#f0f7ff',
    borderRadius: 8,
    gap: 6,
  },
  editButtonText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    backgroundColor: '#fff0f0',
    borderRadius: 8,
    gap: 6,
  },
  deleteButtonText: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  modalCancelText: {
    fontSize: 16,
    color: '#666',
  },
  modalSaveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalSection: {
    marginBottom: 24,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#f9f9f9',
  },
  modalNotesInput: {
    textAlignVertical: 'top',
    paddingVertical: 12,
    height: 100,
  },
  modalDateButton: {
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
  modalDateText: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  statusModalOverlay: {
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
});
