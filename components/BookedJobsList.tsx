import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/AntDesign';
import * as database from '@utils/AppSqliteDb.tsx';
import * as storage from '@utils/AppStorage.tsx';
import globalStyles from '@assets/styles/Styles.tsx';
import {
  setBookedJobSearch,
  setBookedJobData,
} from '@redux/actions/bookedJobsActions.tsx';
import {useSelector, useDispatch} from 'react-redux';
import NoRecordFound from '@components/common/NoRecordFound.tsx';
import {setSurveyQuestions} from '@redux/actions/surveyQuestionsActions.tsx';
import { useFocusEffect } from '@react-navigation/native'; 
import {setActiveTab} from '@redux/actions/dashboardActions.tsx';

const IconForCompleted = ({item, index}) => {
  return (
    <View style={styles.absCompletedIcon}>
      { item.statusName === 'COMPLETED' || item.statusName.toLowerCase() === 'complete pass' ?
      <View style={styles.completedIcon}>
        <Icon name={'check'} size={18} color="#fff" style={styles.icon} />
      </View>
      : null }
    </View>
  );
};

const BookedJobsList = ({UI, setUI, navigation}) => {
  const {search, data} = useSelector(state => state.bookedJob);
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);
  const {t} = useTranslation();

  const setStorageItems = async (item, index) => {
    dispatch(setSurveyQuestions(JSON.parse(item.questions)));
    await storage.set('memorialId', item.memorialId.toString());
    await storage.set('graveNumber', item.graveNumber.toString());
    await storage.set('jobDetails', JSON.stringify(item));
    await storage.set('memorialIndex', index.toString());
    await storage.set('hasUpdate', '1');
  };

  const viewActionMenu = async (item, index) => {

    const sectionId = await storage.get('currentSectionId');

    const key = 'section-memorial-' + sectionId + '-' + item.memorialId;

    const result = await database.getRecords('AppCache', 'Name = ?', [key]);

    if (result.length > 0) {
      //return;
    }

      setUI({
        ...UI,
        menu: true,
        menuTitle: 'Action',
        menuActions: [
          {title: 'Test', onPress: async () => {
            await setStorageItems(item, index);

            navigation.navigate('MemorialDetails');
          }},
          {title: 'Test Summary', onPress: async () => {
            await setStorageItems(item, index);

            navigation.navigate('SurveySummary');
          }},
          {title: 'Memorial Details', onPress: async () => {
            await setStorageItems(item, index);

            navigation.navigate('JobDetails');
          }}
        ]
      });
  };

  const fetchData = async () => {
    const sectionId = await storage.get('currentSectionId');
    let searchWhere = '';
    let searchValue = [];

    if (search !== '') {
      searchWhere = `
      (LOWER(statusName) = ?) AND 
        (
          graveNumber like ? OR
          section like ? OR
          cemeteryName like ? OR
          categoryName like ?
        ) AND sectionId = ?`;

      searchValue = ['booked'];
      searchValue.push('%' + search + '%');
      searchValue.push('%' + search + '%');
      searchValue.push('%' + search + '%');
      searchValue.push('%' + search + '%');
      searchValue.push(sectionId);
    } else {
      searchWhere = '(LOWER(statusName) = ?) AND sectionId = ?';
      searchValue = ['booked'];
      searchValue.push(sectionId);
    }

    await storage.set('currentSectionId', ''+sectionId);

    let results = await database.getRecords('Jobs', searchWhere, searchValue, 'ORDER BY id ASC LIMIT ' + (page * 20) + ', 20');

    // console.log(results);

    if (page === 0) {
      dispatch(setBookedJobData(results));
    } else {
      console.log('firing here');
      if (results.length > 0) {
        const newData = [...data, ...results];

        dispatch(setBookedJobData(newData));
      }
     
    }
    
    setRefreshing(false);
  };
  
  
  const loadMoreRecords = async () => {
    console.log('firing');
    setRefreshing(true);
    setPage(page => page + 1);
  };

  useEffect( () => {
    fetchData();
  }, [page]);

  useEffect( () => {
    fetchData();
  }, [UI.refresh]);

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

  const handleUpdates = async() => {
    const hasUpdate = await storage.get('hasUpdate');

    if (hasUpdate === '1') {
      await storage.remove('hasUpdate');
      
      setTimeout ( () => {
        fetchData();
      }, 3000);
    }
  };

  useFocusEffect(() => {
    handleUpdates();
  });

  return (
    <View onFocus={handleUpdates} style={styles.container} nestedScrollEnabled={true}>
      <View>
        <Icon
          name={'search1'}
          size={25}
          color="#000"
          style={globalStyles.searchIcon}
        />
        <TextInput
          style={globalStyles.searchInput}
          placeholderTextColor="#3e3e3e"
          placeholder={t('Search...')}
          onChangeText={text => dispatch(setBookedJobSearch(text))}
          value={search}
        />
      </View>

      <TouchableOpacity onPress={ async () => {
          dispatch(setActiveTab('bookedjobs'));
      }} style={globalStyles.backTopButton}>
          <Text style={globalStyles.backTopButtonText}>{'< ' + t('Back to Sections')}</Text>
      </TouchableOpacity>

      {data.length === 0 ? <NoRecordFound title={'No Record Found'} /> : null}

      <FlatList
        nestedScrollEnabled={true}
        scrollEnabled={true}
        onEndReached={loadMoreRecords}
        onEndReachedThreshold={0.7}
        data={data}
        keyExtractor={item => item.id.toString()}
        renderItem={({item, index}) => (
          <TouchableOpacity onPress={async () => await viewActionMenu(item, index) }
            style={{
              ...styles.item,
              backgroundColor: index % 2 === 0 ? '#e5e5e5' : '#fefefe',
            }}>
            <Text style={styles.itemTitle}>{item.familyName + ' - ' + item.graveNumber}</Text>
            <Text style={styles.itemCategory}>
              {
                item.section + ' ◉ ' +
                item.cemeteryName
              }
            </Text>

            <IconForCompleted item={item} index={index} />
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  completedIcon: {
    position: 'absolute',
    right: 20,
    borderRadius: 50,
    borderColor: 'green',
    borderWidth: 1,
    padding: 5,
    backgroundColor: 'green'
  },
  absCompletedIcon: {
    position: 'absolute',
    right: 0,
    top: 25
  },
  itemTitle: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 20,
  },
  itemCategory: {
    fontSize: 14,
    color: '#000',
  },
  container: {
    flex: 1,
    width: '100%',
  },
  item: {
    backgroundColor: '#e0e0e0',
    display: 'flex',
    justifyContent: 'center',
    paddingLeft: 30,
    marginBottom: 10,
    width: '100%',
    borderRadius: 20,
    minHeight: 80,
  },
});

export default BookedJobsList;
