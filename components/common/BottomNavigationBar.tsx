import React from 'react';
import {useSelector, useDispatch} from 'react-redux';

import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import config from '@config/config.js';
import {useTranslation} from 'react-i18next';
import {setActiveTab} from '@redux/actions/dashboardActions.tsx';
import { useNavigation } from '@react-navigation/native';
import * as storage from '@utils/AppStorage.tsx';

const BottomNavigationBar = ({UI, setUI}) => {

  const {tab} = useSelector(state => state.dashboard);

  const dispatch = useDispatch();

  const {t} = useTranslation();
  const navigation = useNavigation();

  return (
    <View style={styles.container}>

    <TouchableOpacity style={{
        ...styles.btnIcon,
        backgroundColor: (tab === 'completedjobs' || tab === 'completedmemorials' ? '#922820' : config.colorScheme)
        }} onPress={() => {
        if (tab === 'completedjobs') return;

        setUI({...UI, loading: true});
        dispatch(setActiveTab('completedjobs'))
      }}>
        <Icon name={'check'} size={18} color="#fff" style={styles.icon} />
        
        {/* <Icon
          name={'check'}
          size={25}
          color="#74EE15"
          style={styles.iconBooked}
        /> */}
        <Text style={styles.iconText}>{t('Completed')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={{
        ...styles.btnIcon,
        backgroundColor: (tab === 'bookedjobs' || tab === 'bookedmemorials' ? '#922820' : config.colorScheme)
        }} onPress={() => {
        if (tab === 'bookedjobs') return;

        setUI({...UI, loading: true});
        dispatch(setActiveTab('bookedjobs'))
      }}>
        <Icon name={'calendar'} size={18} color="#fff" style={styles.icon} />
        
        <Icon
          name={'check'}
          size={25}
          color="#74EE15"
          style={styles.iconBooked}
        />
        <Text style={styles.iconText}>{t('Scheduled')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={{
        ...styles.btnIcon,
        backgroundColor: (tab === 'availablejobs' || tab === 'availablememorials' ? '#922820' : config.colorScheme)
        }} onPress={() => {
          if (tab === 'availablejobs') return;
        setUI({...UI, loading: true});
        dispatch(setActiveTab('availablejobs'))
      }}>
        <Icon name={'calendar'} size={18} color="#fff" style={styles.icon} />
        <Icon
          name={'user'}
          size={14}
          color="yellow"
          style={styles.iconAvailable}
        />
        <Text style={styles.iconText}>{t('Available')}</Text>
      </TouchableOpacity>

      <TouchableOpacity style={{
        ...styles.btnIcon,
        backgroundColor: (tab === 'sync' ? '#922820' : config.colorScheme)
        }} onPress={() => {
        if (tab === 'sync') return;
        setUI({...UI, loading: true});
        dispatch(setActiveTab('sync'))
      }}>
        <Icon name={'sync'} size={18} color="#fff" style={styles.icon} />

        <Text style={styles.iconText}>{t('Sync')}</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => {
        setUI({
          ...UI,
          confirm: true,
          confirmType: 'logout',
          confirmMessage: t('Are you sure you want to log out the app?'),
          confirmOnOkay: async () => {
            await storage.remove('accessToken');
            await storage.remove('user');
            await storage.remove('inspector');

            navigation.navigate('Login');
          },
          confirmOnCancel: () => {

          }
        })
      }} style={styles.btnIcon}>
        <Icon name={'logout'} size={18} color="#fff" style={styles.icon} />
        <Text style={styles.iconText}>{t('Sign Out')}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  iconBooked: {
    position: 'absolute',
    right: 18,
    top: 20,
  },
  iconAvailable: {
    position: 'absolute',
    right: 18,
    top: 20,
  },
  btnIcon: {
    position: 'relative',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'column',
    width: 80,
    height: 80,
  },
  iconText: {
    marginTop: 5,
    fontSize: 8,
    fontWeight: 'bold',
  },
  icon: {},
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    flexWrap: 'wrap',
    height: 80,
    width: '100%',
    backgroundColor: config.colorScheme,
    overflowX: 'scroll'
  },
});

export default BottomNavigationBar;
