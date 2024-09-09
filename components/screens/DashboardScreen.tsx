import React, {useEffect, useState} from 'react';
import {
  View,
  ImageBackground,
  ScrollView,
  TouchableOpacity,
  BackHandler,
  Dimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/AntDesign';
import {useSelector, useDispatch} from 'react-redux';
import {setLatitudeLongitude} from '@redux/actions/geoLocationActions.tsx';
import styles from '@assets/styles/Styles';
import config from '@config/config.js';
import {useTranslation} from 'react-i18next';
import BottomNavigationBar from '@components/common/BottomNavigationBar';
import TopNavigationBar from '@components/common/TopNavigationBar';
import BookedJobsList from '@components/BookedJobsList';
import CompletedJobsList from '@components/CompletedJobsList';
import AvailableJobsList from '@components/AvailableJobsList';
import AvailableSectionsList from '@components/AvailableSectionsList';
import CompletedSectionsList from '@components/CompletedSectionsList';
import BookedSectionsList from '@components/BookedSectionsList';
import SyncOnlineData from '@components/SyncOnlineData';
import * as database from '@utils/AppSqliteDb';
import * as storage from '@utils/AppStorage';
import * as syncService from '@services/SyncService';
import RNFS from 'react-native-fs';
import DropdownAlert, {DropdownAlertData, DropdownAlertType} from 'react-native-dropdownalert';
import Geolocation from '@react-native-community/geolocation';

const uploadFile: boolean = async (uri, filename) => {
    // try {
      //const fileContent = await RNFS.readFile(uri, 'base64');
      const baseUrl = await storage.get('baseUrl');
      
      const uploadEndpoint = baseUrl + '/sync/receive-file';

      const formData = new FormData();

      formData.append('file', {
        uri: uri,
        type: 'image/jpeg', 
        name: filename
      });

      formData.append('originalFileName', filename);

      const response = await fetch(uploadEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      console.log(response);

      if (response.ok) {
        return true;
      } else {
       return false;
      }
    // } catch (error) {
    //  console.log("error in file upload " + error);
    //  return false;
    // }
};

const DashboardScreen = ({navigation, UI, setUI}) => {
  let alert = (_data: DropdownAlertData) => new Promise<DropdownAlertData>(res => res);
  const {tab} = useSelector(state => state.dashboard);
  const dispatch = useDispatch();
  const {latlong} = useSelector(state => state.geoLocation);

  const [processing, setProcessing] = useState(false);
  const {t} = useTranslation();

  useEffect( () => {
    setUI({
      ...UI,
      loading: false
    })
  }, [tab]);

  const handleTitles = () => {
      switch(tab) {
        case 'bookedjobs':
          return t('Scheduled Memorials');
        case 'availablejobs':
          return t('Available Memorials');
        case 'availablememorials':
          return t('Available Memorials');
        case 'bookedmemorials':
          return t('Scheduled Memorials');
        case 'completedjobs':
          return t('Completed Memorials');
        case 'completedmemorials':
          return t('Completed Memorials');
        case 'sync':
          return t('Sync');
        default:
          return '';
      }
  };

  const processSyncRecords = async () => {
    if (processing) {
      setTimeout( () => {
        processSyncRecords();
      }, 3000);

      return;
    }

    setProcessing(true);
    const results = await database.getRecords(
      'Sync',
      'Status = ? LIMIT 50'
    , ['APPROVED']
    );

    console.log("sync length is " + results.length);
    try {
        if(results.length !== 0) {
          const response = await syncService.postSyncData(results);

          if (response.status) {
            for(const i in results) {
              const obj = results[i];
              await database.remove('Sync', 'id = ?', [obj['Id']]);
            }
          }
        }

        const fileSync = await database.getRecords('FileSync', 
        'Status = ? LIMIT 5', ['APPROVED']);

        console.log('file sync count is ' + fileSync.length);

        if (fileSync.length !== 0) {
          for(const i in fileSync) {
            const obj = fileSync[i];
            console.log(obj.Path);

            const parts = obj.Path.split('/');

            const response = await uploadFile(obj.Path, parts[parts.length - 1]);
            
            if (response) {
              await database.remove('FileSync', 'id = ?', [obj.Id]);
            };

          }
        }
    } catch (error) {
      console.log(error);
    }
  
    setTimeout( () => {
      setProcessing(false);
      processSyncRecords();
    }, 10000);
  };

  useEffect( () => {
    setTimeout ( () => {
      processSyncRecords();
    }, 3000);
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      return true;
    });

    return () => backHandler.remove();
  }, []);

  useEffect( () => {
    const getCurrentLocation = () => {
      Geolocation.getCurrentPosition(info => {

        if (info.coords.longitude === 0 || info.coords.latitude === 0) {
            return;
        }

        dispatch(setLatitudeLongitude({...latlong, 
          longitude: info.coords.longitude,
          latitude: info.coords.latitude
        }));

      }, 
      error => {

      }, {
        enableHighAccuracy: true,
        accuracy: {
          android: 'high',
          ios: 'bestForNavigation',
        },
        timeout: 15000,
        maximumAge: 10000,
        distanceFilter: 10,
      });

      setTimeout( () => getCurrentLocation(), 3000);
    };

    getCurrentLocation();
  }, []);

  return (
    <ImageBackground
      source={require('@assets/images/background.jpeg')}
      style={styles.backgroundImage}>

      <DropdownAlert
        style={styles.dropdownAlert}
        alert={func => (alert = func)}
      />

      <TopNavigationBar title={(handleTitles())} />
      <View style={{
        flex: 1
      }}>
        <View style={styles.container} nestedScrollEnabled={true}>
    
            { tab === 'bookedjobs' ? 
            <BookedSectionsList 
                navigation={navigation} 
                alert={alert}
                UI={UI} 
                setUI={setUI} 
                /> : null }

            { tab === 'completedjobs' ? 
            <CompletedSectionsList 
                navigation={navigation} 
                UI={UI}
                alert={alert}
                setUI={setUI} 
                /> : null }
            { tab === 'completedmemorials' ? 
            <CompletedJobsList 
                navigation={navigation} 
                UI={UI}
                alert={alert}
                setUI={setUI} 
                /> : null }
            { tab === 'availablejobs' ? 
            <AvailableSectionsList 
                navigation={navigation}
                alert={alert}
                UI={UI} 
                setUI={setUI} 
                /> : null }
            { tab === 'availablememorials' ? 
            <AvailableJobsList 
                navigation={navigation}
                alert={alert}
                UI={UI} 
                setUI={setUI} 
                /> : null }
            { tab === 'bookedmemorials' ? 
            <BookedJobsList 
                navigation={navigation}
                alert={alert}
                UI={UI} 
                setUI={setUI} 
                /> : null }
            { tab === 'sync' ? 
                <SyncOnlineData
                  alert={alert}
                  navigation={navigation} 
                  UI={UI} 
                  setUI={setUI} 
                /> : null }
        </View>
      </View>
      <BottomNavigationBar UI={UI} setUI={setUI} />
    </ImageBackground>
  );
};

export default DashboardScreen;
