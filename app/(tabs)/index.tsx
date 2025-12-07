import { useAuth } from '@/Context/Authcontext';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

export default function HomeScreen() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [visits, setVisits] = useState<Visit[]>([]);
  const [todaysVisits, setTodaysVisits] = useState<Visit[]>([]);

  useEffect(() => {
    loadTodaysVisits();
  }, []);

  const loadTodaysVisits = () => {
    // Mock data - in real app, fetch from Firebase
    const mockVisits: Visit[] = [
      {
        id: '1',
        caregiverName: 'Sarah Johnson',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '09:00',
        actualArrival: '08:55',
        status: 'completed',
        userId: user?.uid || '',
        timestamp: Date.now(),
      },
      {
        id: '2',
        caregiverName: 'Michael Chen',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '14:00',
        status: 'scheduled',
        userId: user?.uid || '',
        timestamp: Date.now(),
      },
      {
        id: '3',
        caregiverName: 'Emma Wilson (Substitute)',
        scheduledDate: new Date().toISOString().split('T')[0],
        scheduledTime: '18:00',
        status: 'substituted',
        notes: 'Regular caregiver unavailable',
        userId: user?.uid || '',
        timestamp: Date.now(),
      },
    ];

    setTodaysVisits(mockVisits);
  };

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

  const handleLogout = async () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        onPress: async () => {
          try {
            await logout();
            router.replace('/(auth)/login');
          } catch (error) {
            Alert.alert('Error', 'Failed to sign out');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const completedVisits = todaysVisits.filter((v) => v.status === 'completed').length;
  const upcomingVisits = todaysVisits.filter((v) => v.status === 'scheduled').length;
  const alerts = todaysVisits.filter((v) => v.status === 'substituted' || v.status === 'delayed').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <View>
              <Text style={styles.greeting}>{getGreeting()}</Text>
              <Text style={styles.userName}>{user?.email?.split('@')[0] || 'Guardian'}</Text>
            </View>
            <TouchableOpacity
              style={styles.logoutButton}
              onPress={handleLogout}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="logout" size={24} color="#43a28f" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Cards */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.statCard1]}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="check-circle" size={28} color="#34C759" />
            </View>
            <Text style={styles.statNumber}>{completedVisits}</Text>
            <Text style={styles.statLabel}>Completed</Text>
          </View>

          <View style={[styles.statCard, styles.statCard2]}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="clock-outline" size={28} color="#ffd938" />
            </View>
            <Text style={styles.statNumber}>{upcomingVisits}</Text>
            <Text style={styles.statLabel}>Upcoming</Text>
          </View>

          <View style={[styles.statCard, styles.statCard3]}>
            <View style={styles.statIconContainer}>
              <MaterialCommunityIcons name="alert-circle" size={28} color={alerts > 0 ? '#fd435e' : '#ddd'} />
            </View>
            <Text style={styles.statNumber}>{alerts}</Text>
            <Text style={styles.statLabel}>Alerts</Text>
          </View>
        </View>

        {/* Section Title */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Today's Visits</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
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
                      onPress={() => Alert.alert('Success', 'Arrival marked!')}
                    >
                      <MaterialCommunityIcons name="check" size={18} color="#43a28f" />
                      <Text style={styles.actionText}>Mark Arrived</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => Alert.alert('Add Notes', 'Add notes functionality')}
                    >
                      <MaterialCommunityIcons name="pencil" size={18} color="#43a28f" />
                      <Text style={styles.actionText}>Add Notes</Text>
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
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
            <MaterialCommunityIcons name="plus-circle" size={24} color="#43a28f" />
            <Text style={styles.actionCardText}>Log Visit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionCard} activeOpacity={0.7}>
            <MaterialCommunityIcons name="phone" size={24} color="#43a28f" />
            <Text style={styles.actionCardText}>Contact Caregiver</Text>
          </TouchableOpacity>
        </View>

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
  logoutButton: {
    padding: 8,
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
});
