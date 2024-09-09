import React, {useState, useEffect, useRef} from 'react';
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
  setAvailableSectionSearch,
  setAvailableSectionData,
} from '@redux/actions/availableSectionsActions.tsx';
import {useSelector, useDispatch} from 'react-redux';
import NoRecordFound from '@components/common/NoRecordFound.tsx';
import {setSurveyQuestions} from '@redux/actions/surveyQuestionsActions.tsx';
import * as utils from '@utils/Utils';
// import DropdownAlert, {DropdownAlertData, DropdownAlertType} from 'react-native-dropdownalert';
import {setActiveTab} from '@redux/actions/dashboardActions.tsx';

const AvailableSectionsList = ({UI, setUI, navigation}) => {
  const {search, data} = useSelector(state => state.availableSection);
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const {t} = useTranslation();

  const updateBookJob = async item => {

    await database.update('Sections', {
      status: 'Booked',
    }, 'originalSectionId = ?', item.originalSectionId);
    
    await database.update(
      'Jobs',
      {
        statusName: 'Booked',
      },
      'sectionId = ?',
      item.originalSectionId,
    );

    await database.insert('Sync', {
      key: 'booked-jobs',
      Payload: `
        UPDATE memorials SET status_id = (
          SELECT id FROM statuses WHERE 
          LCASE(status) = 'booked' LIMIT 1
        )
        WHERE section_id = '${item.originalSectionId}' AND status_id IN (SELECT id FROM statuses WHERE LCASE(status) = 'unbooked')
      `,
      Status: 'APPROVED',
      CreatedAt: utils.getMysqlDateTime(),
      UpdatedAt: utils.getMysqlDateTime(),
    });

    await database.insert('Sync', {
      key: 'booked-jobs',
      Payload: `
        INSERT INTO bookings SET 
          booking_date = '${utils.getMysqlDateTime()}',
          section_id = '${item.originalSectionId}',
          notes = 'Mobile App Booking',
          created_at = '${utils.getMysqlDateTime()}',
          updated_at = '${utils.getMysqlDateTime()}'
      `,
      Status: 'APPROVED',
      CreatedAt: utils.getMysqlDateTime(),
      UpdatedAt: utils.getMysqlDateTime(),
    });

    await setUI({
      ...UI,
      alert: true,
      alertType: 'success',
      alertTitle: 'Book Job',
      alertMessage: t('You have successfully booked a memorial!'),
    });

    await fetchData();
  };

  const viewActionMenu = item => {
    setUI({
      ...UI,
      menu: true,
      menuTitle: 'Action',
      menuActions: [
        {
          title: 'Book Job',
          onPress: async () => {
            await updateBookJob(item);
          },
        },
        {
          title: 'View Memorials',
          onPress: async () => {
              await storage.set('currentSectionId', item['originalSectionId'].toString());
              dispatch(setActiveTab('availablememorials'));
          },
        },
      ],
    });
  };

  const fetchData = async () => {
    let searchWhere = '';
    let searchValue = [];

    if (search !== '') {
      searchWhere = `
      LOWER(status) = ? AND 
        (
          name like ?
        )`;

      searchValue = ['unbooked'];
      searchValue.push('%' + search + '%');
    } else {
      searchWhere = 'LOWER(status) = ?';
      searchValue = ['unbooked'];
    }

    const results = await database.getRecords('Sections', searchWhere, searchValue, `
      GROUP BY name
    `);

    console.log(results);

    dispatch(setAvailableSectionData(results));
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
          onChangeText={text => dispatch(setAvailableSectionSearch(text))}
          value={search}
        />
      </View>

      {data.length === 0 ? <NoRecordFound title={'No Record Found'} /> : null}

      <FlatList
        nestedScrollEnabled={true}
        scrollEnabled={false}
        data={data}
        keyExtractor={item => item.id.toString()}
        renderItem={({item, index}) => (
          <TouchableOpacity
            onPress={() => viewActionMenu(item)}
            style={{
              ...styles.item,
              backgroundColor: index % 2 === 0 ? '#e5e5e5' : '#fefefe',
            }}>
            <Text style={styles.itemTitle}>{item.name}</Text>
      
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

export default AvailableSectionsList;
