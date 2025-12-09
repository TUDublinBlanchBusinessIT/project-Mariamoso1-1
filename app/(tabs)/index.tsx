import { useAuth } from '@/Context/Authcontext';
import { getTodaysVisits, getUserVisits, updateVisitStatus, checkAndFlagMissedVisits } from '@/lib/visitService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

export default function HomeScreen() {
  const { user, userProfile } = useAuth();
  const router = useRouter();
  const [allVisits, setAllVisits] = useState<Visit[]>([]);
  const [todaysVisits, setTodaysVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Load visits when screen is focused
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

      // Load all visits for stats
      const allData = await getUserVisits(user.uid);
      const mappedAllVisits: Visit[] = allData.map((doc: any) => ({
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
      setAllVisits(mappedAllVisits);

      // Filter today's visits from all visits (client-side filtering as workaround)
      const today = new Date().toISOString().split('T')[0];
      const todayVisitsFiltered = mappedAllVisits.filter(
        (visit) => visit.scheduledDate === today
      );

      // Sort by scheduled time (chronological order)
      todayVisitsFiltered.sort((a, b) => {
        const timeA = a.scheduledTime || '00:00';
        const timeB = b.scheduledTime || '00:00';
        return timeA.localeCompare(timeB);
      });

      setTodaysVisits(todayVisitsFiltered);
    } catch (error) {
      console.error('Error loading visits:', error);
      Alert.alert('Error', 'Failed to load visits');
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

  const handleMarkArrived = async (visitId: string, caregiverName: string) => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const arrivalTime = `${hours}:${minutes}`;

    try {
      await updateVisitStatus(visitId, 'completed', arrivalTime);
      Alert.alert('Success', `Marked ${caregiverName} as arrived`);
      await loadVisits();
    } catch (error) {
      Alert.alert('Error', 'Failed to update visit');
      console.error('Error updating visit:', error);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Calculate stats from all visits
  const completedVisits = allVisits.filter((v) => v.status === 'completed').length;
  const upcomingVisits = allVisits.filter((v) => v.status === 'scheduled').length;

  // Filter today's visits for ongoing alerts (only unacknowledged)
  const today = new Date().toISOString().split('T')[0];
  const ongoingAlerts = todaysVisits.filter((v) =>
    (v.status === 'substituted' || v.status === 'delayed' || v.status === 'missed') &&
    !v.acknowledged
  ).length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#43a28f" />
            <Text style={styles.loadingText}>Loading visits...</Text>
          </View>
        ) : (
          <>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                <View>
                  <Text style={styles.greeting}>{getGreeting()}</Text>
                  <Text style={styles.userName}>{userProfile?.name || user?.email?.split('@')[0] || 'Guardian'}</Text>
                </View>
              </View>
            </View>

            {/* Stats Cards */}
            <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[styles.statCard, styles.statCard1]}
            onPress={() => router.push('/(tabs)/visits')}
            activeOpacity={0.7}
          >
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="check-circle" size={28} color="#34C759" />
            </View>
            <Text style={styles.statNumber}>{completedVisits}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, styles.statCard2]}
            onPress={() => router.push('/(tabs)/visits')}
            activeOpacity={0.7}
          >
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="clock-outline" size={28} color="#ffd938" />
            </View>
            <Text style={styles.statNumber}>{upcomingVisits}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, styles.statCard3]}
            onPress={() => router.push('/(tabs)/alerts')}
            activeOpacity={0.7}
          >
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="alert-circle" size={28} color={ongoingAlerts > 0 ? '#fd435e' : '#ddd'} />
            </View>
            <Text style={styles.statNumber}>{ongoingAlerts}</Text>
            <Text style={styles.statLabel}>Ongoing Alerts</Text>
          </TouchableOpacity>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Visits</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/visits')}>
            <Text style={styles.viewAllLink}>View History</Text>
          </TouchableOpacity>
        </View>

        {/* Visit Cards */}
        <View style={styles.visitsList}>
          {todaysVisits.length > 0 ? (
            todaysVisits.map((visit) => (
              <TouchableOpacity
                key={visit.id}
                style={styles.visitCard}
                activeOpacity={0.7}
                onPress={() => Alert.alert('Visit Details', `${visit.caregiverName}\n${visit.scheduledTime}`)}
              >
                <View style={styles.visitHeader}>
                  <View style={styles.visitInfo}>
                    <Text style={styles.caregiverName}>{visit.caregiverName}</Text>
                    <Text style={styles.visitTime}>{visit.scheduledTime}</Text>
                  </View>
                  <View
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(visit.status) },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={getStatusIcon(visit.status)}
                      size={16}
                      color="#fff"
                      style={{ marginRight: 4 }}
                    />
                    <Text style={styles.statusText}>
                      {visit.status.charAt(0).toUpperCase() + visit.status.slice(1)}
                    </Text>
                  </View>
                </View>

                {visit.actualArrival && (
                  <View style={styles.visitMeta}>
                    <MaterialCommunityIcons name="clock-check" size={14} color="#666" />
                    <Text style={styles.metaText}>Arrived at {visit.actualArrival}</Text>
                  </View>
                )}

                {visit.notes && (
                  <View style={styles.visitNotes}>
                    <Text style={styles.notesText}>{visit.notes}</Text>
                  </View>
                )}

                {visit.status === 'scheduled' && (
                  <View style={styles.visitActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleMarkArrived(visit.id, visit.caregiverName)}
                    >
                      <MaterialCommunityIcons name="check" size={18} color="#43a28f" />
                      <Text style={styles.actionText}>Mark Arrived</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => router.push('/(tabs)/visits')}
                    >
                      <MaterialCommunityIcons name="pencil" size={18} color="#43a28f" />
                      <Text style={styles.actionText}>View Details</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="calendar-check" size={48} color="#ddd" />
              <Text style={styles.emptyText}>No visits scheduled for today</Text>
            </View>
          )}
        </View>

            {/* Quick Actions */}
            <View style={styles.quickActionsContainer}>
              <Text style={styles.quickActionsTitle}>Quick Actions</Text>
              <TouchableOpacity
                style={styles.actionCard}
                activeOpacity={0.7}
                onPress={() => router.push('/(tabs)/add-visit')}
              >
                <MaterialCommunityIcons name="plus-circle" size={24} color="#43a28f" />
                <Text style={styles.actionCardText}>Log Visit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
                <MaterialCommunityIcons name="phone" size={24} color="#43a28f" />
                <Text style={styles.actionCardText}>Contact Caregiver</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Bottom Spacing */}
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
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 14,
    color: '#999',
    fontWeight: '500',
  },
  userName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginTop: 4,
    textTransform: 'capitalize',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  statCard1: {
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
  },
  statCard2: {
    backgroundColor: 'rgba(255, 217, 56, 0.1)',
  },
  statCard3: {
    backgroundColor: 'rgba(253, 67, 94, 0.1)',
  },
  statIconContainer: {
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginTop: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#333',
  },
  viewAllLink: {
    fontSize: 13,
    color: '#43a28f',
    fontWeight: '600',
  },
  visitsList: {
    paddingHorizontal: 16,
    gap: 12,
  },
  visitCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 1,
  },
  visitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  visitInfo: {
    flex: 1,
  },
  caregiverName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 4,
  },
  visitTime: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  visitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 13,
    color: '#666',
  },
  visitNotes: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  visitActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#43a28f',
  },
  actionText: {
    fontSize: 12,
    color: '#43a28f',
    fontWeight: '600',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 12,
    fontWeight: '500',
  },
  quickActionsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  actionCardText: {
    fontSize: 15,
    color: '#333',
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
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
    paddingVertical: 60,
  },
  arrivalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(52, 199, 89, 0.1)',
    borderRadius: 8,
  },
  arrivalText: {
    fontSize: 13,
    color: '#34C759',
    fontWeight: '500',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  notesContainer: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 12,
  },
  viewHistory: {
    fontSize: 13,
    color: '#43a28f',
    fontWeight: '600',
  },
});
