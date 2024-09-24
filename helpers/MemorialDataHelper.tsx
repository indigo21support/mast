import * as database from '@utils/AppSqliteDb.tsx';
import * as storage from '@utils/AppStorage.tsx';
import * as utils from '@utils/Utils';
import store from '@redux/store';
import {useTranslation} from 'react-i18next';
import {launchCamera} from 'react-native-image-picker';

export const viewActionMenu = (setPageInfo, setUI, UI, t) => {
  // Helper function to handle the repeated logic
  const handleMenuAction = async (category, storageCategory, dbValue) => {
    setPageInfo(prevPageInfo => ({
      ...prevPageInfo,
      category,
    }));

    await storage.set('currentCategory', storageCategory);

    await insertOrUpdateDbRecordCompletedMemorials(
      {
        questionNumber: 'Q1',
      },
      'passFail',
      dbValue,
    );
  };

  const menuActions = [
    {
      title: t('PASS'),
      category: 'PASS',
      storageCategory: 'passed',
      dbValue: 'passed',
    },
    {
      title: t('FAIL'),
      category: 'FAIL',
      storageCategory: 'failed',
      dbValue: 'failed',
    },
    {
      title: t('PASS BUT MONITOR'),
      category: 'PASS BUT MONITOR',
      storageCategory: 'pass but monitor',
      dbValue: 'pass but monitor',
    },
    {
      title: t('NO MEMORIAL PRESENT'),
      category: 'NO MEMORIAL PRESENT',
      storageCategory: 'no memorial present',
      dbValue: 'no memorial present',
    },
    {
      title: t('UNABLE TO LOCATE PLOT'),
      category: 'UNABLE TO LOCATE PLOT',
      storageCategory: 'unable to locate plot',
      dbValue: 'unable to locate plot',
    },
  ];

  setUI({
    ...UI,
    menu: true,
    menuTitle: t('SELECT ANSWER'),
    menuActions: menuActions.map(action => ({
      title: action.title,
      onPress: () =>
        handleMenuAction(
          action.category,
          action.storageCategory,
          action.dbValue,
        ),
    })),
  });
};

export const updateMemorialHeightData = async data => {
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

export const processPhotoAttachment = async (UI, setUI, item, setPageInfo) => {
  const result = await launchCamera({
    mediaType: 'photo',
    maxWidth: 768,
    maxHeight: 768,
  });

  await updateAttachmentInfo(item, result, setPageInfo);
};

// For Images functions
export const updateAttachmentInfo = async (item, result, setPageInfo) => {
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
  const count = await getAllPhotosByMemorialAndQuestions(
    item.questionNumber,
    setPageInfo,
  );

  setPageInfo(prevPageInfo => {
    return {
      ...prevPageInfo,
      attachment: count.length + ' Attached Photo(s)',
    };
  });
};

export const getAllPhotosByMemorialAndQuestions = async (
  questionNumber,
  setPageInfo,
) => {
  const memorialId = await storage.get('memorialId');
  const records = await database.getRecords(
    'CompletedMemorialPhotos',
    'memorialId = ? AND questionNumber = ?',
    [memorialId, questionNumber],
  );

  setPageInfo(prevPageInfo => {
    return {
      ...prevPageInfo,
      photos: records,
    };
  });
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

  // console.log(syncRecord[0]);

  const sqlCode = await utils.toSqlInsert(
    'completed_memorial_photos',
    utils.objToCamelCase(syncRecord[0]),
  );
  // console.log(sqlCode);

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

// end for Image functionalities

export const getCurrentMemorials = async item => {
  const memorialId = await storage.get('memorialId');

  const completedMemorials = await database.getRecords(
    'CompletedMemorials',
    'memorialId = ? AND questionNumber = ?',
    [memorialId, item.questionNumber],
  );

  return completedMemorials;
};

export const insertOrUpdateDbRecordCompletedMemorials = async (
  item,
  key,
  value,
) => {
  const memorialId = await storage.get('memorialId');
  const checkRecord = await getCurrentMemorials(item);
  const time = await utils.getMysqlTime();
  const dateTime = await utils.getMysqlDateTime();
  const userStr = await storage.get('user');
  const user = JSON.parse(userStr);
  const category = await storage.get('currentCategory');

  const state = store.getState();

  await storage.set(
    'lastLatLong',
    '' +
      state.geoLocation.latlong.latitude +
      '|' +
      state.geoLocation.latlong.longitude,
  );

  const dbValue = {
    memorialId: memorialId,
    time: time,
    geostamp:
      state.geoLocation.latlong.latitude +
      '|' +
      state.geoLocation.latlong.longitude,
    updatedAt: dateTime,
    comments: '',
    inspector: user['name'],
    questionNumber: item.questionNumber,
    passFail: category,
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
      pass_fail: category,
    },
    "memorial_id = '" +
      memorialId +
      "' AND question_number IN('Q1','Q2', 'Q3') ",
  );

  await database.insert('Sync', {
    key: 'memorialId-' + memorialId + '-update-other-question-number',
    Payload: sqlCodeUpdate,
    Status: 'PENDING',
    CreatedAt: utils.getMysqlDateTime(),
    UpdatedAt: utils.getMysqlDateTime(),
  });
};
