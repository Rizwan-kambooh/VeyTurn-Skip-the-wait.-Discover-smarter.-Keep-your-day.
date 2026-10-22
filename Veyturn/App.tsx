import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AppNavigator} from './src/navigation/AppNavigator';
import {AuthProvider} from './src/auth/AuthContext';
import {ToastProvider} from './src/components/Toast';
import {BusinessProvider} from './src/business/BusinessContext';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <AuthProvider>
        <BusinessProvider>
          <ToastProvider>
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          </ToastProvider>
        </BusinessProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

export default App;
