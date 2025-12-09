import { Container } from '@/components/ui/container';
import { useAuth } from '@/Context/Authcontext';
import { getUserVisits } from '@/lib/visitService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
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
}

export default function VisitsScreen() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

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
              </View>
            ))}
          </View>
        )}

        <View style={styles.bottomSpacing} />
      </ScrollView>
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
});
