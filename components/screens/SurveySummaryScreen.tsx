import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/AntDesign';
import * as database from '@utils/AppSqliteDb.tsx';
import * as storage from '@utils/AppStorage.tsx';
import globalStyles from '@assets/styles/Styles.tsx';
import { useSelector, useDispatch } from 'react-redux';
import NoRecordFound from '@components/common/NoRecordFound.tsx';
import * as utils from '@utils/Utils';
import CheckBox from '@react-native-community/checkbox';
import config from '@config/config';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {setSurveyQuestions} from '@redux/actions/surveyQuestionsActions.tsx';
import RNFS from 'react-native-fs';
import moment from 'moment';

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

  setUI({
    ...UI,
    menu: true,
    menuTitle: 'CHOOSE OPTION',
    menuActions: [
      {
        title: 'TAKE A PHOTO',
        onPress: async () => {
          const result = await launchCamera(options);

          await updateAttachmentInfo(item, result, setAttachment);
        },
      },
      {
        title: 'BROWSE FROM LIBRARY',
        onPress: async () => {
          const result = await launchImageLibrary(options);

          await updateAttachmentInfo(item, result, setAttachment);
        },
      },
      {
        title: 'VIEW ATTACHED PHOTO(S)',
        onPress: async () => {
          const imgs = await getAllPhotosByMemorialAndQuestions(
            item.questionNumber,
          );
          if (imgs.length === 0) {
            alert('No attached photos found.');
            return;
          }

          let images = [];

          for (const i in imgs) {
            images.push({
              id: imgs[i].id,
              filename: imgs[i]['filename'],
              uri:
                'file:///data/user/0/com.frontendrn/cache/' +
                imgs[i]['filename'],
            });
          }

          setUI({
            ...UI,
            imageFiles: images,
            imageViewer: true,
          });
        },
      },
    ],
  });
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
  delete syncRecord[0]['id'];

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
    delete syncRecord[0]['id'];

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

  const dbValue = {
    memorialId: memorialId,
    time: time,
    geostamp: '',
    updatedAt: dateTime,
    comments: '',
    questionNumber: item.questionNumber,
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
    delete syncRecord[0]['id'];

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
};

const PhotoGrids = ({setUI, UI, item, index, setAttachment}) => {
  const [uiFilePath, setUiFilePath] = useState('default.jpg');

  const onPhotoClick = async () => {
    console.log('clicking');

    const imgs = await getAllPhotosByMemorialAndQuestions('Q3');
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
            'Would you like to delete this photo "' + image.filename + '"?',
          confirmOnOkay: async () => {
            await database.remove('CompletedMemorialPhotos', 'id = ? ', [
              image.id,
            ]);

            const completedMemorials = await getCurrentMemorials({
              questionNumber: 'Q3',
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
    <TouchableOpacity
      style={styles.imgGrids}
      onPress={async () => {
        await onPhotoClick();
      }}>
      <Image
        style={{
          width: '100%',
          height: '100%',
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

    if (condition) {
      await database.insert('CompletedMemorials', {
        memorialId: memorialId,
        time: utils.getMysqlTime(),
        questionNumber: 'Q1',
        comments: item.question,
        passFail: 'failed',
        createdAt: utils.getMysqlDateTime(),
      });
    } else {
      await database.remove(
        'CompletedMemorials',
        `
                memorialId = ? AND questionNumber = ?
                AND comments = ?
            `,
        [memorialId, 'Q1', item.question],
      );
    }
  };

  return (
    <View>
      {checkbox ? (
        <View style={styles.inlineCheckbox}>
          <Icon
            name={'check'}
            size={25}
            color="green"
            style={{
              ...styles.icon,
              marginRight: 10,
            }}
          />
          <Text
            style={{
              color: '#000',
            }}>
            {item.question}
          </Text>
        </View>
      ) : null}
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

    if (condition) {
      await database.insert('CompletedMemorials', {
        memorialId: memorialId,
        time: utils.getMysqlTime(),
        questionNumber: 'OTHERS',
        comments: others,
        passFail: 'failed',
        createdAt: utils.getMysqlDateTime(),
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
      // insert
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
      { checkbox ? 
      <View>
      <View style={styles.inlineCheckbox}>
        <Icon
          name={'check'}
          size={25}
          color="green"
          style={{
            ...styles.icon,
            marginRight: 10,
          }}
        />
        <Text
          style={{
            color: '#000',
          }}>
          {'Others'}
        </Text>
      </View>

      <View
        style={{
          margin: 10,
          marginLeft: 50,
          padding: 10,
  
          borderRadius: 10,
          color: '#000',
          height: 100,
          opacity: checkbox ? 1 : 0.5,
        }}>
        <Text
          style={{
            color: '#000',
            fontSize: 15,
          }}>
          {others}
        </Text>
      </View>
      </View>
      : null }
    </View>
  );
};

const notInCompletedStatus = (status) => {
  return [
    'completed', 
    'complete pass', 
    'complete fail',
    'no memorial present',
    'unable to locate plot'].indexOf(status) === -1
};

const SurveySummaryScreen = ({navigation, UI, setUI}) => {
  const {search, data} = useSelector(state => state.bookedJob);
  const {questions} = useSelector(state => state.surveyQuestion);
  const dispatch = useDispatch();
  const [pageTitle, setPageTitle] = useState('');
  const [category, setCategory] = useState('NO ANSWER YET');
  const [currentDate, setCurrentDate] = useState('-');
  const [inspector, setInspector] = useState('-');
  const [currentTime, setCurrentTime] = useState('-');
  const [memorialHeight, setMemorialHeight] = useState('NO ANSWER YET');
  const [memorialHeightId, setMemorialHeightId] = useState(-1);
  const [attachment, setAttachment] = useState('');
  const [photos, setPhotos] = useState([]);
  const [status, setStatus] = useState('');

  const {t} = useTranslation();

  useEffect(() => {
    const getMemorialHeightValue = async () => {
      const memorialId = await storage.get('memorialId');

      const memorials = await database.getRecords('Jobs', 'memorialId = ?', [
        memorialId,
      ]);

      if (memorials.length > 0) {
        const name = memorials[0]['memorialHeightName'];
        if (name !== 'null') {
          setMemorialHeight(name);
        }
      }
    };

    getMemorialHeightValue();
  }, []);

  useEffect(() => {
    const getPhotos = async () => {
      const imgs = await getAllPhotosByMemorialAndQuestions('Q3');

      if (imgs.length === 0) {
        setAttachment('');
        return;
      }

      setPhotos(imgs);
    };

    getPhotos();
  }, [attachment]);

  useEffect(() => {
    const getCurrentRecord = async () => {
      const memorialId = await storage.get('memorialId');

      const item = {
        questionNumber: 'Q1',
      };

      const count = await getAllPhotosByMemorialAndQuestions(
        item.questionNumber,
      );

      if (count.length > 0) {
        //setAttachment(count.length + t(' Attached Photo(s)'));
      }

      const record = await database.getRecords(
        'CompletedMemorials',
        'memorialId = ? AND questionNumber = ?',
        [memorialId, item.questionNumber],
      );

      if (record.length > 0) {
        if (record[0].passFail !== '') {
          setCategory(record[0].passFail.toUpperCase());

          const date = moment(record[0].createdAt.toUpperCase()).format('MMMM D, YYYY');
          const time = moment(record[0].createdAt.toUpperCase()).format('h:mm A');

          setCurrentDate(date);
          setCurrentTime(time);
          setInspector(record[0].inspector.toUpperCase());
        }

        if (record[0].comments !== '') {
          //setComment(record[0].comments);
        }
      }
    };

    getCurrentRecord();
  }, []);

  const isFormValid = () => {
       let condition = category !== 'NO ANSWER YET' && 
       photos.length > 0 && memorialHeight !== 'NO ANSWER YET';

       switch (category.toUpperCase()) {
        case 'NO MEMORIAL PRESENT':
          if (photos.length !== 0) {
            condition = true;
          }
          break;
        case 'UNABLE TO LOCATE PLOT':
          condition = true;
          break;
          default:
            console.log('no option selected');
            break;
       }

      return condition;
  };

  const setStorageItems = async (item, index) => {
    dispatch(setSurveyQuestions(JSON.parse(item.questions)));
    await storage.set('memorialId', item.memorialId.toString());
    await storage.set('graveNumber', item.graveNumber.toString());
    await storage.set('jobDetails', JSON.stringify(item));
    await storage.set('memorialIndex', index.toString());
  };

  const prepareForNextMemorial = async () => {
    const sectionId = await storage.get('currentSectionId');
    const processMemorialId = await storage.get('memorialId');
    const key = 'section-memorial-' + sectionId + '-' + processMemorialId;

    await database.remove('AppCache', 'Name = ? ', [key]);

    await database.insert('AppCache', {
      Name: key,
      payload: 'SUBMITTED'
    });

    // await database.update('Jobs', {
    //   statusName: 'COMPLETED'
    // }, 'memorialId = ?', processMemorialId);

    const nextJob = await database.getRecords('Jobs', 'LOWER(statusName) = ?', ['booked']);

    await storage.set('hasUpdate', '1');

    if(nextJob.length > 0) {
        await setStorageItems(nextJob[0], 0);
        navigation.pop();

        navigation.navigate('MemorialDetails');
    } else {
      
      await database.update('Sections', {
        status: 'COMPLETED',
      }, 'originalSectionId = ? ', sectionId);
      
      await setUI({
        ...UI,
        alert: true,
        alertType: 'success',
        alertTitle: 'Completed',
        alertMessage: t('All memorial tests have been answered successfully!'),
      });

      navigation.navigate('Dashboard');
    }
  };

  const processSubmitSurvey = async () => {
    const memorialId = await storage.get('memorialId');

    if (!isFormValid()) {
      return;
    }

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
      '%check-' + memorialId + '-%',
    );

    await database.update(
      'Sync',
      {Status: 'APPROVED'},
      'Key like ?',
      '%comment-' + memorialId + '-%',
    );

    await database.update(
      'Sync',
      {Status: 'APPROVED'},
      'Key like ?',
      '%completedMemorialId-%',
    );


    const currentCategory = await storage.get('currentCategory');
    let keyword = '';

    switch(currentCategory.toLowerCase()) {
      case 'fail':
        keyword = 'complete fail';
      break;

      case 'failed':
        keyword = 'complete fail';
      break;

      case 'passed':
        keyword = 'complete pass';
      break;

      case 'pass':
        keyword = 'complete pass';
      break;

      case 'pass but monitor':
        keyword = 'pass but monitor';
      break;

      case 'no memorial present':
        keyword = 'no memorial present';
      break;

      case 'unable to locate plot':
        keyword = 'unable to locate plot';
      break;

      default: 
        keyword = 'complete pass';
      break;
    }

    await database.update(
      'Jobs',
      {
        statusName: keyword,
      },
      'memorialId = ?',
      memorialId,
    );


    await database.insert('Sync', {
      key: 'booked-jobs-memorials',
      Payload: `
        UPDATE memorials SET status_id = (
          SELECT id FROM statuses WHERE 
          LCASE(status) = '${keyword}' LIMIT 1
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
      alertTitle: 'Completed',
      alertMessage: t('Successfully Submitted!'),
    });

    prepareForNextMemorial();
  };

  const fetchData = async () => {
    const memorialId = await storage.get('memorialId');
    const graveNumber = await storage.get('graveNumber');
    

    setPageTitle(t('Test Summary - ' + graveNumber));

    const jobs = await database.getRecords('Jobs', 'memorialId = ?', [
      memorialId
    ]);

    console.log(jobs);
    if (jobs.length > 0) {
        setStatus(jobs[0]['statusName']);
    }
  };

  const updateMemorialHeightData = async data => {
    const memorialId = await storage.get('memorialId');

    await database.update(
      'Jobs',
      {
        memorialHeightId: data['OriginalId'],
        memorialHeightName: data['Name'],
      },
      'memorialId = ?',
      memorialId,
    );

    const syncKey =
      'memorialId-' + memorialId + '-' + data['OriginalId'] + '-ins';
    await database.remove('Sync', 'Key = ?', [syncKey]);

    await database.insert('Sync', {
      key: syncKey,
      Payload:
        "UPDATE memorials SET memorial_height_id = '" +
        data['OriginalId'] +
        "' WHERE id = '" +
        memorialId +
        "'",
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

            await insertOrUpdateDbRecordCompletedMemorials(
              {
                questionNumber: 'Q1',
              },
              'passFail',
              'no memorial present',
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

  const navigateToSendMessage = () => {
    navigation.navigate('SendMessage', {});
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
     
            style={{
              ...styles.icon,
              marginRight: 10,
            }}
          />
          <Text style={globalStyles.topHeaderTitle}>{pageTitle}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity onPress={navigateToSendMessage} elevation={10} style={globalStyles.floatingButton}>
              <Icon
                name={'message1'}
                size={25}
                color="#fff"
                style={styles.iconBooked}
              />
      </TouchableOpacity>

      <ScrollView >

      {/* <Text style={styles.genericQuestionMsg}>
        {t('Q1. Does memorial pass current safety test requirements')}
      </Text> */}

      <View style={styles.iCustomRow}>
          <Text style={styles.iCustomRowDescription}>{ t('Memorial Status') }</Text>
          <Text style={styles.iCustomRowValue}>{category}</Text>
      </View>

      { category !== 'NO MEMORIAL PRESENT' ? 
      <View style={styles.iCustomRow}>
          <Text style={styles.iCustomRowDescription}>{ t('Memorial Height') }</Text>
          <Text style={styles.iCustomRowValue}>{memorialHeight}</Text>
      </View>
      : null }

      <View style={styles.iCustomRow}>
          <Text style={styles.iCustomRowDescription}>{ t('Date') }</Text>
          <Text style={styles.iCustomRowValue}>{currentDate}</Text>
      </View>

      <View style={styles.iCustomRow}>
          <Text style={styles.iCustomRowDescription}>{ t('Time') }</Text>
          <Text style={styles.iCustomRowValue}>{currentTime}</Text>
      </View>

      <View style={styles.iCustomRow}>
          <Text style={styles.iCustomRowDescription}>{ t('Inspector') }</Text>
          <Text style={styles.iCustomRowValue}>{inspector}</Text>
      </View>

      {/* {category === 'FAIL' || category === 'FAILED' ? (
        <View>
          <Text
            style={{
              ...styles.genericQuestionMsg,
              marginLeft: 50,
            }}>
            Q1.A Reason for failure test?
          </Text>

          {questions.map((item, index) => (
            <QuestionCheckboxes key={index} item={item} />
          ))}
          {<OtherCheckbox />}
        </View>
      ) : null} */}

      {/* <Text style={styles.genericQuestionMsg}>
        {t('Q2. What is the memorial height?')}
      </Text>

      <View
        style={{
          ...styles.itemCategory,
          marginTop: 0,
          marginLeft: 10,
          marginRight: 10,
          width: 'auto',
        }}>
        <Text style={styles.itemCategoryText}>{memorialHeight}</Text>
      </View> */}

      {/* <Text style={{...styles.genericQuestionMsg}}>
        {t('Q3. Photograph of memorial')}
      </Text> */}

    <View style={styles.iCustomRow}>
          <Text style={styles.iCustomRowDescriptionPhotos}>{ t('Photos') }</Text>
          <Text style={styles.iCustomRowValue}>{t('')}</Text>
      </View>
      {photos.length === 0 ? <Text style={styles.noPhotos}>No Photo(s) attached yet</Text> : null}

      <View style={styles.photosContainer}>
        {photos.map((item, index) => (
          <PhotoGrids
            setAttachment={setAttachment}
            UI={UI}
            setUI={setUI}
            key={index}
            item={item}
            index={index}
          />
        ))}
      </View>

      { notInCompletedStatus(status.toLowerCase()) ?
      <View style={{marginTop: 20, paddingLeft: 20, paddingRight: 20, marginBottom: 30 }}>
        <TouchableOpacity
          
          style={{
            ...globalStyles.primaryButton,
            marginLeft: 0,
            opacity: (isFormValid() ? 1 : 0.5)
          }}
          onPress={() => {
            processSubmitSurvey();
          }}>
          <Text style={globalStyles.primaryButtonText}>
            {t('SUBMIT')}
          </Text>
        </TouchableOpacity>
      </View> : null }
    </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  iCustomRowDescription: {
    color: '#000',
    fontSize: 16,
    width: '40%',
    display: 'flex',
    justifyContent: 'center',
    textAlign: "right",
    paddingRight: 20
  },
  iCustomRowDescriptionPhotos: {
    color: '#000',
    fontSize: 16,
    width: '40%',
    display: 'flex',
    justifyContent: 'center',
    textAlign: "left",
    paddingLeft: 20
  },
  iCustomRowValue: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
    width: '60%'
  },
  iCustomRow: {
    marginTop: 10,
    display: 'flex',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  photosContainer: {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 10,
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

  noPhotos: {
    color: '#000',
    fontSize: 18,
    padding: 10
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
    height: 150,
  },
});

export default SurveySummaryScreen;
