import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  PermissionsAndroid
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/AntDesign';
import * as database from '@utils/AppSqliteDb.tsx';
import * as storage from '@utils/AppStorage.tsx';
import globalStyles from '@assets/styles/Styles.tsx';
import {
  setBookedJobData
} from '@redux/actions/bookedJobsActions.tsx';

import {
  setLatitude,
  setLongitude
} from '@redux/actions/surveyQuestionsActions.tsx';
import {useSelector, useDispatch} from 'react-redux';
import NoRecordFound from '@components/common/NoRecordFound.tsx';
import moment from 'moment';
import SurveyQuestionItem from '@components/SurveyQuestionItem.tsx';
import Geolocation from '@react-native-community/geolocation';


const SurveyQuestions = ({navigation, UI, setUI}) => {
  const {search, data} = useSelector(state => state.bookedJob);
  const {questions} = useSelector(state => state.surveyQuestion);
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [pageTitle, setPageTitle] = useState('');
  const {t} = useTranslation();

  useEffect(() => {
    const requestLocationPermission = async () => {
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
            {
              title: 'Location Permission',
              message: 'This app needs access to your location.',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );

          if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            getLocation();
          } else {
            console.log('Location permission denied');
          }
        } else if (Platform.OS === 'ios') {
          Geolocation.requestAuthorization();
          getLocation();
        }
      } catch (error) {
        console.log('Error requesting location permission:', error);
      }
    };

    const getLocation = () => {
      Geolocation.getCurrentPosition(
        position => {
          const { lat, long } = position.coords;
          dispatch(setLatitude(lat));
          dispatch(setLongitude(long));
        },
        error => console.log('Error getting location:', error),
        { enableHighAccuracy: true, timeout: 20000, maximumAge: 1000 }
      );
    };

    requestLocationPermission();
  }, []);

  const fetchData = async () => {
    let searchWhere = '';
    let searchValue = [];

    if (search !== '') {
      searchWhere = `
      statusName = ? AND 
        (
          graveNumber like ? OR
          section like ? OR
          cemeteryName like ? OR
          categoryName like ?
        )`;

      searchValue = ['Booked'];
      searchValue.push('%' + search + '%');
      searchValue.push('%' + search + '%');
      searchValue.push('%' + search + '%');
      searchValue.push('%' + search + '%');
    } else {
      searchWhere = 'statusName = ?';
      searchValue = ['Booked'];
    }

    const results = await database.getRecords('Jobs', searchWhere, searchValue);

    const graveNumber = await storage.get('graveNumber');

    setPageTitle(graveNumber);

    dispatch(setBookedJobData(results));
    setRefreshing(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      fetchData();
    }, 1000);
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <View style={styles.container}>
      
      <View style={globalStyles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={globalStyles.btnHeader}>
          <Icon
            name={'arrowleft'}
            size={25}
            color="#fff"
            style={{
              ...styles.icon,
              marginRight: 10,
            }}
          />
          <Text style={globalStyles.topHeaderTitle}>{pageTitle}</Text>
        </TouchableOpacity>
      </View>

      {data.length === 0 ? <NoRecordFound title={'No Record Found'} /> : null}

      <FlatList
        style={{
          padding: 20,
        }}
        nestedScrollEnabled={true}
        scrollEnabled={true}
        data={questions}
        keyExtractor={item => item.id.toString()}
        renderItem={({item, index}) => (
          <SurveyQuestionItem setUI={setUI} UI={UI} item={item} index={index} />
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  attachText: {
    marginRight: 10,
    color: '#000',
  },
  attachment: {
    display: 'flex',
    alignItems: 'center',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  questionNumber: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 10,
  },
  itemTitle: {
    color: '#000',
    fontWeight: 'normal',
    fontSize: 18,
  },
  itemCategory: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    color: '#000',
    width: '100%',
    backgroundColor: '#fff',
    marginTop: 20,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#dadada',
    height: 40,
  },
  comments: {
    fontSize: 14,
    color: '#000',
    width: '100%',
    backgroundColor: '#fff',
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: '#dadada',
    height: 60,
  },
  container: {
    flex: 1,
    width: '100%',
    paddingBottom: 20,
  },
  itemCategoryText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#000',
  },
  item: {
    backgroundColor: '#e0e0e0',
    display: 'flex',
    justifyContent: 'center',
    paddingLeft: 30,
    paddingRight: 30,
    paddingBottom: 30,
    paddingTop: 10,
    marginBottom: 20,
    width: '100%',
    borderRadius: 20,
    minHeight: 80,
  },
});

export default SurveyQuestions;
