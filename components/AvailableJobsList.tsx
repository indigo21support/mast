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
  setAvailableJobSearch,
  setAvailableJobData,
} from '@redux/actions/availableJobsActions.tsx';
import {useSelector, useDispatch} from 'react-redux';
import NoRecordFound from '@components/common/NoRecordFound.tsx';
import {setSurveyQuestions} from '@redux/actions/surveyQuestionsActions.tsx';
import * as utils from '@utils/Utils';
import {DropdownAlertData} from 'react-native-dropdownalert';
import {setActiveTab} from '@redux/actions/dashboardActions.tsx';

const AvailableJobsList = ({UI, setUI, navigation}) => {
  const {search, data} = useSelector(state => state.availableJob);
  const [page, setPage] = useState(0);
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const {t} = useTranslation();

  const viewActionMenu = item => {
  };

  const fetchData = async () => {
    let searchWhere = '';
    let searchValue = [];
    const sectionId = await storage.get('currentSectionId');

    if (search !== '') {
      searchWhere = `
      LOWER(statusName) = ? AND 
        (
          graveNumber like ? OR
          section like ? OR
          cemeteryName like ? OR
          categoryName like ?
        ) AND sectionId = ?`;

      searchValue = ['unbooked'];
      searchValue.push('%' + search + '%');
      searchValue.push('%' + search + '%');
      searchValue.push('%' + search + '%');
      searchValue.push('%' + search + '%');
      searchValue.push(sectionId);
    } else {
      searchWhere = 'LOWER(statusName) = ? AND sectionId = ?';
      searchValue = ['unbooked'];
      searchValue.push(sectionId);
    }

    searchWhere += " ORDER BY priorityId ASC ";

    const results = await database.getRecords('Jobs', searchWhere, searchValue, 'LIMIT ' + (page * 20) + ', 20');

    if (page === 0) {
      dispatch(setAvailableJobData(results));
    } else {
      console.log('firing here');
      if (results.length > 0) {
        const newData = [...data, ...results];

        dispatch(setAvailableJobData(newData));
      }
    }

    setRefreshing(false);
  };

  const loadMoreRecords = async () => {
    setRefreshing(true);
    setPage(page => page + 1);
  };

  useEffect( () => {
    fetchData();
  }, [page]);

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
    <View style={styles.container} nestedScrollEnabled={true}>
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
          onChangeText={text => dispatch(setAvailableJobSearch(text))}
          value={search}
        />
      </View>

      <TouchableOpacity onPress={ async () => {
          dispatch(setActiveTab('availablejobs'));
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
          <TouchableOpacity
            onPress={() => viewActionMenu(item)}
            style={{
              ...styles.item,
              backgroundColor: index % 2 === 0 ? '#e5e5e5' : '#fefefe',
            }}>
            <Text style={styles.itemTitle}>{item.familyName + ' - ' + item.graveNumber}</Text>
            <Text style={styles.itemCategory}>
              {
                item.cemeteryName +
                ' ◉ ' +
                item.section}
            </Text>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      />

      {/* <DropdownAlert
        style={styles.dropdownAlert}
        alert={func => (alert = func)}
      /> */}

    </View>
  );
};

const styles = StyleSheet.create({
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

export default AvailableJobsList;
