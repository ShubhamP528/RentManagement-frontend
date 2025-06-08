import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, Alert} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RootStackParamList} from '../stacks/Home';
import {NODE_API_ENDPOINT} from '../constants';
import {useDispatch} from 'react-redux';
import {AppDispatch} from '../redux/store';
import {login} from '../redux/authSlice';

type LoginProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({navigation}: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch<AppDispatch>();

  const handleLogin = async () => {
    if (username && password) {
      try {
        const loginUserData = await fetch(
          `${NODE_API_ENDPOINT}/owner/auth/login`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({username, password}),
          },
        );
        if (!loginUserData.ok) {
          Alert.alert('Error', 'Invalid username or password');
          return;
        }
        const userData = await loginUserData.json();
        // Store user data in AsyncStorage
        console.log(userData);
        dispatch(login({token: userData.token, username: userData.username}));
        Alert.alert('Success', `Welcome, ${userData.username}!`);
        navigation.replace('Properties');
      } catch (error) {
        console.error('Error fetching user data:', error);
        Alert.alert('Error', 'Failed to log in. Please try again.');
      }
    } else {
      Alert.alert('Error', 'Please enter both username and password.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-100 items-center justify-center p-6">
      <View className="w-full max-w-md bg-white p-8 rounded-2xl shadow-lg">
        {/* <Text className="text-2xl font-bold text-center text-gray-800 mb-6">
          Login
        </Text> */}

        <TextInput
          className="w-full p-4 border border-gray-300 rounded-lg mb-4 text-base"
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
        />

        <TextInput
          className="w-full p-4 border border-gray-300 rounded-lg mb-4 text-base"
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        <TouchableOpacity
          className="bg-blue-500 py-3 rounded-lg items-center"
          onPress={handleLogin}>
          <Text className="text-white font-semibold text-lg">Login</Text>
        </TouchableOpacity>

        <Text className="text-center text-gray-500 text-sm mt-4">
          Don't have an account? <Text className="text-blue-500">Sign Up</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
