import {useEffect, useState} from 'react';
import * as storage from '@utils/AppStorage.tsx';
import * as database from '@utils/AppSqliteDb.tsx';
import config from '@config/config';
import store from '@redux/store';
import * as utils from '@utils/Utils';
import {StyleSheet, Text, View} from 'react-native';
import CheckBox from '@react-native-community/checkbox';

const QuestionCheckboxes = ({item}) => {
  const [isSelected, setCheckbox] = useState(false);

  useEffect(() => {
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
  }, [item]);

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
        Payload:
          `
            INSERT INTO completed_memorials SET 
            memorial_id = '${memorialId}',
            time = '${utils.getMysqlTime()}',
            geostamp = '` +
          state.geoLocation.latlong.latitude +
          '|' +
          state.geoLocation.latlong.longitude +
          `',
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
        value={isSelected}
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

const styles = StyleSheet.create({
  inlineCheckbox: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 50,
  },
});

export default QuestionCheckboxes;
