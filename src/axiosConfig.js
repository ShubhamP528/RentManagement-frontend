import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {NODE_API_ENDPOINT} from './constants';
import {store} from './store'; // Import your Redux store
import {logout} from './slices/authSlice'; // Import logout action
import {navigationRef} from './navigationRef';

const api = axios.create({
  baseURL: NODE_API_ENDPOINT,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - Add token to headers
api.interceptors.request.use(
  async config => {
    const storedAuth = await AsyncStorage.getItem('rent-owner');
    if (storedAuth) {
      const token = JSON.parse(storedAuth);
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  },
);

// Response interceptor - Handle logout
api.interceptors.response.use(
  response => {
    return response;
  },
  async error => {
    if (error.response) {
      const {status, data} = error.response;

      // Check for your specific logout conditions
      if (
        (status === 400 &&
          data.message === 'You are logged out. Login again') ||
        status === 401
      ) {
        console.log('Session expired, logging out...');

        // Dispatch logout action to Redux
        store.dispatch(logout());

        // Navigate to login screen
        if (navigationRef.isReady()) {
          navigationRef.reset({
            index: 0,
            routes: [{name: 'Login'}],
          });
        }
      }
    }

    return Promise.reject(error);
  },
);

export default api;
