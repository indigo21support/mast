import React, {useState, useEffect} from 'react';
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
import config from '@config/config.js';
import * as syncService from '@services/SyncService.tsx';
import SyncDataDto from '@objects/dto/SyncDataDto.tsx';
import * as database from '@utils/AppSqliteDb.tsx';
import * as storage from '@utils/AppStorage.tsx';
import moment from 'moment';
import * as utils from '@utils/Utils';

const SyncOnlineData = ({UI, setUI}) => {
  const [data, setData] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSynched, setLastSynched] = useState('NO SYNCHRONIZATION');
  const [queuedTasks, setQueuedTasks] = useState(0);
  const [pendingFiles, setPendingFiles] = useState(0);
  const {t} = useTranslation();

  const clearAllSyncData = async () => {
    await database.remove('Sync', 'id <> ?', ['-1']);
    await database.remove('CompletedMemorials', 'id <> ?', ['-1']);
    await database.remove('Sections', 'id <> ?', ['-1']);
    await database.remove('CompletedMemorialPhotos', 'id <> ?', ['-1']);
    await database.remove('FileSync', 'id <> ?', ['-1']);
  };

  const processSyncData = async () => {

    if (queuedTasks !== 0) {

      Alert.alert('Sync', 'Synchronization failed. Please ensure that you sync all the local data to the server to download all the updates online. Make sure you have an empty queued sync count. Thank you.', [
        {text: 'OK', onPress: () => console.log('OK Pressed')},
      ]);
  
      return;
    }
    
    setUI({
      ...UI,
      loading: true,
      loadingTitle: 'Synching...',
    });

    const recursiveProcess = async counter => {
      const syncDataDto: SyncDataDto = {
        filterType: '',
        page: counter,
      };

      const result = await syncService.getSyncData(syncDataDto, counter);

      if (result.length > 0) {
        recursiveProcess(counter + 1);
      }
    };

    await recursiveProcess(0);

    await database.remove('Sections', ' id <> ?', ['-1']);

    const recursiveSectionInsert = async counter => {
      const sections = await database.getRecords(
        'Jobs',
        '',
        [],
        'ORDER BY section ASC LIMIT ' + (20 * counter) + ', 20',
      );
  
      for (const i in sections) {
        const section = sections[i];
        
        await database.insert('Sections', {
          name: section['section'],
          originalSectionId: section['sectionId'],
          sequence: i,
          createdAt: utils.getMysqlDateTime(),
          status: section['statusName'],
        });
      }

      if (sections.length > 0) {
        recursiveSectionInsert(counter + 1);
      }
    };

    await recursiveSectionInsert(0);

    const memorialHeights = await syncService.getMemorialHeights();

    await database.remove('MemorialHeights', 'id != ?', ['0']);

    for (const i in memorialHeights) {
      const memorialHeight = memorialHeights[i];

      await database.insert('MemorialHeights', {
        originalId: memorialHeight['id'],
        name: memorialHeight['name'],
        createdAt: utils.getMysqlDateTime(),
        status: '',
      });
    }

    await storage.set(
      'lastSyncedDateTime',
      moment().format('MMMM Do YYYY, h:mm:ss a'),
    );

    setTimeout(() => {
      setUI({
        ...UI,
        loading: false,
        loadingTitle: '',
      });
    }, 3000);
  };

  const fetchData = async () => {
    const exists = await storage.exists('lastSyncedDateTime');

    const queuedTasksRec = await database.getRecords(
      'Sync',
      'Status = ? AND Key like ?',
      ['PENDING', '%memorialId-%'],
    );

    const dataPendingFiles = await database.getRecords(
      'Sync',
      'Status = ? AND Key like ?',
      ['PENDING', '%completedMemorialId-%'],
    );

    setPendingFiles(dataPendingFiles.length);
    setQueuedTasks(queuedTasksRec.length);

    if (exists) {
      const lastSyncDt = await storage.get('lastSyncedDateTime');
      setLastSynched(lastSyncDt);
    }

    setTimeout(() => {
      fetchData();
    }, 5000);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  return (
    <View>
      <View style={styles.container}>
        <View style={styles.gridItem}>
          <Icon name={'hourglass'} size={40} color="#fff" style={styles.icon} />
          <Text style={styles.gridItemTextColor}>Last Synched</Text>
          <Text style={styles.gridItemTextSub}>{lastSynched}</Text>
        </View>

        <View style={styles.gridItem}>
          <Icon name={'database'} size={40} color="#fff" style={styles.icon} />
          <Text style={styles.gridItemTextColor}>Queued Tasks</Text>
          <Text style={styles.gridItemTextSub}>{queuedTasks}</Text>
        </View>

        <View style={styles.gridItem}>
          <Icon name={'paperclip'} size={40} color="#fff" style={styles.icon} />
          <Text style={styles.gridItemTextColor}>Pending Files</Text>
          <Text style={styles.gridItemTextSub}>{pendingFiles}</Text>
        </View>

        <TouchableOpacity
          onPress={processSyncData}
          style={{
            ...styles.gridItem,
            backgroundColor: config.colorScheme,
          }}>
          <Icon
            name={'sync'}
            size={40}
            color="#fff"
            style={{
              ...styles.icon,
              color: '#fff',
            }}
          />
          <Text
            style={{
              ...styles.gridItemTextColor,
              color: '#fff',
            }}>
            Sync
          </Text>
          <Text
            style={{
              ...styles.gridItemTextSub,
              color: '#fff',
            }}></Text>
        </TouchableOpacity>

        {/* <TouchableOpacity
          onPress={clearAllSyncData}
          style={{
            ...styles.gridItem,
            backgroundColor: config.colorScheme,
          }}>
          <Icon
            name={'delete'}
            size={40}
            color="#fff"
            style={{
              ...styles.icon,
              color: '#fff',
            }}
          />
          <Text
            style={{
              ...styles.gridItemTextColor,
              color: '#fff',
            }}>
            {t('Clear Sync Data')}
          </Text>
          <Text
            style={{
              ...styles.gridItemTextSub,
              color: '#fff',
            }}></Text>
        </TouchableOpacity> */}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  icon: {
    marginBottom: 15,
    color: config.colorScheme,
  },
  gridItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 10,
    width: '43%',
    height: 150,
    backgroundColor: '#dadada',
    padding: 10,
    borderRadius: 3,
    borderColor: '#f1f1f1',
  },
  gridItemTextColor: {
    color: '#000',
  },
  gridItemTextSub: {
    color: '#000',
    marginTop: 5,
    fontSize: 12,
    fontWeight: 'bold',
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
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    width: '100%',
    flexWrap: 'wrap',
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

export default SyncOnlineData;
