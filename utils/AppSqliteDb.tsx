import {enablePromise, openDatabase} from 'react-native-sqlite-storage';
import * as storage from '@utils/AppStorage';

const databaseName = 'MastApp.db';
const databaseVersion = '3';
const updateDatabaseMethod = 'drop';

enablePromise(true);

export const getDBConnection: unknown = async () => {
  return openDatabase({name: databaseName, location: 'default'});
};

export const initSqlite: void = async () => {
  initCreateTable();
  initAlterTable();
};

export const updateTable: void = async (table: string) => {
  const db = await getDBConnection();

  if (updateDatabaseMethod === 'drop') {
    await db.executeSql(`
        DROP TABLE IF EXISTS ${table}
    `);
  }
};

export const initCreateTable: void = async () => {
  const db = await getDBConnection();
  let storedDatabaseVersion = databaseVersion;

  if (await storage.exists('databaseVersion')) {
    storedDatabaseVersion = await storage.get('databaseVersion');
  } else {
    await storage.set('databaseVersion', databaseVersion.toString());
  }

  if (storedDatabaseVersion != databaseVersion) {
    await storage.set('databaseVersion', databaseVersion.toString());
    await updateTable('AppCache');
    await updateTable('Sync');
    await updateTable('FileSync');
    await updateTable('User');
    await updateTable('Jobs');
    await updateTable('Sections');
    await updateTable('CompletedMemorials');
    await updateTable('CompletedMemorialPhotos');
    await updateTable('MemorialHeights');
  }

  await db.executeSql(`
        CREATE TABLE IF NOT EXISTS AppCache (
            Id INTEGER PRIMARY KEY,
            Name TEXT,
            Payload BLOB,
            CreatedAt INTEGER,
            UpdatedAt INTEGER
        )
    `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS Sync (
        Id INTEGER PRIMARY KEY,
        Key TEXT,
        Payload BLOB,
        Status TEXT,
        CreatedAt INTEGER,
        UpdatedAt INTEGER
    )
  `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS FileSync (
        Id INTEGER PRIMARY KEY,
        Filename TEXT,
        Path TEXT,
        Status TEXT,
        CreatedAt INTEGER,
        UpdatedAt INTEGER
    )
  `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS MemorialHeights (
        Id INTEGER PRIMARY KEY,
        OriginalId INTEGER,
        Name TEXT,
        Status TEXT,
        CreatedAt INTEGER,
        UpdatedAt INTEGER
    )
  `);

  await db.executeSql(`
        CREATE TABLE IF NOT EXISTS User (
            Id INTEGER PRIMARY KEY,
            Name TEXT,
            Payload BLOB,
            CreatedAt INTEGER,
            UpdatedAt INTEGER
        )
    `);

  await db.executeSql(`
        CREATE TABLE IF NOT EXISTS Jobs (
            id INTEGER PRIMARY KEY,
            type TEXT,
            memorialId INTEGER,
            graveNumber TEXT,
            familyName TEXT,
            deadline INTEGER,
            section TEXT,
            sectionId INTEGER,
            statusId INTEGER,
            statusName TEXT,
            priorityId INTEGER,
            priorityName TEXT,
            categoryId INTEGER,
            categoryName TEXT,
            memorialHeightId INTEGER,
            memorialHeightName TEXT,
            cemeteryId INTEGER,
            cemeteryName TEXT,
            schemeLongName TEXT,
            schemeShortName TEXT,
            schemeDescription TEXT,
            questionSet TEXT,
            surveyQuestion TEXT,
            surveyQuestionSetId INTEGER,
            questions BLOB,
            column TEXT,
            direction TEXT
        )
    `);

  await db.executeSql(`
    CREATE TABLE IF NOT EXISTS Sections (
        id INTEGER PRIMARY KEY,
        originalSectionId INTEGER,
        name TEXT,
        sequence INTEGER,
        createdAt TEXT,
        status TEXT
    )
  `);

  await db.executeSql(`
      CREATE TABLE IF NOT EXISTS CompletedMemorials (
          id INTEGER PRIMARY KEY,
          memorialId INTEGER,
          time INTEGER,
          geostamp INTEGER,
          questionNumber TEXT,
          passFail TEXT,
          comments TEXT,
          inspector TEXT,
          createdAt TEXT,
          updatedAt TEXT,
          deletedAt TEXT
      )
      `);

  await db.executeSql(`
      CREATE TABLE IF NOT EXISTS CompletedMemorialPhotos (
          id INTEGER PRIMARY KEY,
          completedMemorialId INTEGER,
          memorialId INTEGER,
          questionNumber TEXT,
          filename TEXT,
          status TEXT,
          createdAt TEXT,
          updatedAt TEXT
      )
      `);
};

export const initAlterTable: void = async () => {
  console.log('nothing follows here');
};

export const insert: void = async (table: string, objects: unknown) => {
  const db = await getDBConnection();

  const keys = Object.keys(objects);

  let strKeys = '';
  let strValues = '';
  const values = [];

  for (const i in keys) {
    strKeys += (strKeys === '' ? '' : ',') + keys[i];
    strValues += (strValues === '' ? '' : ',') + '?';

    if (typeof objects[keys[i]] === 'object') {
      values.push(JSON.stringify(objects[keys[i]]));
    } else {
      values.push(objects[keys[i]]);
    }
  }

  await db.executeSql(
    `
        INSERT OR REPLACE INTO ${table}(${strKeys}) VALUES(${strValues})
    `,
    values,
  );
};

export const getRecords: unknown = async (
  table: string,
  whereCondition: string,
  whereArray: [],
  addons: '',
  columns: string = '',
) => {
  const responseObj = [];
  const db = await getDBConnection();

  addons = addons ?? '';

  const results = await db.executeSql(
    `SELECT ${columns !== '' ? columns : '*'}  FROM ${table}` +
      (whereCondition !== '' ? ' WHERE ' + whereCondition : '') +
      ' ' +
      addons +
      ' ',
    whereArray,
  );

  results.forEach(result => {
    for (let index = 0; index < result.rows.length; index++) {
      responseObj.push(result.rows.item(index));
    }
  });

  return responseObj;
};

export const update: void = async (
  table: string,
  objects: unknown,
  where: string,
  whereValue: string,
) => {
  const db = await getDBConnection();

  const keys = Object.keys(objects);

  console.log(keys);

  let strKeys = '';
  const values = [];

  for (const i in keys) {
    strKeys += (strKeys === '' ? '' : ',') + keys[i] + ' = ?';
    values.push(objects[keys[i]]);
  }

  values.push(whereValue);

  await db.executeSql(
    `
        UPDATE ${table} SET ${strKeys} WHERE ${where}
    `,
    values,
  );
};

export const remove: void = async (
  table: string,
  where: string,
  whereValue: [],
) => {
  const db = await getDBConnection();

  await db.executeSql(
    `
        DELETE FROM ${table} WHERE ${where}
    `,
    whereValue,
  );
};

initSqlite();
