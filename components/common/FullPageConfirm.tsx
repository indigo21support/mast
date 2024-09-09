import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import config from '@config/config.js';

const FullPageConfirm = ({type, title, message, onOkay, onCancel}) => {
  return (
    <View style={styles.container}>
      <Icon name={type !== '' ? type : 'question'} size={140} color="#fff" style={styles.icon} />
      <Text style={styles.shortDesc}>{title ?? 'COMPLETED!'}</Text>
      <Text style={styles.title}>{message}</Text>

      <View style={styles.navigationContainer}>
       

        <TouchableOpacity onPress={onCancel} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
            
        </TouchableOpacity>

        <TouchableOpacity onPress={onOkay} style={styles.confirmButton}>
            <Text style={styles.confirmButtonText}>Okay</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
    navigationContainer: {
        display: 'flex',
        flexDirection: 'row',
        paddingLeft: 30,
        paddingRight: 30,
    },
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
    backgroundColor: '#fff',
    borderColor: '#fff',
    padding: 15,
    width: '50%',
    textAlign: 'center',
    marginTop: 34,
    marginLeft: 10,
    marginRight: 10
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 20,
  },

  cancelButton: {
    display: 'flex',
    alignItems: 'center',
    borderRadius: 500,
    borderWidth: 1,
    borderColor: '#fff',
    padding: 15,
    width: '50%',
    textAlign: 'center',
    marginTop: 34,
    marginLeft: 10,
    marginRight: 10
  },
  cancelButtonText: {
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

export default FullPageConfirm;
