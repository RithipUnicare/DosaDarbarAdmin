/* eslint-disable @typescript-eslint/no-unused-vars */
/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import AppNav from './AppNav'; // Import AppNav for navigation
import React from 'react';
import { Provider } from 'react-redux';
import { store } from './redux/store';

const App: React.FC = () => {
  return (
    <Provider store={store}>
      <AppNav />
    </Provider>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
