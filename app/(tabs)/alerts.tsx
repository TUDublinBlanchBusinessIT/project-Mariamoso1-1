import { useAuth } from '@/Context/Authcontext';
import { acknowledgeAlert, getUserVisits, checkAndFlagMissedVisits } from '@/lib/visitService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
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

export default function AlertsScreen() {
  const { user } = useAuth();
  const [alerts, setAlerts] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadAlerts();
    }, [user?.uid])
  );

  const loadAlerts = async () => {
    if (!user?.uid) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Check and auto-flag missed visits first
      await checkAndFlagMissedVisits(user.uid);

      const data = await getUserVisits(user.uid);

      // Filter only visits with alert statuses and not acknowledged
      const alertVisits: Visit[] = data
        .filter((doc: any) =>
          (doc.status === 'missed' ||
          doc.status === 'delayed' ||
          doc.status === 'substituted') &&
          !doc.acknowledged
        )
        .map((doc: any) => ({
          id: doc.id || '',
          caregiverName: doc.caregiverName || '',
          scheduledDate: doc.scheduledDate || '',
          scheduledTime: doc.scheduledTime || '',
          actualArrival: doc.actualArrival,
          status: doc.status || 'scheduled',
          notes: doc.notes,
          userId: doc.userId || '',
          timestamp: doc.timestamp || Date.now(),
          acknowledged: doc.acknowledged || false,
        }));

      // Sort by date (most recent first)
      alertVisits.sort((a, b) => {
        const dateA = new Date(a.scheduledDate).getTime();
        const dateB = new Date(b.scheduledDate).getTime();
        return dateB - dateA;
      });

      setAlerts(alertVisits);
    } catch (error) {
      console.error('Error loading alerts:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  }, [user?.uid]);

  const getAlertColor = (status: string) => {
    switch (status) {
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

  const getAlertIcon = (status: string) => {
    switch (status) {
      case 'missed':
        return 'alert-circle';
      case 'substituted':
        return 'account-switch';
      case 'delayed':
        return 'clock-alert';
      default:
        return 'information';
    }
  };

  const getAlertTitle = (status: string) => {
    switch (status) {
      case 'missed':
        return 'Missed Visit';
      case 'substituted':
        return 'Caregiver Substituted';
      case 'delayed':
        return 'Visit Delayed';
      default:
        return 'Alert';
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

  const handleAcknowledge = (alertId: string, caregiverName: string, status: string) => {
    Alert.alert(
      'Acknowledge Alert',
      `Acknowledge the ${status} visit alert for ${caregiverName}? The visit will remain in your history but be removed from alerts.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Acknowledge',
          style: 'default',
          onPress: async () => {
            try {
              await acknowledgeAlert(alertId);
              Alert.alert('Success', 'Alert acknowledged');
              await loadAlerts();
            } catch (error) {
              Alert.alert('Error', 'Failed to acknowledge alert');
              console.error('Error acknowledging alert:', error);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <Text style={styles.title}>Alerts</Text>
        <Text style={styles.subtitle}>Visit notifications and alerts</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#43a28f" />
            <Text style={styles.loadingText}>Loading alerts...</Text>
          </View>
        ) : alerts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <MaterialCommunityIcons name="bell-off" size={64} color="#ccc" />
            <Text style={styles.emptyText}>No alerts</Text>
            <Text style={styles.emptySubtext}>You're all caught up!</Text>
          </View>
        ) : (
          <View style={styles.alertsList}>
            {alerts.map((alert) => (
              <View
                key={alert.id}
                style={[
                  styles.alertCard,
                  { borderLeftColor: getAlertColor(alert.status) }
                ]}
              >
                <View style={styles.alertHeader}>
                  <View style={styles.alertIconContainer}>
                    <MaterialCommunityIcons
                      name={getAlertIcon(alert.status)}
                      size={24}
                      color={getAlertColor(alert.status)}
                    />
                  </View>
                  <View style={styles.alertInfo}>
                    <Text style={styles.alertTitle}>{getAlertTitle(alert.status)}</Text>
                    <Text style={styles.caregiverName}>{alert.caregiverName}</Text>
                  </View>
                </View>

                <View style={styles.alertDetails}>
                  <View style={styles.dateTimeRow}>
                    <MaterialCommunityIcons name="calendar" size={14} color="#666" />
                    <Text style={styles.dateText}>{formatDate(alert.scheduledDate)}</Text>
                    <MaterialCommunityIcons
                      name="clock-outline"
                      size={14}
                      color="#666"
                      style={{ marginLeft: 12 }}
                    />
                    <Text style={styles.timeText}>{alert.scheduledTime}</Text>
                  </View>

                  {alert.notes && (
                    <View style={styles.notesContainer}>
                      <MaterialCommunityIcons name="note-text" size={14} color="#666" />
                      <Text style={styles.notesText}>{alert.notes}</Text>
                    </View>
                  )}
                </View>

                <TouchableOpacity
                  style={styles.acknowledgeButton}
                  onPress={() => handleAcknowledge(alert.id, alert.caregiverName, alert.status)}
                >
                  <MaterialCommunityIcons name="check" size={18} color="#fff" />
                  <Text style={styles.acknowledgeButtonText}>Acknowledge</Text>
                </TouchableOpacity>
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
  alertsList: {
    padding: 16,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  alertIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff5f5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
  },
  caregiverName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#333',
  },
  alertDetails: {
    marginBottom: 12,
  },
  dateTimeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  dateText: {
    fontSize: 13,
    color: '#666',
  },
  timeText: {
    fontSize: 13,
    color: '#666',
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f5f5f5',
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  acknowledgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#43a28f',
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  acknowledgeButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  bottomSpacing: {
    height: 20,
  },
});
