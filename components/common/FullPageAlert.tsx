import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import config from '@config/config.js';

const FullPageAlert = ({type, title, message, onClose}) => {
  return (
    <View style={styles.container}>
      <Icon name={type === 'success' ? 'check' : 'close'} size={140} color="#fff" style={styles.icon} />
      <Text style={styles.shortDesc}>{title ?? 'COMPLETED!'}</Text>
      <Text style={styles.title}>{message}</Text>
      <TouchableOpacity onPress={onClose} style={styles.confirmButton}>
        <Text style={styles.confirmButtonText}>Okay</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  shortDesc: {
    marginBottom: 25,
    fontSize: 40,
    textAlign: 'center',
    color: 'white',
    zIndex: 10,
    fontWeight: 'bold',
  },
  icon: {
    marginBottom: 15,
  },
  confirmButton: {
    display: 'flex',
    alignItems: 'center',
    borderRadius: 500,
    borderWidth: 1,
    borderColor: '#fff',
    padding: 15,
    width: 200,
    textAlign: 'center',
    marginTop: 34,
  },
  confirmButtonText: {
    color: config.colorSchemeConstrast,
    fontSize: 20,
  },
  title: {
    fontSize: 30,
    textAlign: 'center',
    color: config.colorSchemeContrast,
    zIndex: 10,
  },
  container: {
    paddingLeft: 30,
    paddingRight: 30,
    flex: 1,
    backgroundColor: config.colorScheme,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    width: '100%',
    height: '100%',
    zIndex: 10000,
  },
});

export default FullPageAlert;
