import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import config from '@config/config.js';
import {useTranslation} from 'react-i18next';

const NoRecordFound = ({title}) => {
    const {t} = useTranslation();

  return (
    <View style={styles.container}>
        <Text style={styles.pageTitle}>{title}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
    pageTitle: {
        fontSize: 12,
        color: '#000',
        width: '100%',
        paddingLeft: 30,
  
    },
    iconBooked: {
        position: 'absolute',
        right: 30,
        top: 20,
    },
    iconAvailable: {
        position: 'absolute',
        right: 20,
        top: 25,
    },
    btnIcon: {
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        width: 100,
        height: 80,
    },
    iconText: {
        marginTop: 5,
        fontSize: 11,
        fontWeight: 'bold'
    },
  icon: {
   
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    height: 40,
    width: '100%',
    borderRadius: 10,
    backgroundColor: '#dadada'
  },
});

export default NoRecordFound;
