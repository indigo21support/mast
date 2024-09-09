import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import {useTranslation} from 'react-i18next';
import Icon from 'react-native-vector-icons/AntDesign';
import * as database from '@utils/AppSqliteDb';
import * as storage from '@utils/AppStorage';
import NoRecordFound from '@components/common/NoRecordFound';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import moment from 'moment';
import {useSelector, useDispatch} from 'react-redux';
import * as utils from '@utils/Utils';

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
        updatedAt: utils.getMysqlDateTime()
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

                  const completedMemorials = await getCurrentMemorials(item);

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

const SurveyQuestionItem = ({setUI, UI, item, index}) => {
  const [category, setCategory] = useState('SELECT');
  const [comment, setComment] = useState('');

  const {t} = useTranslation();

  const [attachment, setAttachment] = useState(t('Attach Photo(s)'));
  const [photos, setPhotos] = useState([]);
  useEffect( () => {
    const getPhotos = async() => {
      const imgs = await getAllPhotosByMemorialAndQuestions(
        item.questionNumber,
      );
      if (imgs.length === 0) {
        alert('No attached photos found.');
        return;
      }

      setPhotos(imgs);
    };

    getPhotos();
  }, [attachment]);

  useEffect(() => {
    const getCurrentRecord = async () => {
      const memorialId = await storage.get('memorialId');

      const count = await getAllPhotosByMemorialAndQuestions(
        item.questionNumber,
      );

      if (count.length > 0) {
        setAttachment(count.length + t(' Attached Photo(s)'));
      }

      const record = await database.getRecords(
        'CompletedMemorials',
        'memorialId = ? AND questionNumber = ?',
        [memorialId, item.questionNumber],
      );

      if (record.length > 0) {
        if (record[0].passFail !== '') {
          setCategory(record[0].passFail.toUpperCase());
        }

        if (record[0].comments !== '') {
          setComment(record[0].comments);
        }
      }
    };

    getCurrentRecord();
  }, []);

  const viewActionMenu = () => {
    setUI({
      ...UI,
      menu: true,
      menuTitle: t('SELECT ANSWER'),
      menuActions: [
        {
          title: t('PASSED'),
          onPress: async () => {
            await insertOrUpdateDbRecordCompletedMemorials(
              item,
              'passFail',
              'passed',
            );
            setCategory('PASSED');
          },
        },
        {
          title: t('FAILED'),
          onPress: async () => {
            await insertOrUpdateDbRecordCompletedMemorials(
              item,
              'passFail',
              'failed',
            );
            setCategory('FAILED');
          },
        },
      ],
    });
  };

  return (
    <View
      style={{
        ...styles.item,
        backgroundColor: index % 2 === 0 ? '#e5e5e5' : '#fefefe',
      }}>
      <Text style={styles.questionNumber}>{item.questionNumber}</Text>
      <Text style={styles.itemTitle}>{item.question}</Text>
      <TouchableOpacity
        onPress={() => viewActionMenu()}
        style={styles.itemCategory}>
        <Text style={styles.itemCategoryText}>{category}</Text>
      </TouchableOpacity>

      <TextInput
        multiline
        numberOfLines={4}
        placeholderTextColor={'#dadada'}
        placeholder="Comments"
        value={comment}
        onChangeText={async text => {
          setComment(text);
          await insertOrUpdateDbRecordCompletedMemorials(
            item,
            'comments',
            text,
          );
        }}
        style={styles.comments}
      />

      <TouchableOpacity
        onPress={() =>
          processPhotoAttachment(UI, setUI, item, setAttachment, t)
        }
        style={styles.attachment}>
        <Text style={styles.attachText}>{attachment}</Text>
        <Icon
          name={'paperclip'}
          size={20}
          color="#000"
          style={{
            ...styles.icon,
            marginRight: 0,
          }}
        />
      </TouchableOpacity>
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

export default SurveyQuestionItem;
