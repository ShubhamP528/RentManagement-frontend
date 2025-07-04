import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {RootStackParamList} from '../stacks/Home';
import {NODE_API_ENDPOINT} from '../constants';
import {useDispatch} from 'react-redux';
import {AppDispatch} from '../redux/store';
import {login} from '../redux/authSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons'; // or Ionicons
import {useColorScheme} from 'react-native';
type LoginProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({navigation}: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const [showPassword, setShowPassword] = useState(false);
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (username && password) {
      try {
        setLoading(true);
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
          setLoading(false);
          Alert.alert('Error', 'Invalid username or password');
          return;
        }
        const userData = await loginUserData.json();
        setLoading(false);
        // Store user data in AsyncStorage
        console.log(userData);
        dispatch(login({token: userData.token, username: userData.username}));
        Alert.alert('Success', `Welcome, ${userData.username}!`);
        navigation.replace('Properties');
      } catch (error) {
        setLoading(false);
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
          placeholderTextColor="#9CA3AF" // fallback for older versions if class doesn't work
          value={username}
          onChangeText={setUsername}
        />

        {/* <TextInput
          className="w-full p-4 border border-gray-300 rounded-lg mb-4 text-base"
          placeholder="Password"
          placeholderTextColor="#9CA3AF" // fallback for older versions if class doesn't work
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        /> */}
        <View className="w-full mb-4 flex-row items-center border border-gray-300 dark:border-gray-700 rounded-lg px-4 bg-white dark:bg-gray-800">
          <TextInput
            className="flex-1 py-4 text-base text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            placeholder="Password"
            placeholderTextColor={
              colorScheme === 'dark' ? '#6B7280' : '#9CA3AF'
            }
            secureTextEntry={!showPassword}
            value={password}
            onChangeText={setPassword}
          />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Icon
              name={showPassword ? 'eye-off' : 'eye'}
              size={24}
              color={colorScheme === 'dark' ? '#FFF' : '#000'}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          className="bg-blue-500 py-3 rounded-lg items-center"
          onPress={handleLogin}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator size={'small'} color="#ffff" />
          ) : (
            <Text className="text-white font-semibold text-lg">Login</Text>
          )}
        </TouchableOpacity>

        <Text className="text-center text-gray-500 text-sm mt-4">
          Don't have an account? <Text className="text-blue-500">Sign Up</Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
