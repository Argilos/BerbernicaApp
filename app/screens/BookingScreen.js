import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Dimensions, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Calendar } from 'react-native-calendars';
import { createAppointment, getBookedSlots } from '../services/api';
import { getAvailableSlots, createTimeSlot } from '../utils/timeSlotUtils';
import { getFirestore, doc, getDoc, collection, query, where, getDocs, addDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../config/firebase';
import { CommonActions } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { API_BASE_URL, endpoints } from '../utils/config';

export default function BookingScreen({ navigation, route }) {
  const { user } = useAuth();
  
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState(null);
  const { selectedService, selectedBarber } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [userData, setUserData] = useState(null);

  // Time slots with availability
  const timeSlots = {
    morning: [
      { time: '09:00', available: true },
      { time: '09:30', available: true },
      { time: '10:00', available: true },
      { time: '10:30', available: true },
      { time: '11:00', available: true },
      { time: '11:30', available: true },
      { time: '12:00', available: true },
      { time: '12:30', available: true },
    ],
    afternoon: [
      { time: '13:00', available: true },
      { time: '13:30', available: true },
      { time: '14:00', available: true },
      { time: '14:30', available: true },
      { time: '15:00', available: true },
      { time: '15:30', available: true },
      { time: '16:00', available: true },
      { time: '16:30', available: true },
    ],
    evening: [
      { time: '17:00', available: true },
      { time: '17:30', available: true },
      { time: '18:00', available: true },
      { time: '18:30', available: true },
      { time: '19:00', available: true },
      { time: '19:30', available: true },
      { time: '20:00', available: true },
    ],
  };

  // Get today's date and end of year date
  const today = new Date();
  const todayString = today.toISOString().split('T')[0];
  const endOfYear = new Date(today.getFullYear(), 11, 31); // December 31st of current year
  
  // Calculate dates for the whole year
  const availableDates = {};
  let currentDate = new Date(today);
  while (currentDate <= endOfYear) {
    const dateString = currentDate.toISOString().split('T')[0];
    availableDates[dateString] = {
      disabled: false,
      marked: true,
      dotColor: '#4CAF50'
    };
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Replace the fetchAvailableSlots function
  const fetchAvailableSlots = async (date) => {
    try {
      setIsLoading(true);
      console.log('Fetching slots for date:', date);

      // Create a query for appointments on the selected date only
      const appointmentsRef = collection(db, 'appointments');
      const q = query(
        appointmentsRef,
        where('date', '==', date)
      );

      const querySnapshot = await getDocs(q);
      const bookedTimes = [];
      
      console.log('Total appointments found:', querySnapshot.size); // Debug log

      querySnapshot.forEach((doc) => {
        const appointmentData = doc.data();
        console.log('Appointment data:', appointmentData); // Debug log
        
        // Only consider appointments that aren't cancelled
        if (appointmentData.status !== 'cancelled') {
          bookedTimes.push(appointmentData.time);
        }
      });

      console.log('Final booked times:', bookedTimes);

      // Process time slots with booked times
      const processed = {
        morning: timeSlots.morning.map(slot => ({
          ...slot,
          isBooked: bookedTimes.includes(slot.time),
          available: !bookedTimes.includes(slot.time) && isSlotValid(date, slot.time)
        })),
        afternoon: timeSlots.afternoon.map(slot => ({
          ...slot,
          isBooked: bookedTimes.includes(slot.time),
          available: !bookedTimes.includes(slot.time) && isSlotValid(date, slot.time)
        })),
        evening: timeSlots.evening.map(slot => ({
          ...slot,
          isBooked: bookedTimes.includes(slot.time),
          available: !bookedTimes.includes(slot.time) && isSlotValid(date, slot.time)
        }))
      };

      setBookedSlots(bookedTimes);
      setAvailableSlots(processed);
    } catch (error) {
      console.error('Error fetching slots:', error);
      console.error('Error details:', error.code, error.message); // Additional error logging
      Alert.alert('Error', 'Could not fetch available slots. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Add function to check if slot is still valid
  const isSlotValid = (date, time) => {
    const slotDateTime = new Date(`${date}T${time}`);
    const now = new Date();
    return slotDateTime > now;
  };

  // Remove setTimeout from fetchUserData
  const fetchUserData = async () => {
    try {
      if (!user || !user.email) {
        console.log('No user data available');
        return;
      }
  
      // First try getting data from Firestore directly as fallback
      try {
        const userRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userRef);
        
        if (userDoc.exists()) {
          const firestoreData = userDoc.data();
          const userData = {
            uid: user.uid,
            email: firestoreData.email,
            name: firestoreData.name,
            phoneNumber: firestoreData.phoneNumber,
            role: firestoreData.role
          };
          console.log('📱 User data from Firestore:', userData);
          setUserData(userData);
        }
      } catch (fbError) {
        console.error('Firestore fallback error:', fbError);
      }
  
      // Then try the API
      console.log('🔍 Fetching user data from API for:', user.email);
      const response = await fetch(endpoints.users.byEmail(user.email));
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('📱 API Response:', data);
  
      if (data.status === 'success') {
        const apiUserData = data.data;
        const updatedUserData = {
          uid: user.uid,
          email: apiUserData.email,
          name: apiUserData.name,
          phoneNumber: apiUserData.phoneNumber,
          role: apiUserData.role
        };
  
        console.log('📱 Updated user data:', updatedUserData);
        setUserData(updatedUserData);
      }
    } catch (error) {
      console.error('❌ Error in fetchUserData:', error);
    }
  };
  
  // Update the useEffect to use user data
  useEffect(() => {
    if (user?.email) {
      fetchUserData();
    }
  }, [user]);

  // Update the handleBooking function
  const handleBooking = async () => {
    if (!selectedDate || !selectedTime) return;

    try {
      console.log("Booking with user:", user); // Debug log
      if (!user || !userData) {
        navigation.navigate('Login');
        return;
      }

      setIsLoading(true);

      // Format the appointment data to match the required structure
      const appointmentData = {
        createdAt: Timestamp.fromDate(new Date()), // This will store as Firestore timestamp
        customerName: userData.name || "Guest User", // Updated from fullName to name
        customerPhone: userData.phoneNumber || "No phone provided",
        customerEmail: user.email,
        date: selectedDate, // Already in "YYYY-MM-DD" format
        phoneNumber: userData.phoneNumber || "",
        service: selectedService.name, // Use the service name instead of ID
        status: "pending", // Set initial status as pending
        time: selectedTime, // Already in "HH:mm" format
        // Optional: Keep these fields if you need them
        barberId: selectedBarber.id,
        userId: user.uid,
        email: user.email
      };

      console.log('📞 Appointment data phone:', appointmentData.customerPhone); // Debug log

      const appointmentsRef = collection(db, 'appointments');
      await addDoc(appointmentsRef, appointmentData);

      Alert.alert(
        "Success",
        "Your appointment request has been submitted and is pending approval",
        [{ 
          text: "OK", 
          onPress: () => navigation.navigate('Home')  // Update navigation path
        }]
      );
    } catch (error) {
      console.error('Booking error:', error);
      Alert.alert("Error", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Update useEffect to use new fetch function
  useEffect(() => {
    if (selectedDate) {
      fetchAvailableSlots(selectedDate);
    }
  }, [selectedDate]);

  // Update the Calendar onDayPress handler
  const handleDateSelect = (day) => {
    setSelectedDate(day.dateString);
    setSelectedTime(null); // Reset selected time
    fetchAvailableSlots(day.dateString);
  };

  // Pre-process time slots based on booked slots
  const processedTimeSlots = useMemo(() => {
    const processed = {
      morning: timeSlots.morning.map(slot => ({
        ...slot,
        isBooked: bookedSlots.includes(slot.time)
      })),
      afternoon: timeSlots.afternoon.map(slot => ({
        ...slot,
        isBooked: bookedSlots.includes(slot.time)
      })),
      evening: timeSlots.evening.map(slot => ({
        ...slot,
        isBooked: bookedSlots.includes(slot.time)
      }))
    };
    return processed;
  }, [bookedSlots]);

  // Update the renderTimeSlot function to use pre-processed data
  const renderTimeSlot = (slot, index) => (
    <TouchableOpacity
      key={index}
      style={[
        styles.timeSlot,
        slot.isBooked && styles.unavailableSlot,
        selectedTime === slot.time && styles.selectedTimeSlot,
      ]}
      disabled={slot.isBooked}
      onPress={() => setSelectedTime(slot.time)}
    >
      <Text style={[
        styles.timeText,
        slot.isBooked && styles.unavailableText,
        selectedTime === slot.time && styles.selectedTimeText,
      ]}>
        {slot.time}
      </Text>
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#1a1a1a', '#2d2d2d']} style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Icon name="arrow-back" size={24} color="#4CAF50" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Rezerviši termin</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Booking Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Pregled rezervacije</Text>
          <View style={styles.summaryRow}>
            <Icon name="person" size={20} color="#4CAF50" />
            <Text style={styles.summaryText}>
              {userData?.name || 'Loading...'} {/* Updated from fullName to name */}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Icon name="phone" size={20} color="#4CAF50" />
            <Text style={styles.summaryText}>
              {userData?.phoneNumber || 'No phone number'}
            </Text>
          </View>
          <View style={styles.summaryRow}>
            <Icon name="content-cut" size={20} color="#4CAF50" />
            <Text style={styles.summaryText}>{selectedService?.name} - {selectedService?.price}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Icon name="person" size={20} color="#4CAF50" />
            <Text style={styles.summaryText}>{selectedBarber?.name}</Text>
          </View>
        </View>

        {/* Calendar */}
        <Text style={styles.sectionTitle}>Odaberi datum</Text>
        <Calendar
          style={styles.calendar}
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
          minDate={todayString}

          maxDate={endOfYear.toISOString().split('T')[0]}
          markedDates={{
            ...availableDates,
            [selectedDate]: {
              selected: true,
              selectedColor: '#4CAF50',
            },
          }}
          onDayPress={handleDateSelect}
        />

        {/* Time Slots */}
        {selectedDate && (
          <>
            <Text style={styles.sectionTitle}>Odaberi vrijeme</Text>
            <View style={styles.timeContainer}>
              <Text style={styles.periodTitle}>Jutro</Text>
              <View style={styles.timeSlotGroup}>
                {processedTimeSlots.morning.map((slot, index) => renderTimeSlot(slot, index))}
              </View>

              <Text style={styles.periodTitle}>Poslijepodne</Text>
              <View style={styles.timeSlotGroup}>
                {processedTimeSlots.afternoon.map((slot, index) => renderTimeSlot(slot, index))}
              </View>

              <Text style={styles.periodTitle}>Večer</Text>
              <View style={styles.timeSlotGroup}>
                {processedTimeSlots.evening.map((slot, index) => renderTimeSlot(slot, index))}
              </View>
            </View>
          </>
        )}

        <TouchableOpacity 
          style={[
            styles.confirmButton,
            (!selectedDate || !selectedTime || isLoading) && styles.disabledButton
          ]}
          disabled={!selectedDate || !selectedTime || isLoading}
          onPress={handleBooking}
        >
          <Text style={styles.confirmButtonText}>
            {isLoading ? 'Booking...' : 'Confirm Booking'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    padding: 10,
  },
  headerTitle: {
    color: '#ffffff',
    fontSize: 24,
    fontWeight: 'bold',
    marginLeft: 20,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  summaryCard: {
    backgroundColor: '#333333',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
  },
  summaryTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 5,
  },
  summaryText: {
    color: '#ffffff',
    marginLeft: 10,
    fontSize: 16,
  },
  sectionTitle: {
    color: 'white'
  },
  calendar: {
    borderRadius: 12,
    elevation: 4,
    marginBottom: 20,
  },
  timeContainer: {
    marginBottom: 20,
  },
  periodTitle: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '600',
    marginVertical: 10,
  },
  timeSlotGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  timeSlot: {
    backgroundColor: '#333333',
    borderRadius: 8,
    padding: 12,
    marginRight: 10,
    marginBottom: 10,
    width: '23%',
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#4CAF50',
  },
  unavailableSlot: {
    backgroundColor: '#444444',
    opacity: 0.5,
  },
  timeText: {
    color: '#ffffff',
    fontSize: 14,
  },
  unavailableText: {
    color: '#999999',
  },
  selectedTimeText: {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginVertical: 20,
  },
  disabledButton: {
    backgroundColor: '#666666',
    opacity: 0.5,
  },
  confirmButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
});
