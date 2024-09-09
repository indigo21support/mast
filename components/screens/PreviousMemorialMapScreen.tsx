import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/AntDesign';
import * as database from '@utils/AppSqliteDb.tsx';
import * as storage from '@utils/AppStorage.tsx';
import globalStyles from '@assets/styles/Styles.tsx';
import {useSelector, useStore, useDispatch} from 'react-redux';
import store from '@redux/store';

import NoRecordFound from '@components/common/NoRecordFound.tsx';
import * as utils from '@utils/Utils';
import CheckBox from '@react-native-community/checkbox';
import config from '@config/config';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import RNFS from 'react-native-fs';
import MapViewDirections from 'react-native-maps-directions';
import MapView from 'react-native-maps';
import {Marker} from 'react-native-maps';
import {setSurveyQuestions} from '@redux/actions/surveyQuestionsActions.tsx';

const updateAttachmentInfo = async (item, result, setAttachment) => {
  if ('assets' in result) {
    console.log(result['assets']);
    for (const i in result['assets']) {
      const obj = result['assets'][i];

      await database.insert('FileSync', {
        filename: obj.filename,
        Path: obj.uri,
        Status: 'APPROVED',
        createdAt: utils.getMysqlDateTime(),
        updatedAt: utils.getMysqlDateTime(),
      });

      await insertDbRecordCompletedPhotos(item, 'filename', obj.fileName);
    }
  }
  const count = await getAllPhotosByMemorialAndQuestions(item.questionNumber);

  setAttachment(count.length + ' Attached Photo(s)');
};

const processPhotoAttachment = async (UI, setUI, item, setAttachment) => {
  options = {
    mediaType: 'mixed',
    maxWidth: 768,
    maxHeight: 768,
  };

  const result = await launchCamera(options);

  await updateAttachmentInfo(item, result, setAttachment);

  // setUI({
  //   ...UI,
  //   menu: true,
  //   menuTitle: 'CHOOSE OPTION',
  //   menuActions: [
  //     {
  //       title: 'TAKE A PHOTO',
  //       onPress: async () => {
  //         const result = await launchCamera(options);

  //         await updateAttachmentInfo(item, result, setAttachment);
  //       },
  //     },
  //     {
  //       title: 'BROWSE FROM LIBRARY',
  //       onPress: async () => {
  //         const result = await launchImageLibrary(options);

  //         await updateAttachmentInfo(item, result, setAttachment);
  //       },
  //     },
  //   ],
  // });
};

const getCurrentMemorials = async item => {
  const memorialId = await storage.get('memorialId');

  const completedMemorials = await database.getRecords(
    'CompletedMemorials',
    'memorialId = ? AND questionNumber = ?',
    [memorialId, item.questionNumber],
  );

  return completedMemorials;
};

const getAllPhotosByMemorialAndQuestions = async questionNumber => {
  const memorialId = await storage.get('memorialId');
  const records = await database.getRecords(
    'CompletedMemorialPhotos',
    'memorialId = ? AND questionNumber = ?',
    [memorialId, questionNumber],
  );
  return records;
};

const insertDbRecordCompletedPhotos = async (item, key, value) => {
  const memorialId = await storage.get('memorialId');

  const completedMemorials = await getCurrentMemorials(item);

  let completedMemorialId = -1;

  if (completedMemorials.length > 0) {
    completedMemorialId = completedMemorials[0].id;
  } else {
    await insertOrUpdateDbRecordCompletedMemorials(item, 'passFail', '');

    const completedMemorials = await getCurrentMemorials(item);

    completedMemorialId = completedMemorials[0].id;
  }

  const dateTime = await utils.getMysqlDateTime();

  const dbValue = {
    completedMemorialId: completedMemorialId,
    memorialId: memorialId,
    filename: value,
    updatedAt: dateTime,
    questionNumber: item.questionNumber,
  };

  dbValue['createdAt'] = dateTime;

  await database.insert('CompletedMemorialPhotos', dbValue);

  const syncRecord = await database.getRecords(
    'CompletedMemorialPhotos',
    'completedMemorialId = ? AND memorialId = ? AND filename = ?',
    [completedMemorialId, memorialId, value],
  );

  delete syncRecord[0]['deletedAt'];

  await database.insert('Sync', {
    key: 'completedMemorialIdDelete-' + completedMemorialId,
    Payload: `DELETE FROM completed_memorial_photos WHERE 
            completed_memorial_id = '${completedMemorialId}' 
            AND memorial_id = '${memorialId}'`,
    Status: 'PENDING',
    CreatedAt: utils.getMysqlDateTime(),
    UpdatedAt: utils.getMysqlDateTime(),
  });

  console.log(syncRecord[0]);

  const sqlCode = await utils.toSqlInsert(
    'completed_memorial_photos',
    utils.objToCamelCase(syncRecord[0]),
  );
  console.log(sqlCode);

  const syncKey =
    'completedMemorialId-' +
    completedMemorialId +
    '-' +
    memorialId +
    '-' +
    value;
  await database.remove('Sync', 'Key = ?', [syncKey]);

  await database.insert('Sync', {
    key: syncKey,
    Payload: sqlCode,
    Status: 'PENDING',
    CreatedAt: utils.getMysqlDateTime(),
    UpdatedAt: utils.getMysqlDateTime(),
  });
};

const insertOrUpdateDbRecordCompletedPhotos = async (item, key, value) => {
  const memorialId = await storage.get('memorialId');

  const completedMemorials = await getCurrentMemorials(item);

  let completedMemorialId = -1;

  if (completedMemorials.length > 0) {
    completedMemorialId = completedMemorials[0].id;
  } else {
    await insertOrUpdateDbRecordCompletedMemorials(item, 'passFail', '');

    const completedMemorials = await getCurrentMemorials(item);

    completedMemorialId = completedMemorials[0].id;
  }

  const checkRecord = await database.getRecords(
    'CompletedMemorialPhotos',
    'completedMemorialId = ? AND memorialId = ? AND questionNumber = ?',
    [completedMemorialId, memorialId, item.questionNumber],
  );

  const dateTime = await utils.getMysqlDateTime();

  const dbValue = {
    completedMemorialId: completedMemorialId,
    memorialId: memorialId,
    filename: item.filename,
    updatedAt: dateTime,
    questionNumber: item.questionNumber,
  };

  if (checkRecord.length === 0) {
    dbValue[key] = value;
    dbValue['createdAt'] = dateTime;

    await database.insert('CompletedMemorialPhotos', dbValue);

    const syncRecord = await database.getRecords(
      'CompletedMemorialPhotos',
      'completedMemorialId = ? AND memorialId = ? AND filename',
      [completedMemorialId, memorialId, item.filename],
    );

    delete syncRecord[0]['deletedAt'];

    const sqlCode = await utils.toSqlInsert(
      'completed_memorial_photos',
      utils.objToCamelCase(syncRecord[0]),
    );
    console.log(sqlCode);

    const syncKey =
      'completedMemorialId-' +
      completedMemorialId +
      '-' +
      memorialId +
      '-' +
      item.filename +
      '-ins';
    await database.remove('Sync', 'Key = ?', [syncKey]);

    await database.insert('Sync', {
      key: syncKey,
      Payload: sqlCode,
      Status: 'PENDING',
      CreatedAt: utils.getMysqlDateTime(),
      UpdatedAt: utils.getMysqlDateTime(),
    });
  } else {
    const objUpdate = {};
    objUpdate[key] = value;

    await database.update(
      'CompletedMemorialPhotos',
      objUpdate,
      'id = ? ',
      checkRecord[0].id,
    );

    const sqlCode = await utils.toSqlUpdate(
      'completed_memorial_photos',
      utils.objToCamelCase(objUpdate),
      'id = "' + checkRecord[0].id + '" ',
    );

    const syncKey =
      'completedMemorialId-' +
      completedMemorialId +
      '-' +
      memorialId +
      '-' +
      item.filename;

    await database.remove('Sync', 'Key = ?', [syncKey]);

    await database.insert('Sync', {
      key: syncKey,
      Payload: sqlCode,
      Status: 'PENDING',
      CreatedAt: utils.getMysqlDateTime(),
      UpdatedAt: utils.getMysqlDateTime(),
    });
  }
};

const insertOrUpdateDbRecordCompletedMemorials = async (item, key, value) => {
  const memorialId = await storage.get('memorialId');
  const checkRecord = await getCurrentMemorials(item);
  const time = await utils.getMysqlTime();
  const dateTime = await utils.getMysqlDateTime();
  const userStr = await storage.get('user');
  const user = JSON.parse(userStr);
  const category = await storage.get('currentCategory');

  const state = store.getState();

  await storage.set('lastLatLong', '' + state.geoLocation.latlong.latitude + '|' + state.geoLocation.latlong.longitude);

  const dbValue = {
    memorialId: memorialId,
    time: time,
    geostamp: state.geoLocation.latlong.latitude + '|' + state.geoLocation.latlong.longitude,
    updatedAt: dateTime,
    comments: '',
    inspector: user['name'],
    questionNumber: item.questionNumber,
    passFail: category
  };

  if (checkRecord.length === 0) {
    dbValue[key] = value;
    dbValue['createdAt'] = dateTime;
    await database.insert('CompletedMemorials', dbValue);

    const syncRecord = await database.getRecords(
      'CompletedMemorials',
      'memorialId = ? AND questionNumber = ?',
      [memorialId, item.questionNumber],
    );

    delete syncRecord[0]['deletedAt'];

    await database.insert('Sync', {
      key: 'completedMemorialId-' + memorialId,
      Payload: `DELETE FROM completed_memorials WHERE memorial_id = '${memorialId}' AND question_number = '${item.questionNumber}'`,
      Status: 'PENDING',
      CreatedAt: utils.getMysqlDateTime(),
      UpdatedAt: utils.getMysqlDateTime(),
    });

    const sqlCode = await utils.toSqlInsert(
      'completed_memorials',
      utils.objToCamelCase(syncRecord[0]),
    );
    console.log(sqlCode);

    const syncKey =
      'memorialId-' + memorialId + '-' + item.questionNumber + '-ins';
    await database.remove('Sync', 'Key = ?', [syncKey]);

    await database.insert('Sync', {
      key: syncKey,
      Payload: sqlCode,
      Status: 'PENDING',
      CreatedAt: utils.getMysqlDateTime(),
      UpdatedAt: utils.getMysqlDateTime(),
    });
  } else {
    const objUpdate = {};

    objUpdate[key] = value;

    await database.update(
      'CompletedMemorials',
      objUpdate,
      'id = ? ',
      checkRecord[0].id,
    );

    const sqlCode = await utils.toSqlUpdate(
      'completed_memorials',
      utils.objToCamelCase(objUpdate),
      'id = "' + checkRecord[0].id + '" ',
    );

    console.log(sqlCode);

    const syncKey =
      'memorialId-' + memorialId + '-' + item.questionNumber + '-' + key;
    await database.remove('Sync', 'Key = ?', [syncKey]);

    await database.insert('Sync', {
      key: syncKey,
      Payload: sqlCode,
      Status: 'PENDING',
      CreatedAt: utils.getMysqlDateTime(),
      UpdatedAt: utils.getMysqlDateTime(),
    });
  }

  const sqlCodeUpdate = await utils.toSqlUpdate(
    'completed_memorials', 
    {
      pass_fail: category
    },
    "memorial_id = '" + memorialId + "' AND question_number IN('Q1','Q2', 'Q3') "
  );

  await database.insert('Sync', {
    key: 'memorialId-' + memorialId + '-update-other-question-number',
    Payload: sqlCodeUpdate,
    Status: 'PENDING',
    CreatedAt: utils.getMysqlDateTime(),
    UpdatedAt: utils.getMysqlDateTime(),
  });
};

const PhotoGrids = ({setUI, UI, item, index, setAttachment}) => {
  const [uiFilePath, setUiFilePath] = useState('default.jpg');
  const onPhotoClick = async () => {
    const imgs = await getAllPhotosByMemorialAndQuestions(
      'Q3',
    );
    if (imgs.length === 0) {
      setAttachment('');
      return;
    }

    let images = [];

    for (const i in imgs) {

      let filePath = 'file:///data/user/0/com.frontendrn/cache/' + imgs[i]['filename'];

      const exists = await RNFS.exists(filePath);

      if (!exists) {
        const baseUrl = await storage.get('baseUrl');

        filePath = baseUrl + '/view-photo?filename=' + item['filename'];
      }

      images.push({
        id: imgs[i].id,
        filename: imgs[i]['filename'],
        uri: filePath,
      });
    }

    setUI({
      ...UI,
      imageFiles: images,
      imageIndex: index,
      imageViewer: true,
      imageOnLongPress: image => {
        setUI({
          ...UI,
          confirm: true,
          confirmType: 'question',
          confirmMessage:
            'Would you like to delete this photo "' +
            image.filename +
            '"?',
          confirmOnOkay: async () => {
            await database.remove('CompletedMemorialPhotos', 'id = ? ', [
              image.id,
            ]);

            const completedMemorials = await getCurrentMemorials({
              questionNumber: 'Q3'
            });

            const cmp = await database.getRecords(
              'CompletedMemorialPhotos',
              'completedMemorialId = ?',
              [completedMemorials[0].id],
            );

            if (cmp.length === 0) {
              setAttachment('Attach photo(s)');
            } else {
              setAttachment(cmp.length + ' Attached photo(s)');
            }
          },
        });
      },
    });
  };

  let filePath = 'file:///data/user/0/com.frontendrn/cache/' + item['filename'];

  useEffect ( () => {
    RNFS.exists(filePath)
    .then(async (exists) => {
      if (!exists) {
        const baseUrl = await storage.get('baseUrl');

        setUiFilePath(baseUrl + '/view-photo?filename=' + item['filename']);
      } else {
        setUiFilePath(filePath);
      }
    })
    .catch((error) => {
      
    });
  }, []);
  

  return (
    <TouchableOpacity style={styles.imgGrids} onPress={ async () => {
      await onPhotoClick();
    } }>
      <Image
          style={{
            width: '100%',
            height: '100%'
          }}
    
          source={{
            uri: uiFilePath,
          }}
        />
      </TouchableOpacity>
  );
};

const QuestionCheckboxes = ({item}) => {
  const [checkbox, setCheckbox] = useState(false);

  const getExistingRecord = async () => {
    const memorialId = await storage.get('memorialId');
    const records = await database.getRecords(
      'CompletedMemorials',
      `
            memorialId = ? AND questionNumber = ? AND 
            comments = ?
        `,
      [memorialId, 'Q1', item.question],
    );

    for (const i in records) {
      const obj = records[i];

      if (obj.comments === item.question) {
        setCheckbox(true);
      }
    }
  };

  getExistingRecord();

  const toggleCheckboxValue = async (condition, question) => {
    const memorialId = await storage.get('memorialId');

    const state = store.getState();

    const key = 'check-' + memorialId + '-' + question + '-ins';

    await database.remove('Sync', 'key = ?', [key]);

    if (condition) {
      await database.insert('CompletedMemorials', {
        memorialId: memorialId,
        time: utils.getMysqlTime(),
        questionNumber: 'Q1',
        comments: question,
        passFail: 'failed',
        createdAt: utils.getMysqlDateTime(),
      });
      

      await database.insert('Sync', {
        key: key,
        Payload: `
          INSERT INTO completed_memorials SET 
          memorial_id = '${memorialId}',
          time = '${utils.getMysqlTime()}',
          geostamp = '` + state.geoLocation.latlong.latitude + '|' + state.geoLocation.latlong.longitude + `',
          question_number = 'Q1',
          pass_fail = 'failed',
          comments = '${question}',
          created_at = '${utils.getMysqlDateTime()}',
          updated_at = '${utils.getMysqlDateTime()}',
          deleted_at = ''
        `,
        Status: 'PENDING',
        CreatedAt: utils.getMysqlDateTime(),
        UpdatedAt: utils.getMysqlDateTime(),
      });
    } else {
      await database.remove(
        'CompletedMemorials',
        `
                memorialId = ? AND questionNumber = ?
                AND comments = ?
            `,
        [memorialId, 'Q1', question],
      );
    }
  };

  return (
    <View style={styles.inlineCheckbox}>
      <CheckBox
        disabled={false}
        value={checkbox}
        tintColors={config.colorScheme}
        onValueChange={newValue => {
          setCheckbox(newValue);
          toggleCheckboxValue(newValue, item.question);
        }}
      />
      <Text
        style={{
          color: '#000',
        }}>
        {item.question}
      </Text>
    </View>
  );
};

const OtherCheckbox = () => {
  const [checkbox, setCheckbox] = useState(false);
  const [others, setOthers] = useState('');

  useEffect(() => {
    const getExistingRecord = async () => {
      const memorialId = await storage.get('memorialId');
      const records = await database.getRecords(
        'CompletedMemorials',
        `
              memorialId = ? AND questionNumber = ?
          `,
        [memorialId, 'OTHERS'],
      );

      console.log(records);

      for (const i in records) {
        const obj = records[i];

        if (obj.questionNumber === 'OTHERS') {
          setCheckbox(true);
          setOthers(obj.comments);
        }
      }
    };
    getExistingRecord();
  }, []);

  const toggleCheckboxValue = async (condition, question) => {
    const memorialId = await storage.get('memorialId');

    const state = store.getState();

    const key = 'check-' + memorialId + '-' + question + '-ins';

    await database.remove('Sync', 'key = ?', [key]);

    if (condition) {
      await database.insert('CompletedMemorials', {
        memorialId: memorialId,
        time: utils.getMysqlTime(),
        questionNumber: 'OTHERS',
        comments: others,
        passFail: 'failed',
        createdAt: utils.getMysqlDateTime(),
      });

      await database.insert('Sync', {
        key: key,
        Payload: `
          INSERT INTO completed_memorials SET 
          memorial_id = '${memorialId}',
          time = '${utils.getMysqlTime()}',
          geostamp = '` + state.geoLocation.latlong.latitude + '|' + state.geoLocation.latlong.longitude + `',
          question_number = 'OTHERS',
          pass_fail = 'failed',
          comments = '${others}',
          created_at = '${utils.getMysqlDateTime()}',
          updated_at = '${utils.getMysqlDateTime()}',
          deleted_at = ''
        `,
        Status: 'PENDING',
        CreatedAt: utils.getMysqlDateTime(),
        UpdatedAt: utils.getMysqlDateTime(),
      });

    } else {
      await database.remove(
        'CompletedMemorials',
        `
                memorialId = ? AND questionNumber = ?
            `,
        [memorialId, 'OTHERS'],
      );
    }
  };

  const setCommentData = async (text, question) => {
    const memorialId = await storage.get('memorialId');

    const check = await database.getRecords(
      'CompletedMemorials',
      `
            memorialId = ? AND questionNumber = ?
        `,
      [memorialId, question],
    );

    if (check.length > 0) {
      // update
      await database.update(
        'CompletedMemorials',
        {
          comments: others,
        },
        'id = ?',
        check[0].id,
      );
    } else {
      await database.insert('CompletedMemorials', {
        memorialId: memorialId,
        time: utils.getMysqlTime(),
        questionNumber: 'OTHERS',
        comments: others,
        passFail: 'failed',
        createdAt: utils.getMysqlDateTime(),
      });
    }
  };

  return (
    <View>
      <View style={styles.inlineCheckbox}>
        <CheckBox
          disabled={false}
          value={checkbox}
          tintColors={config.colorScheme}
          onValueChange={newValue => {
            setCheckbox(newValue);
            toggleCheckboxValue(newValue, 'OTHERS');
          }}
        />
        <Text
          style={{
            color: '#000',
          }}>
          {'Others'}
        </Text>
      </View>

      <TextInput
        editable={checkbox}
        multiline
        numberOfLines={4}
        maxLength={40}
        placeholder={'Description..'}
        placeholderTextColor={'#e5e5e5'}
        onChangeText={text => {
          setOthers(text);
          setTimeout(() => {
            setCommentData(text, 'OTHERS');
          }, 3000);
        }}
        value={others}
        style={{
          margin: 10,
          marginLeft: 50,
          backgroundColor: '#fff',
          borderRadius: 10,
          color: '#000',
          opacity: checkbox ? 1 : 0.5,
        }}
      />
    </View>
  );
};

const PreviousMemorialMapScreen = ({navigation, UI, setUI}) => {
  const {search, data} = useSelector(state => state.bookedJob);
  const {questions} = useSelector(state => state.surveyQuestion);
  const [pageTitle, setPageTitle] = useState('');
  const [category, setCategory] = useState('SELECT');
  const [memorialHeight, setMemorialHeight] = useState('SELECT');
  const [memorialHeightId, setMemorialHeightId] = useState(-1);
  const [attachment, setAttachment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [origin, setOrigin] = useState({latitude: 0, longitude: 0});
  const [destination, setDestination] = useState({latitude: 0, longitude: 0});
  const [markers, setMarkers] = useState([]);
  const dispatch = useDispatch();
  const GOOGLE_MAPS_APIKEY = 'AIzaSyCcks0PZf2QyjME4dx1NiYaDlluMEoN1fU';
  const [gridRowHeight, setGridGrowHeight] = useState(200);
  const [currentGraveNumber, setCurrentGraveNumber] = useState('');
  

  const { latlong } = useSelector(state => state.geoLocation);
  const {t} = useTranslation();

  const [grids, setGrids] = useState({});
  const [sequence, setSequence] = useState([]);
  const [currentDirection, setCurrentDirection] = useState('');

  const setStorageItems = async (item, index) => {
    dispatch(setSurveyQuestions(JSON.parse(item['questions'])));
    await storage.set('memorialId', item['memorialId'].toString());
    await storage.set('graveNumber', item['graveNumber'].toString());
    await storage.set('jobDetails', JSON.stringify(item));
    await storage.set('memorialIndex', index.toString());
    await storage.set('hasUpdate', '1');
  };

  useEffect( () => {

    const getGridData = async () => {
      const sectionId = await storage.get('currentSectionId');
      
      const records = await database.getRecords('Jobs', 
        "sectionId = ? and LOWER(statusName) IN('booked', 'completed', 'complete pass', 'complete fail', 'no memorial present', 'unable to locate plot') ",
        [
          sectionId,
        ],'ORDER BY id, column DESC'
      );


      let gridRecords = {};
      let sequenceArr = [];
      let previousDirect = 'down';
      let totalRows = 0;

      for(const i in records) {
        const obj = records[i];
        const column = obj['column'].toString();

        if (typeof(gridRecords[column]) === 'undefined') {
          gridRecords[column] = [];
        }

        if (obj['direction'] === 'left') {
          setCurrentDirection('left');
        }

        if (obj['direction'] === 'right') {
          setCurrentDirection('right');
        }

        gridRecords[column].push(obj);
        totalRows++;
      }

      setGridGrowHeight(totalRows * 300);

      let tmp = {};
      let LR = {};

      for (const i in gridRecords) {
        const items = gridRecords[i];
        let previousDirection = '';

        if (typeof(tmp[i]) === 'undefined') {
          tmp[i] = [];
        }
        
        for(const x in items) {
          const obj = items[x];

          if (previousDirection === '') {
            previousDirection = obj['direction'];
          }

          if (obj['direction'] === 'left') {
            const incrementTmp = (parseInt(i) + 1).toString();

            if (typeof(LR[i]) === 'undefined') {
              LR[i] = [];
            }

            LR[i].push(obj);
            continue;
          }

          tmp[i].push(obj);


          previousDirection = obj['direction'];
        }
      }

      let tmp2 = {};

      for(const i in tmp) {
        const items = tmp[i];

        if (typeof(tmp2[i]) === 'undefined') {
          tmp2[i] = [];
        }

        const item = items[0];

            
        if (item['direction'] === 'up' && typeof(LR[i]) !== 'undefined') {
            const lrItems = LR[i];

            for(const lrCtr in lrItems) {
              const lrObj = lrItems[lrCtr];
              tmp2[i].push(lrObj);
            }
        }

        for(const x in items) {
          const obj = items[x];

          tmp2[i].push(obj);
        }

        if (item['direction'] === 'down') {
          tmp2[i] = tmp2[i].reverse();
        }
        

        if (item['direction'] === 'down' && typeof(LR[i]) !== 'undefined') {
            const lrItems = LR[i];

            for(const lrCtr in lrItems) {
              const lrObj = lrItems[lrCtr];
              tmp2[i].push(lrObj);
            }
        }


      }

      setGrids(tmp2);
    };

    getGridData();

    const getGeoLocation = async () => {
      const lastLatLong = await storage.get('lastLatLong');
      let parts = '';
      if (lastLatLong === null) {
          parts = latlong.latitude + '|' +latlong.longitude;
      }

      parts = lastLatLong.split('|');

      setOrigin({latitude: latlong.latitude, longitude: latlong.longitude});

      setDestination({latitude: parseFloat(parts[0]), longitude: parseFloat(parts[1])});

      console.log(latlong.latitude+'-'+latlong.longitude);

      setTimeout ( () => getGeoLocation(), 10000);
    };

    getGeoLocation();
  }, []);

  const processSubmitSurvey = async () => {
    if (answered < questions.length) {
      return;
    }

    const memorialId = await storage.get('memorialId');

    await database.update(
      'Sync',
      {Status: 'APPROVED'},
      'Key like ?',
      '%memorialId-' + memorialId + '-%',
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

    await database.insert('Sync', {
      key: 'booked-jobs-memorials',
      Payload: `
        UPDATE memorials SET status_id = (
          SELECT id FROM statuses WHERE 
          LCASE(status) = 'complete pass' LIMIT 1
        )
        WHERE id = '${memorialId}'
      `,
      Status: 'APPROVED',
      CreatedAt: utils.getMysqlDateTime(),
      UpdatedAt: utils.getMysqlDateTime(),
    });

    setUI({...UI, refresh: UI.refresh + 1});

    navigation.navigate('Dashboard');
  };

  const fetchData = async () => {
    const memorialId = await storage.get('memorialId');
    const graveNumber = await storage.get('graveNumber');
    const jd = await database.getRecords('Jobs', 'memorialId = ?', [memorialId]);

    setPageTitle(t(jd[0]['familyName'] + ' - ' + graveNumber));
    setCurrentGraveNumber(graveNumber);
  };

  const updateMemorialHeightData = async (data) => {
    const memorialId = await storage.get('memorialId');

    await database.update('Jobs', {
      memorialHeightId: data['OriginalId'],
      memorialHeightName: data['Name'],
    }, 'memorialId = ?', memorialId);

    const syncKey = 'memorialId-' + memorialId + '-' + data['OriginalId'] + '-ins';
    await database.remove('Sync', 'Key = ?', [syncKey]);

    await database.insert('Sync', {
      key: syncKey,
      Payload: "UPDATE memorials SET memorial_height_id = '" + data['OriginalId'] + "' WHERE id = '" + memorialId + "'",
      Status: 'PENDING',
      CreatedAt: utils.getMysqlDateTime(),
      UpdatedAt: utils.getMysqlDateTime(),
    });

    
  };

  const viewMemorialHeight = async () => {
    const result = await database.getRecords('MemorialHeights', '', []);

    const options = [];

    for (const i in result) {
      const data = result[i];

      options.push({
        title: data['Name'],
        onPress: async () => {
          setMemorialHeight(data['Name']);
          setMemorialHeightId(data['OriginalId']);

          await updateMemorialHeightData(data);
        },
      });
    }

    setUI({
      ...UI,
      menu: true,
      menuTitle: t('MEMORIALS'),
      menuActions: options,
    });
  };

  const viewActionMenu = () => {
    setUI({
      ...UI,
      menu: true,
      menuTitle: t('SELECT ANSWER'),
      menuActions: [
        {
          title: t('PASS'),
          onPress: async () => {
            setCategory('PASS');

            await storage.set('currentCategory', 'passed');

            await insertOrUpdateDbRecordCompletedMemorials(
              {
                questionNumber: 'Q1',
              },
              'passFail',
              'passed',
            );
          },
        },
        {
          title: t('FAIL'),
          onPress: async () => {
            setCategory('FAIL');

            await storage.set('currentCategory', 'failed');

            await insertOrUpdateDbRecordCompletedMemorials(
              {
                questionNumber: 'Q1',
              },
              'passFail',
              'failed',
            );
          },
        },
        {
          title: t('PASS BUT MONITOR'),
          onPress: async () => {
            setCategory('PASS BUT MONITOR');

            await storage.set('currentCategory', 'pass but monitor');

            await insertOrUpdateDbRecordCompletedMemorials(
              {
                questionNumber: 'Q1',
              },
              'passFail',
              'pass but monitor',
            );
          },
        },
        {
          title: t('NO MEMORIAL PRESENT'),
          onPress: async () => {
            setCategory('NO MEMORIAL PRESENT');

            await storage.set('currentCategory', 'no memorial present');

            await insertOrUpdateDbRecordCompletedMemorials(
              {
                questionNumber: 'Q1',
              },
              'passFail',
              'no memorial present',
            );
          },
        },
        {
          title: t('UNABLE TO LOCATE PLOT'),
          onPress: async () => {
            setCategory('UNABLE TO LOCATE PLOT');

            await storage.set('currentCategory', 'unable to locate plot');

            await insertOrUpdateDbRecordCompletedMemorials(
              {
                questionNumber: 'Q1',
              },
              'passFail',
              'unable to locate plot',
            );
          },
        },
      ],
    });
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
    fetchData();
  };

  const viewSummaryDetails = async () => {
      navigation.pop();
      navigation.navigate('SurveySummary');
  };

  const viewPDF = async () => {
    navigation.navigate('PdfViewer');
  };

  const navigateToSendMessage = () => {
    navigation.navigate('SendMessage', {});
  };

  const { width, height } = Dimensions.get('window');
  const ASPECT_RATIO = width / height;
  const LATITUDE_DELTA = 0.0322;
  const LONGITUDE_DELTA = LATITUDE_DELTA * (ASPECT_RATIO);

  let previousDirection = '';
  let carryOver = [];

  const [displayGrid, setDisplayGrid] = useState({});

  useEffect( () => {
    if (currentDirection === 'left') {
    setDisplayGrid(Object.keys(grids).reverse());
  } else if (currentDirection === 'right') {
    setDisplayGrid(Object.keys(grids));
  }
  }, [grids]);


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
          <Text style={globalStyles.topHeaderTitle}>{'Previous Memorial Location Map'}</Text>
        </TouchableOpacity>
      </View>

      <MapView  
      initialRegion={{
        latitude: latlong.latitude,
        longitude: latlong.longitude,
        latitudeDelta: LATITUDE_DELTA,
        longitudeDelta: LONGITUDE_DELTA,
      }}

      style={{
        width: '100%',
        marginTop: 30,
        height: 400,
      }}>

        <Marker coordinate = {{latitude: destination.latitude, longitude: destination.longitude}}
         pinColor = {"green"} // any color
         title={"DESTINATION"}
         description={"LAST MEMORIAL LOCATION"}/>

        <Marker coordinate = {{latitude: latlong.latitude, longitude: latlong.longitude}}
          pinColor = {"red"} // any color
          title={"CURRENT LOCATION"}
          description={""}/>

          <MapViewDirections
            language='en'
            strokeWidth={10}
            strokeColor="blue"
            origin={origin}
            mode='DRIVING'
            destination={destination}
            apikey={GOOGLE_MAPS_APIKEY}
          />
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  gridbox1: {
    backgroundColor: 'white',
    width: '100%',
    height: 80,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 30,
    paddingTop: 10,
    paddingBottom: 10
  },
  boxes: {
    backgroundColor: 'blue',
    width: '100%',
    height: 60,
  },
  gridColumn: {
    width: 150,
    height: '100%',
    marginRight: 15,
    marginLeft: 15
  },
  up: {
    height: 20,
    width: 20,
    backgroundColor: 'blue'
  },
  down: {
    height: 20,
    width: 20,
    backgroundColor: 'blue'
  },
  gridText: {
    fontSize: 12,
    color: '#000',
    fontWeight: 'bold'
  },
  gridPill: {
    width: 150,
    height: 60,
    padding: 20,
    backgroundColor: '#fff',
    marginTop: 10,
  },
  gridBoxes: {
    width: '100%',
    height: 3000,
    marginTop: 30,
    backgroundColor: '#dadada',
  },
  photosContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10
  },
  inlineCheckbox: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 50,
  },
  genericQuestionMsg: {
    color: '#000',
    margin: 10,
    backgroundColor: '#fff',
    padding: 10,
    borderRadius: 10,
    fontSize: 18,
  },
  summaryText: {
    color: '#000',
    fontSize: 15,
    width: '50%',
    textAlign: 'right',
  },

  summaryTextValue: {
    color: '#000',
    fontSize: 15,
    width: '50%',
    fontWeight: 'bold',
    paddingLeft: 30,
  },
  summaryItem: {
    backgroundColor: '#dadada',
    padding: 20,
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  attachText: {
    marginRight: 10,
    color: '#000',
  },
  column: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
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
    fontSize: 18,
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
  imgGrids: {
    width: '33.33%',
    height: 150
  }
});

export default PreviousMemorialMapScreen;
