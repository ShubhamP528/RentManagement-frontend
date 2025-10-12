import {NativeStackScreenProps} from '@react-navigation/native-stack';
import React, {useState, useRef} from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import {RootStackParamList} from '../stacks/Home';
import {NODE_API_ENDPOINT} from '../constants';
import {useDispatch} from 'react-redux';
import {AppDispatch} from '../redux/store';
import {login} from '../redux/authSlice';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

import {RentAppColors, getRentThemeColors} from '../constants/colors';
import {useTheme} from '../contexts/ThemeContext';
import {ThemedText} from '../component/ThemedText';
import CustomHeader from '../component/CustomHeader';
type LoginProps = NativeStackScreenProps<RootStackParamList, 'Login'>;

const LoginScreen = ({navigation}: LoginProps) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch<AppDispatch>();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  const {isDark} = useTheme();
  const themeColors = getRentThemeColors(isDark);

  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  React.useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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
    <View style={{flex: 1, backgroundColor: themeColors.background}}>
      {/* Custom Header */}
      <CustomHeader
        title="Login"
        subtitle="Welcome"
        showBackButton={false}
        showHomeButton={false}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}>
        <ScrollView
          contentContainerStyle={{flexGrow: 1}}
          showsVerticalScrollIndicator={false}
          style={{backgroundColor: themeColors.background}}>
          {/* Background Decorative Elements */}
          <View
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
            }}>
            <View
              style={{
                position: 'absolute',
                top: -80,
                right: -80,
                width: 160,
                height: 160,
                backgroundColor: isDark ? '#1e3a8a' : '#dbeafe',
                borderRadius: 80,
                opacity: 0.2,
              }}
            />
            <View
              style={{
                position: 'absolute',
                top: 128,
                left: -64,
                width: 128,
                height: 128,
                backgroundColor: isDark ? '#312e81' : '#e0e7ff',
                borderRadius: 64,
                opacity: 0.15,
              }}
            />
            <View
              style={{
                position: 'absolute',
                bottom: 80,
                right: 40,
                width: 96,
                height: 96,
                backgroundColor: isDark ? '#581c87' : '#f3e8ff',
                borderRadius: 48,
                opacity: 0.1,
              }}
            />
          </View>

          <Animated.View
            style={{
              opacity: fadeAnim,
              transform: [{translateY: slideAnim}, {scale: scaleAnim}],
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              paddingHorizontal: 24,
              paddingVertical: 32,
            }}>
            {/* Logo/Brand Section */}
            <View style={{alignItems: 'center', marginBottom: 32}}>
              <View
                style={{
                  width: 80,
                  height: 80,
                  backgroundColor: RentAppColors.primary[500],
                  borderRadius: 16,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 4},
                  shadowOpacity: 0.1,
                  shadowRadius: 8,
                  elevation: 4,
                }}>
                <Icon name="home-variant" size={40} color="#FFFFFF" />
              </View>
              <ThemedText size="3xl" weight="bold" style={{marginBottom: 8}}>
                Welcome Back
              </ThemedText>
              <ThemedText
                variant="secondary"
                style={{textAlign: 'center', fontSize: 16}}>
                Sign in to manage your properties
              </ThemedText>
            </View>

            {/* Login Form */}
            <View style={{width: '100%', maxWidth: 384}}>
              {/* Username Input */}
              <View style={{marginBottom: 24}}>
                <ThemedText
                  size="sm"
                  weight="medium"
                  style={{marginBottom: 8, marginLeft: 4}}>
                  Username
                </ThemedText>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: themeColors.surface,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 4,
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                    borderWidth: 2,
                    borderColor:
                      focusedField === 'username'
                        ? RentAppColors.primary[500]
                        : themeColors.border,
                  }}>
                  <Icon
                    name="account-outline"
                    size={20}
                    color={
                      focusedField === 'username'
                        ? RentAppColors.primary[500]
                        : themeColors.text.tertiary
                    }
                  />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingVertical: 16,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: themeColors.text.primary,
                    }}
                    placeholder="Enter your username"
                    placeholderTextColor={themeColors.text.tertiary}
                    value={username}
                    onChangeText={setUsername}
                    onFocus={() => setFocusedField('username')}
                    onBlur={() => setFocusedField(null)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={{marginBottom: 24}}>
                <ThemedText
                  size="sm"
                  weight="medium"
                  style={{marginBottom: 8, marginLeft: 4}}>
                  Password
                </ThemedText>
                <View
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: themeColors.surface,
                    borderRadius: 12,
                    paddingHorizontal: 16,
                    paddingVertical: 4,
                    shadowColor: '#000',
                    shadowOffset: {width: 0, height: 2},
                    shadowOpacity: 0.1,
                    shadowRadius: 4,
                    elevation: 2,
                    borderWidth: 2,
                    borderColor:
                      focusedField === 'password'
                        ? RentAppColors.primary[500]
                        : themeColors.border,
                  }}>
                  <Icon
                    name="lock-outline"
                    size={20}
                    color={
                      focusedField === 'password'
                        ? RentAppColors.primary[500]
                        : themeColors.text.tertiary
                    }
                  />
                  <TextInput
                    style={{
                      flex: 1,
                      paddingVertical: 16,
                      paddingHorizontal: 12,
                      fontSize: 16,
                      color: themeColors.text.primary,
                    }}
                    placeholder="Enter your password"
                    placeholderTextColor={themeColors.text.tertiary}
                    secureTextEntry={!showPassword}
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={{padding: 8}}>
                    <Icon
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color={themeColors.text.tertiary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Forgot Password */}
              <TouchableOpacity
                style={{alignSelf: 'flex-end', marginBottom: 24}}>
                <ThemedText
                  size="sm"
                  weight="medium"
                  style={{color: RentAppColors.primary[600]}}>
                  Forgot Password?
                </ThemedText>
              </TouchableOpacity>

              {/* Login Button */}
              <TouchableOpacity
                style={{
                  backgroundColor: RentAppColors.primary[500],
                  paddingVertical: 16,
                  borderRadius: 12,
                  alignItems: 'center',
                  shadowColor: '#000',
                  shadowOffset: {width: 0, height: 4},
                  shadowOpacity: 0.2,
                  shadowRadius: 8,
                  elevation: 4,
                  opacity: loading ? 0.7 : 1,
                }}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}>
                {loading ? (
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <ActivityIndicator size="small" color="#FFFFFF" />
                    <ThemedText
                      size="base"
                      weight="semibold"
                      style={{marginLeft: 8, color: '#FFFFFF'}}>
                      Signing In...
                    </ThemedText>
                  </View>
                ) : (
                  <ThemedText
                    size="base"
                    weight="semibold"
                    style={{color: '#FFFFFF'}}>
                    Sign In
                  </ThemedText>
                )}
              </TouchableOpacity>

              {/* Sign Up Link */}
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 32,
                }}>
                <ThemedText size="sm" variant="tertiary">
                  Don't have an account?
                </ThemedText>
                <TouchableOpacity style={{marginLeft: 4}}>
                  <ThemedText
                    size="sm"
                    weight="semibold"
                    style={{color: RentAppColors.primary[600]}}>
                    Sign Up
                  </ThemedText>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default LoginScreen;
