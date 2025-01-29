import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, TextInput, RefreshControl } from 'react-native';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { API_BASE_URL, endpoints } from '../utils/config';
import { Ionicons } from '@expo/vector-icons';

export default function ReservationManager() {
  const [pendingReservations, setPendingReservations] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedReservation, setSelectedReservation] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchPendingReservations();
  }, []);

  const fetchPendingReservations = async () => {
    try {
      const q = query(
        collection(db, 'appointments'),
        where('status', '==', 'pending')
      );
      const querySnapshot = await getDocs(q);
      
      console.log('Found pending appointments:', querySnapshot.size);
      
      const reservations = await Promise.all(
        querySnapshot.docs.map(async doc => {
          const appointmentData = doc.data();
          console.log('Processing appointment:', appointmentData);
          
          // Get email from either customerEmail or email field
          const customerEmail = appointmentData.customerEmail || appointmentData.email;
          
          if (!customerEmail) {
            console.error('No email found in appointment:', doc.id);
            return {
              id: doc.id,
              ...appointmentData,
              customerName: appointmentData.customerName || 'Unknown',
              customerPhone: appointmentData.customerPhone || 'No phone'
            };
          }

          try {
            console.log('Fetching user data for email:', customerEmail);
            const response = await fetch(endpoints.users.byEmail(customerEmail));
            
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const userData = await response.json();
            console.log('User data received:', userData);

            if (userData.status === 'success') {
              return {
                id: doc.id,
                ...appointmentData,
                customerName: userData.data.name || appointmentData.customerName,
                customerPhone: userData.data.phoneNumber || appointmentData.customerPhone,
              };
            }
          } catch (error) {
            console.error('Error fetching user details for email:', customerEmail, error);
          }

          // Fallback to appointment data if API call fails
          return {
            id: doc.id,
            ...appointmentData,
            customerName: appointmentData.customerName || 'Unknown',
            customerPhone: appointmentData.customerPhone || 'No phone'
          };
        })
      );

      console.log('Final processed reservations:', reservations);
      setPendingReservations(reservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchPendingReservations().then(() => {
      setRefreshing(false);
      console.log('✅ Reservations refreshed');
    });
  }, []);

  const handleReservationAction = async (reservation, action) => {
    try {
      const appointmentRef = doc(db, 'appointments', reservation.id);
      if (action === 'approve') {
        await updateDoc(appointmentRef, {
          status: 'approved',
          updatedAt: new Date()
        });
      } else {
        setSelectedReservation(reservation);
        setModalVisible(true);
      }
      fetchPendingReservations(); // Refresh the list
    } catch (error) {
      console.error('Error updating reservation:', error);
    }
  };

  const handleReject = async () => {
    try {
      const appointmentRef = doc(db, 'appointments', selectedReservation.id);
      await updateDoc(appointmentRef, {
        status: 'rejected',
        rejectionReason: rejectionReason,
        updatedAt: new Date()
      });
      setModalVisible(false);
      setRejectionReason('');
      setSelectedReservation(null);
      fetchPendingReservations();
    } catch (error) {
      console.error('Error rejecting reservation:', error);
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.reservationCard}>
      <View style={styles.customerInfo}>
        <Text style={styles.name}>{item.customerName}</Text>
        <Text style={styles.contactInfo}>
          📞 {item.customerPhone || 'No phone provided'}
        </Text>
      </View>
      <View style={styles.appointmentInfo}>
        <Text style={styles.detail}>Service: {item.service}</Text>
        <Text style={styles.detail}>Date: {new Date(item.date).toLocaleDateString()}</Text>
        <Text style={styles.detail}>Time: {item.time}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.approveButton]}
          onPress={() => handleReservationAction(item, 'approve')}
        >
          <Text style={styles.buttonText}>Approve</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleReservationAction(item, 'reject')}
        >
          <Text style={styles.buttonText}>Reject</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Pending Reservations</Text>
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={onRefresh}
        >
          <Ionicons 
            name="refresh" 
            size={24} 
            color="#4CAF50" 
            style={[
              styles.refreshIcon,
              refreshing && styles.refreshingIcon
            ]}
          />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={pendingReservations}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#4CAF50"
            colors={['#4CAF50']}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No pending reservations</Text>
        }
      />

      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Rejection Reason</Text>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={4}
              value={rejectionReason}
              onChangeText={setRejectionReason}
              placeholder="Enter reason for rejection"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleReject}
              >
                <Text style={styles.buttonText}>Confirm</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  setRejectionReason('');
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  reservationCard: {
    backgroundColor: '#333',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  customerInfo: {
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#444',
    paddingBottom: 10,
  },
  contactInfo: {
    color: '#fff',
    fontSize: 14,
    marginTop: 3,
  },
  appointmentInfo: {
    marginVertical: 10,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  detail: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 3,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  approveButton: {
    backgroundColor: '#4CAF50',
  },
  rejectButton: {
    backgroundColor: '#f44336',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  emptyText: {
    color: '#fff',
    textAlign: 'center',
    marginTop: 20,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#333',
    padding: 20,
    borderRadius: 8,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#444',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  refreshButton: {
    padding: 8,
  },
  refreshIcon: {
    opacity: 0.9,
  },
  refreshingIcon: {
    opacity: 0.5,
    transform: [{ rotate: '45deg' }],
  },
});
