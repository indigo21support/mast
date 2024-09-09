import React from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import config from '@config/config.js';

const FullPageLoading = ({title}) => {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="180" color={ config.colorScheme } />
      <Text style={styles.loadingText}>{ title ?? 'Loading...' }</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 1000,
    opacity: 0.9
  },
  loadingText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: 'normal',
    color: config.colorScheme,
    width: '100%',
    height: 30,
    textAlign: 'center'
  },
});

export default FullPageLoading;