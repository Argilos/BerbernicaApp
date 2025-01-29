const express = require('express');
const router = express.Router();
const { db } = require('../config/db');

// GET user by email
router.get('/by-email/:email', async (req, res) => {
  try {
    const { email } = req.params;
    console.log('📧 API request for email:', email);
    
    // Query Firestore for user with matching email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      console.log('❌ No user found for email:', email);
      return res.status(404).json({
        status: 'error',
        message: 'User not found'
      });
    }

    // Get the first matching document
    const userData = snapshot.docs[0].data();
    console.log('✅ Found user data:', userData);
    
    // Remove sensitive information
    const safeUserData = {
      name: userData.name,
      email: userData.email,
      phoneNumber: userData.phoneNumber || '',
      role: userData.role,
      createdAt: userData.createdAt
    };

    console.log('🔒 Sending safe user data:', safeUserData);
    res.status(200).json({
      status: 'success',
      data: safeUserData
    });

  } catch (error) {
    console.error('❌ API Error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Error fetching user data',
      error: error.message
    });
  }
});

module.exports = router;
