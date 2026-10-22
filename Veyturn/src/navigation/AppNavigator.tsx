import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {RootStackParamList} from './types';
import {SplashScreen} from '../screens/SplashScreen';
import {WelcomeScreen} from '../screens/WelcomeScreen';
import {LoginScreen} from '../screens/LoginScreen';
import {SignupScreen} from '../screens/SignupScreen';
import {ForgotPasswordScreen} from '../screens/ForgotPasswordScreen';
import {VerifyCodeScreen} from '../screens/VerifyCodeScreen';
import {ResetPasswordScreen} from '../screens/ResetPasswordScreen';
import {CustomerNavigator} from './CustomerNavigator';
import {BusinessDetailsScreen, LiveQueueScreen, QueueJoinedScreen} from '../screens/QueueFlowScreens';
import {EditProfileScreen, HistoryScreen, PreferencesScreen, SavedBusinessesScreen} from '../screens/ProfileExtraScreens';
import {BusinessSetupScreen, RegisterBusinessScreen} from '../screens/BusinessRegistrationScreens';
import {BusinessNavigator} from './BusinessNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();
export function AppNavigator() {
  return <Stack.Navigator initialRouteName="Splash" screenOptions={{headerShown: false}}>
    <Stack.Screen name="Splash" component={SplashScreen} /><Stack.Screen name="Welcome" component={WelcomeScreen} />
    <Stack.Screen name="Login" component={LoginScreen} /><Stack.Screen name="Signup" component={SignupScreen} />
    <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    <Stack.Screen name="VerifyCode" component={VerifyCodeScreen} />
    <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
    <Stack.Screen name="Home" component={CustomerNavigator} options={{gestureEnabled: false}} />
    <Stack.Screen name="BusinessDetails" component={BusinessDetailsScreen} />
    <Stack.Screen name="QueueJoined" component={QueueJoinedScreen} options={{gestureEnabled: false}} />
    <Stack.Screen name="LiveQueue" component={LiveQueueScreen} />
    <Stack.Screen name="EditProfile" component={EditProfileScreen} />
    <Stack.Screen name="History" component={HistoryScreen} />
    <Stack.Screen name="SavedBusinesses" component={SavedBusinessesScreen} />
    <Stack.Screen name="Preferences" component={PreferencesScreen} />
    <Stack.Screen name="RegisterBusiness" component={RegisterBusinessScreen} />
    <Stack.Screen name="BusinessSetup" component={BusinessSetupScreen} />
    <Stack.Screen name="BusinessApp" component={BusinessNavigator} options={{gestureEnabled: false}} />
  </Stack.Navigator>;
}
