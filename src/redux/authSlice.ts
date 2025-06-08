import AsyncStorage from '@react-native-async-storage/async-storage';
import {createAsyncThunk, createSlice, PayloadAction} from '@reduxjs/toolkit';
import {NODE_API_ENDPOINT} from '../constants';

interface User {
  token: string;
  username: string;
}

interface AuthState {
  user: User | null;
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AuthState = {
  status: 'loading',
  user: null,
  error: null,
};

export const retriveAuth = createAsyncThunk<
  {user: User} | null,
  void,
  {rejectValue: string}
>('/auth/retriveAuth', async (_, {rejectWithValue}) => {
  try {
    const storedAuth = await AsyncStorage.getItem('rent-owner');
    if (storedAuth) {
      const parsedUser: string = JSON.parse(storedAuth);
      console.log(parsedUser);
      console.log(typeof parsedUser);
      console.log('api calling');
      const response = await fetch(`${NODE_API_ENDPOINT}/owner/auth/verify`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${parsedUser}`,
        },
      });
      console.log('api calling');

      if (!response.ok) {
        console.log('api failed');
        throw new Error('Failed to verify token');
      }

      console.log('api successful');

      const parsedProps = await response.json();
      console.log(response);
      const user: User = {
        token: parsedUser,
        username: parsedProps.username,
      };
      return {user};
    } else {
      return null;
    }
  } catch (error: any) {
    return rejectWithValue(error.message || 'Failed to retrieve user data');
  }
});

const autSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<User>) => {
      console.log(action.payload);
      state.user = action.payload;
      AsyncStorage.setItem('rent-owner', JSON.stringify(action.payload.token));
    },
    logout: state => {
      state.user = null;
      AsyncStorage.removeItem('rent-owner');
    },
  },
  extraReducers: builder => {
    builder.addCase(retriveAuth.pending, state => {
      state.status = 'loading';
    });
    builder.addCase(retriveAuth.fulfilled, (state, action) => {
      if (action.payload && action.payload.user) {
        state.status = 'succeeded';
        state.user = action.payload.user;
      } else {
        // Handle the case where no user is found (no token or invalid token)
        state.status = 'succeeded';
        state.user = null;
      }
    });
    builder.addCase(retriveAuth.rejected, (state, action) => {
      state.status = 'failed';
      state.error = action.payload
        ? action.payload
        : 'Authentication retrieval failed';
    });
  },
});

export const {login, logout} = autSlice.actions;
export default autSlice.reducer;
