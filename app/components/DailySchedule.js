import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { collection, query, where, getDocs, deleteDoc, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function DailySchedule() {
  const [selectedDate, setSelectedDate] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const [deleteReason, setDeleteReason] = useState('');

  const fetchDayAppointments = async (date) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'appointments'),
        where('date', '==', date),
        where('status', '==', 'approved')
      );
      
      const querySnapshot = await getDocs(q);
      const apps = querySnapshot.docs
        .map(doc => ({
          id: doc.id,
          ...doc.data()
        }))
        .sort((a, b) => a.time.localeCompare(b.time));
      
      setAppointments(apps);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteReason.trim()) {
      Alert.alert('Error', 'Please provide a reason for deletion');
      return;
    }

    try {
      const appointmentRef = doc(db, 'appointments', selectedAppointment.id);
      
      // Create a record of the deletion in a separate collection
      const deletionRecord = {
        appointmentId: selectedAppointment.id,
        customerName: selectedAppointment.customerName,
        customerPhone: selectedAppointment.customerPhone,
        date: selectedAppointment.date,
        time: selectedAppointment.time,
        service: selectedAppointment.service,
        deleteReason: deleteReason,
        deletedAt: new Date(),
        deletedBy: 'admin'
      };

      // First create deletion record
      await addDoc(collection(db, 'deletedAppointments'), deletionRecord);
      
      // Then delete the actual appointment
      await deleteDoc(appointmentRef);
      
      // Refresh the appointments list
      await fetchDayAppointments(selectedDate);
      
      setDeleteModalVisible(false);
      setDeleteReason('');
      setSelectedAppointment(null);
      
      Alert.alert('Success', 'Appointment deleted successfully');
    } catch (error) {
      console.error('Error deleting appointment:', error);
      Alert.alert('Error', 'Failed to delete appointment');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Calendar
        style={styles.calendar}
        onDayPress={(day) => {
          setSelectedDate(day.dateString);
          fetchDayAppointments(day.dateString);
        }}
        markedDates={{
          [selectedDate]: { selected: true, selectedColor: '#4CAF50' }
        }}
        theme={{
          calendarBackground: '#333333',
          textSectionTitleColor: '#ffffff',
          selectedDayBackgroundColor: '#4CAF50',
          selectedDayTextColor: '#ffffff',
          todayTextColor: '#4CAF50',
          dayTextColor: '#ffffff',
          textDisabledColor: '#666666',
          monthTextColor: '#ffffff',
          arrowColor: '#4CAF50',
        }}
      />

      <View style={styles.listContainer}>
        <Text style={styles.dateTitle}>
          {selectedDate ? new Date(selectedDate).toLocaleDateString() : 'Select a date'}
        </Text>
        
        {appointments.length > 0 ? (
          appointments.map(item => (
            <View key={item.id} style={styles.appointmentCard}>
              <View style={styles.timeContainer}>
                <Text style={styles.time}>{item.time}</Text>
              </View>
              <View style={styles.detailsContainer}>
                <Text style={styles.customerName}>{item.customerName}</Text>
                <Text style={styles.service}>{item.service}</Text>
                <Text style={styles.phone}>{item.customerPhone}</Text>
              </View>
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={() => {
                  setSelectedAppointment(item);
                  setDeleteModalVisible(true);
                }}
              >
                <Ionicons name="trash-outline" size={20} color="#f44336" />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <Text style={styles.emptyText}>
            {selectedDate ? 'No appointments for this day' : 'Select a date to view appointments'}
          </Text>
        )}
      </View>

      <Modal
        visible={deleteModalVisible}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Delete Appointment</Text>
            <Text style={styles.modalSubtitle}>
              Please provide a reason for deletion:
            </Text>
            <TextInput
              style={styles.input}
              multiline
              numberOfLines={4}
              value={deleteReason}
              onChangeText={setDeleteReason}
              placeholder="Enter reason for deletion"
              placeholderTextColor="#999"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteConfirmButton]}
                onPress={handleDelete}
              >
                <Text style={styles.buttonText}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setDeleteModalVisible(false);
                  setDeleteReason('');
                  setSelectedAppointment(null);
                }}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a1a',
  },
  calendar: {
    marginBottom: 10,
    borderRadius: 10,
    elevation: 4,
  },
  listContainer: {
    padding: 10,
    paddingBottom: 20, // Add padding at bottom for better scrolling
  },
  dateTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  appointmentCard: {
    backgroundColor: '#333',
    borderRadius: 8,
    marginBottom: 10,
    padding: 15,
    flexDirection: 'row',
  },
  timeContainer: {
    backgroundColor: '#4CAF50',
    borderRadius: 5,
    padding: 8,
    justifyContent: 'center',
    marginRight: 10,
  },
  time: {
    color: '#fff',
    fontWeight: 'bold',
  },
  detailsContainer: {
    flex: 1,
  },
  customerName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  service: {
    color: '#ccc',
    fontSize: 14,
  },
  phone: {
    color: '#999',
    fontSize: 12,
  },
  emptyText: {
    color: '#999',
    textAlign: 'center',
    marginTop: 20,
  },
  deleteButton: {
    padding: 10,
    justifyContent: 'center',
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
    marginBottom: 10,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#ccc',
    marginBottom: 15,
  },
  input: {
    backgroundColor: '#444',
    color: '#fff',
    padding: 10,
    borderRadius: 5,
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 15,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    padding: 10,
    borderRadius: 5,
    flex: 1,
    marginHorizontal: 5,
  },
  deleteConfirmButton: {
    backgroundColor: '#f44336',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
