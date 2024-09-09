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
  setAvailableSectionSearch,
  setAvailableSectionData,
} from '@redux/actions/availableSectionsActions.tsx';
import {useSelector, useDispatch} from 'react-redux';
import NoRecordFound from '@components/common/NoRecordFound.tsx';
import {setSurveyQuestions} from '@redux/actions/surveyQuestionsActions.tsx';
import * as utils from '@utils/Utils';
import {setActiveTab} from '@redux/actions/dashboardActions.tsx';

const IconForCompleted = ({item, index}) => {
  return (
    <View style={styles.absCompletedIcon}>
     
      <View style={{
        ...styles.completedIcon, 
        marginTop: -18
        }}>
        <Icon name={'check'} size={18} color="#fff" style={styles.icon} />
      </View>

    </View>
  );
};

const CompletedSectionsList = ({UI, setUI, navigation}) => {
  const {search, data} = useSelector(state => state.availableSection);
  const dispatch = useDispatch();
  const [refreshing, setRefreshing] = useState(false);
  const [sectionKeysTotal, setSectionKeysTotal] = useState({});
  const {t} = useTranslation();

  const viewActionMenu = item => {
    setUI({
      ...UI,
      menu: true,
      menuTitle: 'Action',
      menuActions: [
        {
          title: 'View Memorials',
          onPress: async () => {
              await storage.set('currentSectionId', item['originalSectionId'].toString());
              dispatch(setActiveTab('completedmemorials'));
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
              total: statusesKeysTotal[statuses[i]['section']]['total'] + 1,
              incomplete: statusesKeysTotal[statuses[i]['section']]['incomplete'],
            }
    
            if (statuses[i]['statusName'].toString().toLowerCase() !== 'booked') {
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
     (LOWER(status) = ? OR LOWER(status) = 'booked') AND 
        (
          name like ?
        )`;

      searchValue = ['complete pass'];
      searchValue.push('%' + search + '%');
    } else {
      searchWhere = `(LOWER(status) = ? OR LOWER(status) = 'booked')`;
      searchValue = ['complete pass'];
    }

    const results = await database.getRecords('Sections', searchWhere, searchValue, `
      GROUP BY name
    `);

    console.log(results);

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
    const elseCondition = (Object.keys(sectionKeysTotal).length === 0 ? '' : 'Calculating...');

    return sectionKeysTotal[item.name]?.incomplete ? 
      ((sectionKeysTotal[item.name]?.incomplete ?? "") + ' out of ' + (sectionKeysTotal[item.name]?.total ?? "") + " tested") 
        : 
      elseCondition;
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

export default CompletedSectionsList;
