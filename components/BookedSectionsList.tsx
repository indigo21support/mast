import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  TextInput,
  Alert
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
import DropdownAlert, {DropdownAlertData, DropdownAlertType} from 'react-native-dropdownalert';
import {setActiveTab} from '@redux/actions/dashboardActions.tsx';

const IconForCompleted = ({item, index}) => {
  return (
    <View style={styles.absCompletedIcon}>
      { item.status === 'COMPLETED' ?
      <View style={{...styles.completedIcon, marginTop: -18 }}>
        <Icon name={'check'} size={18} color="#fff" style={styles.icon} />
      </View>
      : null }
    </View>
  );
};

const BookedSectionsList = ({UI, setUI, navigation}) => {
  let alert = (_data: DropdownAlertData) => new Promise<DropdownAlertData>(res => res);
  const {search, data} = useSelector(state => state.availableSection);
  const [sectionKeysTotal, setSectionKeysTotal] = useState({});
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const {t} = useTranslation();

  const updateEachMemorials = async (item) => {
    const memorialId = item.memorialId;

    await database.update(
      'Sync',
      {Status: 'APPROVED'},
      'Key like ?',
      '%memorialId-' + item.memorialId + '-%',
    );

    await database.update(
      'Sync',
      {Status: 'APPROVED'},
      'Key like ?',
      '%check-' + item.memorialId + '-%',
    );

    await database.update(
      'Sync',
      {Status: 'APPROVED'},
      'Key like ?',
      '%comment-' + item.memorialId + '-%',
    );

    await database.update(
      'Sync',
      {Status: 'APPROVED'},
      'Key like ?',
      '%completedMemorialId-%',
    );

    await database.update(
      'Jobs',
      {
        statusName: 'Complete Pass',
      },
      'memorialId = ?',
      memorialId,
    );

    let tmpStatus = 'complete pass';

    const checkRecord = await database.getRecords('CompletedMemorials', "memorialId = ? AND passFail = 'no memorial present'", [memorialId]);

    if (checkRecord !== undefined && checkRecord.length > 0) {
      tmpStatus = 'No Memorial Present';
    }

    await database.insert('Sync', {
      key: 'booked-jobs-' + memorialId,
      Payload: `
        UPDATE memorials SET status_id = (
          SELECT id FROM statuses WHERE 
          LCASE(status) = '${tmpStatus}' LIMIT 1
        )
        WHERE id = '${memorialId}'
      `,
      Status: 'APPROVED',
      CreatedAt: utils.getMysqlDateTime(),
      UpdatedAt: utils.getMysqlDateTime(),
    });

    await setUI({
      ...UI,
      alert: true,
      alertType: 'success',
      alertTitle: 'Complete Memorial',
      alertMessage: t('You have successfully completed a memorial. Thank you'),
    });

    setTimeout ( () => {
      fetchData();
    }, 1000);
  };


  const validateSectionSubmission = async (item) => {
    const bookedJobsTotal = await database.getRecords('Jobs', 'sectionId = ? AND (LOWER(statusName) = ? OR LOWER(statusName) = "completed")', [
      item.originalSectionId,
      'booked'
    ]);

    let completed = 0;

    for(const i in bookedJobsTotal) {
      const obj = bookedJobsTotal[i];

      if(obj.statusName === 'COMPLETED') {
        completed ++;
      }
    }

    if(bookedJobsTotal.length > completed) {
      Alert.alert('Submission Error: Incomplete Memorial Test Forms', 'Submission for completion failed. Please ensure that you have completed all the memorial test forms. Thank you.', [
        {text: 'OK', onPress: () => console.log('OK Pressed')},
      ]);
      return;
    }

    await setUI({
      ...UI,
      loading: true
    });

    for(const i in bookedJobsTotal) {
      const obj = bookedJobsTotal[i];

      updateEachMemorials(obj);
  
    }

    await database.update('Sections', {
      status: 'Complete Pass',
    }, 'originalSectionId = ?', item.originalSectionId);

    setUI({...UI, refresh: UI.refresh + 1});
  };

  const viewActionMenu = async (item) => {
    setUI({
      ...UI,
      menu: true,
      menuTitle: 'Action',
      menuActions: [
        {
          title: t('View Memorials'),
          onPress: async () => {
              await storage.set('currentSectionId', item['originalSectionId'].toString());
              dispatch(setActiveTab('bookedmemorials'));
          },
        },
        {
          title: t('Submit for Completion'),
          onPress: async () => {
              validateSectionSubmission(item);

          },
        },
      ],
    });
  };

  const populateStatuses = async () => {
    let statusesKeysTotal = {};

    const recursivePopulateStatus = async (counter) => {
        const pageResult = counter * 50;

        const statuses = await database.getRecords(
          'Jobs', 
          "LOWER(StatusName) IN ('completed', 'booked', 'complete pass', 'complete fail', 'no memorial present', 'unable to locate plot') ", 
          "", ` LIMIT ${pageResult}, 50`);

        for(const i in statuses) {

          if (!(statuses[i]['section'] in statusesKeysTotal)) {
            statusesKeysTotal[statuses[i]['section']] = {
              total: 1,
              incomplete: 0,
            }
          }

          if (statuses[i]['section'] in statusesKeysTotal) {
            statusesKeysTotal[statuses[i]['section']] = {
              total: statusesKeysTotal[statuses[i]['section']]['total'],
              incomplete: statusesKeysTotal[statuses[i]['section']]['incomplete'],
            }
    
            if (statuses[i]['statusName'].toString().toLowerCase() === 'booked') {
              statusesKeysTotal[statuses[i]['section']]['total'] += 1;
            }

            if ([
              'completed', 
              'complete pass', 
              'complete fail', 
              'no memorial present', 
              'unable to locate plot'
            ].indexOf(statuses[i]['statusName'].toString().toLowerCase()) !== -1) {
              statusesKeysTotal[statuses[i]['section']]['incomplete'] += 1;
            }
    
          }
        }
        
        if (statuses.length > 0) {
          counter ++;
          recursivePopulateStatus(counter);
        } else {
          setSectionKeysTotal(statusesKeysTotal);
        }
    }

    await recursivePopulateStatus(0);
   
  };

  const fetchData = async () => {
    let searchWhere = '';
    let searchValue = [];

    if (search !== '') {
      searchWhere = `
      (LOWER(status) = ? OR LOWER(status) = 'completed') AND 
        (
          name like ?
        )`;

      searchValue = ['booked'];
      searchValue.push('%' + search + '%');
    } else {
      searchWhere = "(LOWER(status) = ? OR LOWER(status) = 'completed')";
      searchValue = ['booked'];
    }

    const results = await database.getRecords('Sections', searchWhere, searchValue, `
      GROUP BY name
    `);

    dispatch(setAvailableSectionData(results));
    setRefreshing(false);
  };

  useEffect(() => {
    populateStatuses();
    fetchData();
  }, []);

  useEffect(() => {
    setTimeout(() => {
      populateStatuses();
      fetchData();
    }, 1000);
  }, [search]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const handleTextWordings = (item) => {
    const elseCondition = (Object.keys(sectionKeysTotal).length === 0 || sectionKeysTotal[item.name]?.incomplete === 0  ? '' : 'Calculating...');

    return sectionKeysTotal[item.name]?.incomplete ? ((sectionKeysTotal[item.name]?.incomplete ?? "") + ' tested, ' + (sectionKeysTotal[item.name]?.total ?? "") + ' Remaining') : elseCondition;
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
            onPress={async () => await viewActionMenu(item)}
            style={{
              ...styles.item,
              backgroundColor: index % 2 === 0 ? '#e5e5e5' : '#fefefe',
            }}>

            <View>
              <Text style={styles.itemTitle}>{item.name}</Text>
              <IconForCompleted item={item} index={index} />
            </View>

            <View>
                <Text style={styles.progressText}>{ handleTextWordings(item) }</Text>
            </View>
            
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
  progressText: {
    color: '#000',
  },
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
  itemDesc: {
    fontSize: 10
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

export default BookedSectionsList;
