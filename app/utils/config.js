// Use 10.0.2.2 for Android emulator to access localhost
export const API_BASE_URL = 'http://10.0.2.2:5000/api/v1';

export const endpoints = {
  users: {
    byEmail: (email) => `${API_BASE_URL}/users/by-email/${email}`,
  },
};
