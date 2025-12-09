import { db } from '@/config/firebaseConfig';
import { addDoc, collection, deleteDoc, doc, getDocs, query, Timestamp, updateDoc, where } from 'firebase/firestore';

export interface Visit {
  id?: string;
  userId: string;
  caregiverName: string;
  scheduledDate: string;
  scheduledTime: string;
  actualArrival?: string;
  status: 'scheduled' | 'completed' | 'missed' | 'substituted' | 'delayed';
  notes?: string;
  timestamp: number;
  acknowledged?: boolean;
}

/**
 * Add a new visit to Firestore
 */
export const addVisit = async (userId: string, visit: Omit<Visit, 'id' | 'timestamp'>) => {
  try {
    const docRef = await addDoc(collection(db, 'visits'), {
      ...visit,
      userId,
      timestamp: Timestamp.now(),
    });
    return { success: true, visitId: docRef.id };
  } catch (error) {
    console.error('Error adding visit:', error);
    throw error;
  }
};

/**
 * Get all visits for a user
 */
export const getUserVisits = async (userId: string) => {
  try {
    const q = query(collection(db, 'visits'), where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const visits: Visit[] = [];
    querySnapshot.forEach((doc) => {
      visits.push({
        id: doc.id,
        ...doc.data(),
      } as Visit);
    });
    return visits;
  } catch (error) {
    console.error('Error getting visits:', error);
    throw error;
  }
};

/**
 * Update visit status
 */
export const updateVisitStatus = async (visitId: string, status: Visit['status'], actualArrival?: string) => {
  try {
    const visitRef = doc(db, 'visits', visitId);
    const updateData: any = { status };
    if (actualArrival) {
      updateData.actualArrival = actualArrival;
    }
    await updateDoc(visitRef, updateData);
    return { success: true };
  } catch (error) {
    console.error('Error updating visit:', error);
    throw error;
  }
};

/**
 * Get today's visits for a user
 */
export const getTodaysVisits = async (userId: string) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const q = query(
      collection(db, 'visits'),
      where('userId', '==', userId),
      where('scheduledDate', '>=', today.toISOString().split('T')[0]),
      where('scheduledDate', '<', tomorrow.toISOString().split('T')[0])
    );

    const querySnapshot = await getDocs(q);
    const visits: Visit[] = [];
    querySnapshot.forEach((doc) => {
      visits.push({
        id: doc.id,
        ...doc.data(),
      } as Visit);
    });
    return visits;
  } catch (error) {
    console.error('Error getting today visits:', error);
    throw error;
  }
};

/**
 * Update a visit
 */
export const updateVisit = async (visitId: string, visitData: Partial<Omit<Visit, 'id' | 'userId' | 'timestamp'>>) => {
  try {
    const visitRef = doc(db, 'visits', visitId);
    await updateDoc(visitRef, visitData);
    return { success: true };
  } catch (error) {
    console.error('Error updating visit:', error);
    throw error;
  }
};

/**
 * Delete a visit
 */
export const deleteVisit = async (visitId: string) => {
  try {
    const visitRef = doc(db, 'visits', visitId);
    await deleteDoc(visitRef);
    return { success: true };
  } catch (error) {
    console.error('Error deleting visit:', error);
    throw error;
  }
};

/**
 * Acknowledge an alert (mark visit as acknowledged)
 */
export const acknowledgeAlert = async (visitId: string) => {
  try {
    const visitRef = doc(db, 'visits', visitId);
    await updateDoc(visitRef, { acknowledged: true });
    return { success: true };
  } catch (error) {
    console.error('Error acknowledging alert:', error);
    throw error;
  }
};
